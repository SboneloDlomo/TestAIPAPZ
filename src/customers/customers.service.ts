import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, VerificationResult } from './entities/customer.entity';
import { CustomerValidator } from './validators/customer.validator';
import { dynamoDBClient } from '../database/dynamoDBClient';
import {
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import {
  AUDIT_TRAIL_ACTION,
  CUSTOMER_STATUS,
  DOCUMENT_STATUS,
  DOCUMENT_TYPE,
} from '../enums/enum';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { ZaNationalIdValidator } from './validators/internal/za-national-id.validator';
import { SecureCitizenValidator } from './validators/external/secure-citizen.validator';
import { RekognitionNationalIdValidator } from './validators/internal/rekognition-national-id.validator';
import { CustomerDocument } from '../documents/entities/customerDocument.entity';
import { ProgressCalculator } from '../utils/calc-progress';
import {
  CreateFaceLivenessSessionCommandOutput,
  CreateFaceLivenessSessionCommandInput,
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommandInput,
  GetFaceLivenessSessionResultsCommandOutput,
  GetFaceLivenessSessionResultsCommand,
} from '@aws-sdk/client-rekognition';
import { LivenessResultDto } from './dto/liveness-result.dto';
import { DocumentsService } from '../documents/documents.service';
import { OFACValidator } from './validators/external/ofac.validator';
import { ConfigService } from '@nestjs/config';

const tableName = process.env.CUSTOMER_TABLE_NAME;
@Injectable()
export class CustomersService {
  private readonly auditTrailService = new AuditTrailService();
  private readonly s3Client = new S3Client(
    process.env.ENV?.startsWith('local')
      ? {
          region: process.env.AWS_REGION,
          endpoint: process.env.AWS_S3_ENDPOINT_URL,
        }
      : {
          region: process.env.AWS_REGION,
        },
  );
  constructor(
    @Inject(Logger)
    private readonly logger = Logger,
    @Inject(CustomerValidator)
    private customerValidator: CustomerValidator,
    @Inject(ZaNationalIdValidator)
    private zaNationalIdValidator: ZaNationalIdValidator,
    @Inject(SecureCitizenValidator)
    private secureCitizenValidator: SecureCitizenValidator,
    @Inject(RekognitionNationalIdValidator)
    private rekognitionNationalIdValidator: RekognitionNationalIdValidator,
    @Inject(OFACValidator)
    private ofacValidator: OFACValidator,
    @Inject(ProgressCalculator)
    private progressCalculator: ProgressCalculator,
    @Inject(DocumentsService)
    private documentsService: DocumentsService,
    private configService: ConfigService,
  ) {}
  async create(
    createCustomerDto: CreateCustomerDto,
    organisationId: string,
    requestedBy: string,
  ) {
    const customer = new Customer(
      createCustomerDto,
      organisationId,
      this.configService,
    );

    // Validate inputs:
    const duplicate: Customer = await this.findOne(organisationId, customer.id);
    if (duplicate) {
      this.logger.error(
        `Customer: Duplicate customer found with id (${customer.id})`,
      );
      throw new BadRequestException(
        `Duplicate customer found with id (${customer.id})`,
      );
    }
    this.logger.debug(
      `Customer: Attempting to validate customer with id (${customer.id})...`,
    );
    const { isValid, validationErrors } =
      await this.customerValidator.validateCustomer(customer);
    if (!isValid) {
      this.logger.error(
        `Customer: Validation failed for customer with id (${customer.id}): `,
        JSON.stringify(validationErrors),
      );
      throw new BadRequestException(validationErrors);
    } else {
      this.logger.debug(
        `Customer: Validation succeeded for customer with id (${customer.id}): `,
      );
    }

    //Save to the database:
    this.logger.debug(
      `Database: Attempting to create customer with id (${customer.id}) in table (${tableName}).`,
    );
    await dynamoDBClient.send(
      new PutCommand({
        TableName: tableName,
        Item: customer,
      }),
    );

    this.logger.debug(
      `Database: Successfully created customer with id (${customer.id}) in table (${tableName}).`,
    );

    this.auditTrailService.create(
      customer.id,
      customer.organisationId,
      requestedBy,
      AUDIT_TRAIL_ACTION.CUSTOMER_CREATED,
      undefined,
      customer,
    );

    return customer;
  }

  async findAll(organisationId: string) {
    try {
      this.logger.debug(
        `Database: Attempting to find all customers in table (${tableName}) for organisation with id (${organisationId})...`,
      );
      const results = await dynamoDBClient.send(
        new ScanCommand({
          TableName: tableName,
        }),
      );

      const filteredItems = results?.Items?.filter(
        (transaction) => transaction.organisationId === organisationId,
      ).map((customer: Customer) => customer);

      return filteredItems;
    } catch (error) {
      this.logger.error(
        `Database: Failed to find all customers in table (${tableName}) for organisation with id (${organisationId}).`,
        JSON.stringify(error),
      );
    }
  }

  async verify(
    id: string,
    organisationId: string,
    requestedBy: string,
  ): Promise<Customer> {
    const entity = Object.create(Customer);
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id, organisationId },
      }),
    );
    if (!result?.Item) {
      throw new NotFoundException(
        `Customer with id (${id}) not found in database`,
      );
    }

    Object.assign(entity, result?.Item);
    entity.verificationResults = [];

    const missingDocs = entity.documents
      .filter(
        (doc: CustomerDocument) =>
          doc.documentStatus != DOCUMENT_STATUS.UPLOADED,
      )
      .map((d: CustomerDocument) => d.documentType)
      .join(', ');

    if (missingDocs) {
      throw new BadRequestException(
        `Please upload all required documents: ${missingDocs}`,
      );
    }

    const org = this.configService
      .get('organisations')
      .find((o) => o.id === organisationId && o.isDeleted !== true);
    const requiredDocs: string[] = org?.serviceConfig?.KYC?.requiredValidations;

    // TODO: Add check for selected verification templates here:
    // Currently not necessary because we are only validating South African IDs, so run all checks (1 === 1):
    if (entity) {
      const verifications: Array<VerificationResult> =
        await this.zaNationalIdValidator.validateCustomer(entity);
      entity.verificationResults =
        entity.verificationResults.concat(verifications);
    }

    if (requiredDocs.includes(DOCUMENT_TYPE.NATIONAL_ID)) {
      const { verifications, govIdPhoto } =
        await this.secureCitizenValidator.validateCustomer(entity);
      entity.verificationResults =
        entity.verificationResults.concat(verifications);
      if (govIdPhoto) {
        // Prevent duplicate documents from being added to the array:
        entity.documents = entity.documents.filter(function (
          cd: CustomerDocument,
        ) {
          return cd.documentType !== DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO;
        });
        // Add the latest government ID photo (if it was received):
        entity.documents.push(govIdPhoto);
      }
    }

    if (
      requiredDocs.includes(DOCUMENT_TYPE.NATIONAL_ID) &&
      (requiredDocs.includes(DOCUMENT_TYPE.SELFIE) ||
        requiredDocs.includes(DOCUMENT_TYPE.LIVENESS))
    ) {
      const verifications: Array<VerificationResult> =
        await this.rekognitionNationalIdValidator.validateCustomer(entity);
      entity.verificationResults =
        entity.verificationResults.concat(verifications);
    }

    if (requiredDocs.includes(DOCUMENT_TYPE.NATIONAL_ID)) {
      const verifications: Array<VerificationResult> =
        await this.ofacValidator.validateCustomer(entity);
      entity.verificationResults =
        entity.verificationResults.concat(verifications);
    }

    // Calculate progress and status:
    const { overallProgressPercent, failureCount, warningCount } =
      this.progressCalculator.calculateProgress(entity);
    entity.progress = overallProgressPercent;
    if (warningCount > 0) {
      entity.manualVerificationRequested = true;
      entity.customerStatus = CUSTOMER_STATUS.NOT_VERIFIED;
      entity.customerStatusReason = `One or more warnings occurred during the verification process.`;
    }
    if (failureCount > 0) {
      entity.customerStatus = CUSTOMER_STATUS.FAILED;
      entity.customerStatusReason = `One or more failures occurred during the verification process.`;
    }
    if (
      overallProgressPercent === 100 &&
      warningCount === 0 &&
      failureCount === 0
    ) {
      entity.verified = true;
      entity.manuallyVerifiedBy = undefined;
      entity.dateVerified = new Date().getTime();
      entity.customerStatus = CUSTOMER_STATUS.VERIFIED;
      entity.customerStatusReason = `Automatically verified by system.`;
    }

    //Save to the database:
    this.logger.debug(
      `Database: Attempting to update customer with id (${id}) in table (${tableName}).`,
    );
    await dynamoDBClient.send(
      new PutCommand({
        TableName: tableName,
        Item: entity,
      }),
    );
    this.logger.debug(
      `Database: Successfully updated customer with id (${id}) in table (${tableName}).`,
    );

    this.auditTrailService.create(
      entity.id,
      entity.organisationId,
      requestedBy,
      AUDIT_TRAIL_ACTION.VALIDATION,
      result.Item,
      entity,
    );

    return entity;
  }

  async findOne(organisationId: string, id: string): Promise<Customer> {
    const entity = Object.create(Customer);
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id, organisationId },
      }),
    );

    if (
      !result?.Item ||
      result?.Item?.isDeleted === true ||
      result?.Item?.organisationId != organisationId
    ) {
      return undefined;
    } else {
      Object.assign(entity, result?.Item);
      return entity;
    }
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    organisationId: string,
    requestedBy: string,
  ): Promise<Customer> {
    const entity = Object.create(Customer);
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id, organisationId },
      }),
    );
    if (!result?.Item || result?.Item?.organisationId != organisationId) {
      throw new NotFoundException(
        `Customer with id (${id}) not found in database`,
      );
    } else {
      Object.assign(entity, result?.Item);
      Object.assign(entity, updateCustomerDto);

      //Override the automatic verification process:
      if (updateCustomerDto.manuallyVerified === true) {
        entity.verified = true;
        entity.manuallyVerifiedBy = requestedBy;
        entity.dateVerified = new Date().getTime();
        entity.customerStatus = CUSTOMER_STATUS.VERIFIED;
        entity.customerStatusReason = `Manually verified by ${requestedBy}.`;
      } else if (updateCustomerDto.manuallyVerified === false) {
        entity.verified = false;
        entity.manuallyVerifiedBy = requestedBy;
        entity.dateVerified = new Date().getTime();
        entity.customerStatus = CUSTOMER_STATUS.REJECTED;
        entity.customerStatusReason = `Manually rejected by ${requestedBy}.`;
      }

      //Save to the database:
      this.logger.debug(
        `Database: Attempting to update customer with id (${id}) in table (${tableName}).`,
      );
      await dynamoDBClient.send(
        new PutCommand({
          TableName: tableName,
          Item: entity,
        }),
      );
      this.logger.debug(
        `Database: Successfully updated customer with id (${id}) in table (${tableName}).`,
      );

      this.auditTrailService.create(
        entity.id,
        entity.organisationId,
        requestedBy,
        AUDIT_TRAIL_ACTION.CUSTOMER_UPDATED,
        result.Item,
        entity,
      );

      return entity;
    }
  }

  async remove(organisationId: string, id: string, requestedBy: string) {
    // Find the customer:
    const entity = Object.create(Customer);
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id, organisationId },
      }),
    );
    if (!result?.Item || result?.Item?.organisationId != organisationId) {
      throw new NotFoundException(
        `Customer with id (${id}) not found in database`,
      );
    }

    try {
      // Delete the S3 documents:
      Object.assign(entity, result?.Item);
      const keys = [];
      entity?.documents?.forEach((doc) => {
        if (doc.uploadedFileName) {
          keys.push({ Key: doc.uploadedFileName });
        }
      });
      if (keys.length > 0) {
        const input = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Delete: {
            Objects: keys,
            Quiet: false,
          },
        };

        const command = new DeleteObjectsCommand(input);
        await this.s3Client.send(command);
      }
      // Delete from database:
      await dynamoDBClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { id, organisationId },
        }),
      );

      this.auditTrailService.create(
        entity.id,
        entity.organisationId,
        requestedBy,
        AUDIT_TRAIL_ACTION.CUSTOMER_DELETED,
        undefined,
        undefined,
      );

      return;
    } catch (error) {
      this.logger.error(
        `Error while deleting customer with id (${id}): `,
        JSON.stringify(error),
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  async createLivenessSession(
    customerId: string,
    organisationId: string,
  ): Promise<string> {
    const entity = this.findOne(customerId, organisationId);
    if (!entity) {
      throw new NotFoundException(
        `Customer with id (${customerId}) not found in database`,
      );
    }

    try {
      const rekognitionClient = new RekognitionClient({
        region: process.env.AWS_REGION,
      });

      const input: CreateFaceLivenessSessionCommandInput = {
        Settings: {
          AuditImagesLimit: 1,
        },
        ClientRequestToken: `${organisationId}_${customerId}`,
      };
      const command = new CreateFaceLivenessSessionCommand(input);
      const result: CreateFaceLivenessSessionCommandOutput =
        await rekognitionClient.send(command);

      const sessionId = result.SessionId;
      return sessionId;
    } catch (error) {
      this.logger.error(
        `Error while creating liveness session for customer with id (${customerId}): `,
        error.message,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  async resultLivenessSession(
    customerId: string,
    organisationId: string,
    sessionId: string,
  ): Promise<LivenessResultDto> {
    const entity = this.findOne(customerId, organisationId);
    if (!entity) {
      throw new NotFoundException(
        `Customer with id (${customerId}) not found in database`,
      );
    }
    try {
      const rekognitionClient = new RekognitionClient({
        region: process.env.AWS_REGION,
      });

      const input: GetFaceLivenessSessionResultsCommandInput = {
        SessionId: sessionId,
      };

      const command = new GetFaceLivenessSessionResultsCommand(input);
      const result: GetFaceLivenessSessionResultsCommandOutput =
        await rekognitionClient.send(command);

      const response: LivenessResultDto = {
        sessionId: result?.SessionId,
        confidence: result?.Confidence,
        status: result?.Status,
      };

      if (
        result?.Status === 'SUCCEEDED' &&
        +result?.Confidence > 90 &&
        result?.ReferenceImage?.Bytes
      ) {
        // Upload reference image to S3:
        const buffer = Buffer.from(result?.ReferenceImage?.Bytes);

        await this.documentsService.uploadFile(
          'LIVENESS.jpg',
          buffer,
          customerId,
          organisationId,
          DOCUMENT_TYPE.LIVENESS,
          'Liveness',
        );
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Error while processing liveness verification for customer with id (${customerId}): `,
        error.message,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
