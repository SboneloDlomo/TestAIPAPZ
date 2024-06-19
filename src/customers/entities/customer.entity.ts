import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CUSTOMER_STATUS, DOCUMENT_STATUS } from '../../enums/enum';
import { CustomerDocument } from '../../documents/entities/customerDocument.entity';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';

export class VerificationResult {
  @ApiProperty({
    example: 'South African National ID verification',
    required: true,
    description: 'The user-friendly description of what test was run.',
  })
  verificationName: string;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description:
      'Indicates if the verification process passed (true) or failed (false). Undefined indicates the test has not yet been run.',
  })
  passed?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description:
      'Indicates if the verification process had problems (true) or not (false). Undefined indicates the test has not yet been run. If true, this will trigger a manual verfication request.',
  })
  warning?: boolean;

  @ApiProperty({
    example: 'Identity document number does not match with gender',
    required: false,
    description:
      'A user-friendly description of the verification result indicating any problems.',
  })
  details?: string;

  @ApiProperty({
    example: 1705047330000,
    required: true,
    description:
      'The UTC timestamp at the time that this verfication test was run.',
  })
  dateCreated: number;
}
export class Customer extends PartialType(CreateCustomerDto) {
  @ApiProperty({
    example: '453f919c-f18a-4b90-ac3e-a8c8de4822c4',
    required: false,
    description: `A unique identifier assigned by the KYC system that identifies this person internally.`,
  })
  id: string;

  @ApiProperty({
    example: '5ed22776-c3c3-45e7-ad00-60dc02c16721',
    required: true,
    description: `A unique identifier assigned by the KYC system that identifies this person's organisation. This is unique per organisation. Any KYC actions will be billed to this organisation.`,
  })
  organisationId: string;

  @ApiProperty({
    example: [],
    required: true,
    description: `An array of this custom's uploaded documents.`,
  })
  documents: CustomerDocument[];

  @ApiProperty({
    example: CUSTOMER_STATUS.IN_PROGRESS,
    required: true,
    default: 'New',
    enum: CUSTOMER_STATUS,
    description: `The current status of this cusomer's KYC application.`,
  })
  customerStatus: CUSTOMER_STATUS;

  @ApiProperty({
    example: 'Waiting for document(s) to be uploaded.',
    required: true,
    description: `The reason for the current status of this cusomer's KYC application.`,
  })
  customerStatusReason: string;

  @ApiProperty({
    example: true,
    required: false,
    default: false,
    description: `Indicates if the customer, organisation, or KYC system has requested this customer's documentaion be manually reviewed and approved by an authorised user.`,
  })
  manualVerificationRequested?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description: `Indicates if an authorised user has manually marked this custmer as verified.`,
  })
  manuallyVerified?: boolean;

  @ApiProperty({
    example: 'Supervisor Bob Smith',
    required: false,
    default: '',
    description: `Indicates which user manually marked this custmer as verified.`,
  })
  manuallyVerifiedBy?: string;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description: `Indicates if this custmer has been verified.`,
  })
  verified?: boolean;

  @ApiProperty({
    example: 1705047330000,
    required: false,
    default: undefined,
    description:
      'The UTC timestamp at the time that this customer was marked as verified.',
  })
  dateVerified?: number;

  @ApiProperty({
    example: [],
    required: false,
    description: `An array of the results of the automated KYC verification process.`,
  })
  verificationResults?: VerificationResult[];

  @ApiProperty({
    example: 67,
    required: true,
    default: 0,
    description: `The current percentage of progress in this cusomer's KYC application.`,
  })
  progress: number;

  @ApiProperty({
    example: 1705047285000,
    required: true,
    description:
      'The UTC timestamp at the time that this customer was first created.',
  })
  dateCreated: number;

  @ApiProperty({
    example: 1705047330000,
    required: true,
    description:
      'The UTC timestamp at the time that this customer was last updated.',
  })
  dateUpdated: number;

  constructor(
    createCustomerDto: CreateCustomerDto,
    organisationId: string,
    configService: ConfigService,
  ) {
    super();
    this.id = createCustomerDto.id;
    this.organisationId = organisationId;
    this.firstName = createCustomerDto.firstName.trim() || '';
    this.middleNames = createCustomerDto.middleNames.trim() || '';
    this.lastName = createCustomerDto.lastName.trim() || '';
    this.gender = createCustomerDto.gender;
    this.email = (createCustomerDto.email || '').trim().toLowerCase();
    this.cellPhone = createCustomerDto.cellPhone || '';
    this.homePhone = createCustomerDto.homePhone || '';
    this.workPhone = createCustomerDto.workPhone || '';
    this.physicalAddressLine1 = createCustomerDto.physicalAddressLine1 || '';
    this.physicalAddressLine2 = createCustomerDto.physicalAddressLine2 || '';
    this.physicalAddressLine3 = createCustomerDto.physicalAddressLine3 || '';
    this.physicalAddressCity = createCustomerDto.physicalAddressCity || '';
    this.physicalAddressRegion = createCustomerDto.physicalAddressRegion || '';
    this.physicalAddressCountry =
      createCustomerDto.physicalAddressCountry || '';
    this.physicalAddressCode = isNaN(createCustomerDto.physicalAddressCode)
      ? undefined
      : createCustomerDto.physicalAddressCode;
    this.postalAddressLine1 = createCustomerDto.postalAddressLine1 || '';
    this.postalAddressLine2 = createCustomerDto.postalAddressLine2 || '';
    this.postalAddressLine3 = createCustomerDto.postalAddressLine3 || '';
    this.postalAddressCity = createCustomerDto.postalAddressCity || '';
    this.postalAddressRegion = createCustomerDto.postalAddressRegion || '';
    this.postalAddressCountry = createCustomerDto.postalAddressCountry || '';
    this.postalAddressCode = isNaN(createCustomerDto.postalAddressCode)
      ? undefined
      : createCustomerDto.postalAddressCode;
    this.identityDocumentCountry = createCustomerDto.identityDocumentCountry;
    this.identityDocumentNumber = createCustomerDto.identityDocumentNumber
      .trim()
      .toUpperCase();
    this.identityDocumentType = createCustomerDto.identityDocumentType;
    this.dateOfBirth = isDate(createCustomerDto.dateOfBirth)
      ? moment(new Date(createCustomerDto.dateOfBirth)).format('YYYY-MM-DD')
      : undefined;
    this.countryOfBirth = createCustomerDto.countryOfBirth;
    this.customerStatus = CUSTOMER_STATUS.NEW;
    this.customerStatusReason = 'New KYC request received.';
    this.manualVerificationRequested = false;
    this.verificationResults = [];
    this.progress = 0;
    this.dateCreated = new Date().getTime();
    this.dateUpdated = new Date().getTime();

    this.documents = [];
    const org = configService
      .get('organisations')
      .find((o) => o.id === organisationId && o.isDeleted !== true);
    const requiredDocs = org?.serviceConfig?.KYC?.requiredValidations;
    if (requiredDocs?.length > 0) {
      requiredDocs.forEach((doc) => {
        this.documents.push({
          documentType: doc,
          documentStatus: DOCUMENT_STATUS.MISSING,
        });
      });
    }
  }
}

function isDate(object: any): boolean {
  return !isNaN(new Date(object).getTime());
}
