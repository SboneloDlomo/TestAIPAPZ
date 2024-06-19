import { ApiProperty } from '@nestjs/swagger';
import { DOCUMENT_STATUS, DOCUMENT_TYPE } from '../../enums/enum';

export class CustomerDocument {
  @ApiProperty({
    example: 'Passport',
    required: true,
    enum: DOCUMENT_TYPE,
    description: `The type of document that was uploaded for verification.`,
  })
  documentType: DOCUMENT_TYPE;

  @ApiProperty({
    example: 'jpg',
    required: false,
    description: `The file extension of the uploaded document.`,
  })
  fileExtension?: string;

  @ApiProperty({
    example: 'my_passport.jpg',
    required: false,
    description: `The original name of the file that was uploaded from the user's device.`,
  })
  originalFileName?: string;

  @ApiProperty({
    example:
      '5ed22776-c3c3-45e7-ad00-60dc02c16721_453f919c-f18a-4b90-ac3e-a8c8de4822c4_Passport.jpg',
    required: false,
    description: `The current file name of the uploaded file. This is a derived from "organisationId_customerId_documentType.fileExtension"`,
  })
  uploadedFileName?: string;

  @ApiProperty({
    example: DOCUMENT_STATUS.UPLOADED,
    required: true,
    default: DOCUMENT_STATUS.MISSING,
    enum: DOCUMENT_STATUS,
    description: `The current status of this document.`,
  })
  documentStatus: DOCUMENT_STATUS;

  @ApiProperty({
    example: 1705047285000,
    required: false,
    default: undefined,
    description:
      'The UTC timestamp at the time that this document was uploaded.',
  })
  dateUploaded?: number;
}
