import {
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Headers,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiTags,
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { DOCUMENT_TYPE } from '../enums/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlternateAuthenticationService } from '../utils/alt-authentication';
import { CustomerDocument } from './entities/customerDocument.entity';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly alternateAuthenticationService: AlternateAuthenticationService,
  ) {}

  @Post('/upload/:customerid/:doctype')
  @ApiTags('Document')
  @ApiBasicAuth()
  @ApiHeader({
    name: 'RequestedBy',
    required: true,
    description:
      'This header value should clearly indicate who triggered this request. It could be a user ID, customer name, email address, or any other value that will allow accurate tracking of who made changes and when.',
  })
  @ApiOperation({
    summary:
      'Upload a single document for the designated customer. If an existing document of the same type is found, it will be overwritten.',
  })
  @ApiCreatedResponse({
    status: 201,
    description: 'OK. Document uploaded.',
    type: CustomerDocument,
  })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Unauthorized. Confirm your ID and APIKey are valid.',
    schema: {
      type: 'object',
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'The customer could not be found in the database.',
    schema: {
      type: 'object',
      example: {
        message:
          'Customer with id (1650b58c-b6bf-4f72-945c-6c7a03002375) not found in database',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'The document type is invalid',
    schema: {
      type: 'object',
      example: {
        message:
          'Invalid input: documentType (Medical Aid Card) is not recognised',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Headers() headers: any,
    @Param('customerid') customerId: string,
    @Param('doctype') documentType: DOCUMENT_TYPE,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10485760 }),
          new FileTypeValidator({
            fileType: '.(png|jpeg|jpg)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<CustomerDocument> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    const requestedBy = headers.requestedby;
    if (documentType === DOCUMENT_TYPE.LIVENESS) {
      throw new HttpException(
        `Invalid input: (${DOCUMENT_TYPE.LIVENESS}) can only be uploaded by calling the liveness API end-point`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (orgId) {
      return await this.documentsService.uploadFile(
        file.originalname,
        file.buffer,
        customerId,
        orgId,
        documentType,
        requestedBy,
      );
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('/preview/:customerid/:doctype')
  @ApiTags('Document')
  @ApiBasicAuth()
  @ApiOperation({
    summary:
      'Create a preview link to an existing uploaded document for the designated customer. The link will expire are 1 minute.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK. Document preview link created.',
  })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Unauthorized. Confirm your ID and APIKey are valid.',
    schema: {
      type: 'object',
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'The customer or document could not be found in the database.',
    schema: {
      type: 'object',
      example: {
        message:
          'Customer with id (1650b58c-b6bf-4f72-945c-6c7a03002375) not found in database',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'The document type is invalid',
    schema: {
      type: 'object',
      example: {
        message:
          'Invalid input: documentType (Medical Aid Card) is not recognised',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async previewFile(
    @Headers() headers: any,
    @Param('customerid') customerId: string,
    @Param('doctype') documentType: DOCUMENT_TYPE,
  ): Promise<string> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return await this.documentsService.previewFile(
        customerId,
        orgId,
        documentType,
      );
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
