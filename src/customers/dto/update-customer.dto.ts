import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
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
    description: `Indicates if an authorised user has manually marked this custmer as verified (true) or rejected (false).`,
  })
  manuallyVerified?: boolean;

  @ApiProperty({
    example: 'Supervisor Bob Smith',
    required: false,
    default: '',
    description: `Indicates which user manually marked this custmer as verified or rejected.`,
  })
  manuallyVerifiedBy?: string;
}
