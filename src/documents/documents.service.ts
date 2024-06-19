import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  AUDIT_TRAIL_ACTION,
  DOCUMENT_STATUS,
  DOCUMENT_TYPE,
} from '../enums/enum';
import { dynamoDBClient } from '../database/dynamoDBClient';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerDocument } from './entities/customerDocument.entity';
import { ProgressCalculator } from '../utils/calc-progress';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3 } from 'aws-sdk';

const tableName = process.env.CUSTOMER_TABLE_NAME;
@Injectable()
export class DocumentsService {
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
    @Inject(ProgressCalculator)
    private progressCalculator: ProgressCalculator,
    @Inject(Logger)
    private logger: Logger,
  ) {}
  async uploadFile(
    fileName: string,
    file: Buffer,
    id: string,
    organisationId: string,
    documentType: DOCUMENT_TYPE,
    requestedBy: string,
  ): Promise<CustomerDocument> {
    // Validate:
    if (!(<any>Object).values(DOCUMENT_TYPE).includes(documentType)) {
      throw new BadRequestException(
        `Invalid input: documentType (${documentType}) is not recognised`,
      );
    }
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
      throw new NotFoundException(
        `Customer with id (${id}) not found in database`,
      );
    } else {
      Object.assign(entity, result?.Item);
    }

    try {
      this.logger.debug(
        `Customer: Attempting to upload document for customer with id (${id})...`,
      );
      // Get file details and validate:
      const fileNameParts = fileName.split('.');
      const fileExtension =
        fileNameParts.length > 0
          ? fileNameParts[fileNameParts.length - 1]
          : 'unk';
      const newFileName = `${organisationId}_${id}_${documentType.toUpperCase().split(' ').join('')}.${fileExtension}`;

      // Upload to AwS S3 bucket:
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: newFileName,
          Body: file,
        }),
      );
      this.logger.debug(
        `Customer: Upload document succeeded for customer with id (${id}): `,
        newFileName,
      );

      // Save doc details to customer in database:
      this.logger.debug(
        `Customer: Attempting to save uploaded document details to database for customer with id (${id})...`,
      );

      const uploadedDoc: CustomerDocument = {
        documentType: documentType,
        fileExtension: fileExtension,
        originalFileName: fileName,
        uploadedFileName: newFileName,
        documentStatus: DOCUMENT_STATUS.UPLOADED,
        dateUploaded: new Date().getTime(),
      };
      let overwrite = false;
      entity.documents?.forEach((doc) => {
        if (doc.documentType === uploadedDoc.documentType) {
          Object.assign(doc, uploadedDoc);
          overwrite = true;
        }
      });
      if (!overwrite) {
        entity.documents?.push(uploadedDoc);
      }

      entity.progress = this.progressCalculator.calculateProgress(entity);
      // Calculate progress and status:
      const { overallProgressPercent } =
        this.progressCalculator.calculateProgress(entity);
      entity.progress = overallProgressPercent;

      await dynamoDBClient.send(
        new PutCommand({
          TableName: tableName,
          Item: entity,
        }),
      );

      this.auditTrailService.create(
        entity.id,
        entity.organisationId,
        requestedBy,
        AUDIT_TRAIL_ACTION.DOCUMENT_UPLOADED,
        result?.Item?.documents,
        entity?.documents,
      );

      return uploadedDoc;
    } catch (error) {
      this.logger.error(
        `Customer: Upload document failed for customer with id (${id}): `,
        error.message,
      );
      throw new InternalServerErrorException(error.message);
    }
  }

  async previewFile(
    id: string,
    organisationId: string,
    documentType: DOCUMENT_TYPE,
  ): Promise<string> {
    // Validate:
    if (!(<any>Object).values(DOCUMENT_TYPE).includes(documentType)) {
      throw new BadRequestException(
        `Invalid input: documentType (${documentType}) is not recognised`,
      );
    }
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
      throw new NotFoundException(
        `Customer with id (${id}) not found in database`,
      );
    } else {
      Object.assign(entity, result?.Item);
    }

    const docToGet: CustomerDocument = entity.documents?.find(
      (doc) => doc.documentType === documentType,
    );
    if (
      !docToGet ||
      !docToGet?.uploadedFileName ||
      docToGet?.uploadedFileName === ''
    ) {
      throw new NotFoundException(
        `Customer with id (${id}) does not have a document of type (${documentType}) in database`,
      );
    }

    try {
      this.logger.debug(
        `Customer: Attempting to create preview link for document for customer with id (${id})...`,
      );

      const s3 = new S3(
        process.env.ENV?.startsWith('local')
          ? {
              region: process.env.AWS_REGION,
              endpoint: process.env.AWS_S3_ENDPOINT_URL,
            }
          : {
              region: process.env.AWS_REGION,
            },
      );

      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: docToGet.uploadedFileName,
        Expires: 60,
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      this.logger.error(
        `Customer: Preview document failed for customer with id (${id}): `,
        error.message,
      );
      throw new InternalServerErrorException(error.message);
    }
  }
}
