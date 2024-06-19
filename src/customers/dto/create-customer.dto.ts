import { ApiProperty } from '@nestjs/swagger';
import { COUNTRY, GENDER, ID_DOCUMENT_TYPE } from '../../enums/enum';
export class CreateCustomerDto {
  @ApiProperty({
    example: 'CUST-001-1234',
    required: true,
    description: `This is a unique identifier for this customer, generated outside of the KYC system, and passed as a means of tracking individual customers.`,
  })
  id: string;

  @ApiProperty({
    example: 'Joe',
    required: true,
    description: `This person's first name as it appears on their birth certificate or ID.`,
  })
  firstName: string;

  @ApiProperty({
    example: 'Ashley',
    required: true,
    description: `This person's middle name(s), if any, as they appear on their birth certificate or ID.`,
  })
  middleNames: string;

  @ApiProperty({
    example: 'Smith',
    required: true,
    description: `This person's last name as it appears on their birth certificate or ID.`,
  })
  lastName: string;

  @ApiProperty({
    example: GENDER.FEMALE,
    required: true,
    enum: GENDER,
    description: `This person's gender.`,
  })
  gender: GENDER;

  @ApiProperty({
    example: 2161,
    required: true,
    description: `This person's ID number as it appears in their identity document.`,
  })
  identityDocumentNumber: string;

  @ApiProperty({
    example: ID_DOCUMENT_TYPE.PASSPORT,
    required: true,
    enum: ID_DOCUMENT_TYPE,
    description: `The type of government-issued identity document this person will be using to verify their identity.`,
  })
  identityDocumentType: ID_DOCUMENT_TYPE;

  @ApiProperty({
    example: COUNTRY.ZA,
    required: true,
    enum: COUNTRY,
    description: `The country that issued this person's identity document.`,
  })
  identityDocumentCountry: COUNTRY;

  @ApiProperty({
    example: '1995-08-23',
    required: true,
    format: 'YYYY-MM-DD',
    description: `This person's full date of birth.`,
  })
  dateOfBirth: string;

  @ApiProperty({
    example: COUNTRY.ZA,
    required: true,
    enum: COUNTRY,
    description: `This person's country of birth.`,
  })
  countryOfBirth: COUNTRY;

  @ApiProperty({
    example: 'joe@smith.com',
    required: false,
    description: `This person's primary email address.`,
  })
  email?: string;

  @ApiProperty({
    example: '+27891231234',
    required: false,
    description: `This person's mobile phone number.`,
  })
  cellPhone?: string;

  @ApiProperty({
    example: '+27111231234',
    required: false,
    description: `This person's land-line number at their current place of residence.`,
  })
  homePhone?: string;

  @ApiProperty({
    example: '+27121231234',
    required: false,
    description: `This person's land-line number at their current place of employment.`,
  })
  workPhone?: string;

  @ApiProperty({
    example: '123 Some Street',
    required: false,
    description: `This person's physical place of residence. Typically a street name and number, or complex name and unit number.`,
  })
  physicalAddressLine1?: string;

  @ApiProperty({
    example: 'Anytown',
    required: false,
    description: `This person's physical place of residence. Typically the name of the town or suburb.`,
  })
  physicalAddressLine2?: string;

  @ApiProperty({
    example: 'Extension 17',
    required: false,
    description: `This person's physical place of residence. Typically the name of the zone or council.`,
  })
  physicalAddressLine3?: string;

  @ApiProperty({
    example: 'Metropolis',
    required: false,
    description: `This person's physical place of residence. Typically the name of the city or metro.`,
  })
  physicalAddressCity?: string;

  @ApiProperty({
    example: 'Gauteng',
    required: false,
    description: `This person's physical place of residence. The name of the state, province, or region.`,
  })
  physicalAddressRegion?: string;

  @ApiProperty({
    example: 'South Africa',
    required: false,
    description: `This person's physical place of residence. The name of the country.`,
  })
  physicalAddressCountry?: string;

  @ApiProperty({
    example: 2161,
    required: false,
    description: `This person's physical place of residence. The street code or zip code.`,
  })
  physicalAddressCode?: number;

  @ApiProperty({
    example: 'PO Box 1234',
    required: false,
    description: `This person's postal address. Typically a street name and number, or a PO box number.`,
  })
  postalAddressLine1?: string;

  @ApiProperty({
    example: 'Anytown',
    required: false,
    description: `This person's postal address. Typically the name of the town or suburb.`,
  })
  postalAddressLine2?: string;

  @ApiProperty({
    example: 'Extension 17',
    required: false,
    description: `This person's postal address. Typically the name of the zone or council.`,
  })
  postalAddressLine3?: string;

  @ApiProperty({
    example: 'Metropolis',
    required: false,
    description: `This person's postal address. Typically the name of the city or metro.`,
  })
  postalAddressCity?: string;

  @ApiProperty({
    example: 'Gauteng',
    required: false,
    description: `This person's postal address. The name of the state, province, or region.`,
  })
  postalAddressRegion?: string;

  @ApiProperty({
    example: 'South Africa',
    required: false,
    description: `This person's postal address. The name of the country.`,
  })
  postalAddressCountry?: string;

  @ApiProperty({
    example: 2161,
    required: false,
    description: `This person's postal address. The street code or zip code.`,
  })
  postalAddressCode?: number;
}
