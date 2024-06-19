import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  HttpException,
  HttpStatus,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiHeader,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiOkResponse,
  ApiParam,
  ApiBasicAuth,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { AlternateAuthenticationService } from '../utils/alt-authentication';
import { LivenessResultDto } from './dto/liveness-result.dto';
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly alternateAuthenticationService: AlternateAuthenticationService,
  ) {}

  @Post()
  @ApiTags('Customer')
  @ApiBasicAuth()
  @ApiHeader({
    name: 'RequestedBy',
    required: true,
    description:
      'This header value should clearly indicate who triggered this request. It could be a user ID, customer name, email address, or any other value that will allow accurate tracking of who made changes and when.',
  })
  @ApiOperation({
    summary: 'Create a new customer for KYC validation.',
  })
  @ApiCreatedResponse({
    status: 201,
    description: 'OK. Customer created.',
    type: Customer,
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
  @ApiBadRequestResponse({
    status: 400,
    description:
      'The request contains invalid or missing values. Check the error message for more details.',
    schema: {
      type: 'object',
      example: {
        message: [
          'Invalid input: identityDocumentNumber does not match with gender',
          'Invalid input: identityDocumentNumber does not match with dateOfBirth',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Headers() headers: any,
  ): Promise<Customer> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    const requestedBy = headers.requestedby;
    if (orgId) {
      return this.customersService.create(
        createCustomerDto,
        orgId,
        requestedBy,
      );
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get()
  @ApiTags('Customer')
  @ApiBasicAuth()
  @ApiOperation({
    summary: 'Get an array of all customers.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK.',
    type: [Customer],
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
  async findAll(@Headers() headers: any): Promise<Customer[]> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return this.customersService.findAll(orgId);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get(':id')
  @ApiTags('Customer')
  @ApiBasicAuth()
  @ApiParam({
    name: 'id',
    description: 'The unique id of the customer to get.',
  })
  @ApiOperation({
    summary: 'Get a single customer by ID.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK.',
    type: Customer,
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
  async findOne(
    @Param('id') id: string,
    @Headers() headers: any,
  ): Promise<Customer> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return this.customersService.findOne(orgId, id);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('/verify/:id')
  @ApiTags('Customer')
  @ApiBasicAuth()
  @ApiHeader({
    name: 'RequestedBy',
    required: true,
    description:
      'This header value should clearly indicate who triggered this request. It could be a user ID, customer name, email address, or any other value that will allow accurate tracking of who made changes and when.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique id of the customer to verify.',
  })
  @ApiOperation({
    summary: `Verify a single customer's info by ID. This is an automatic process that uses the captured info, uploaded documents, images, and various external agencies. The customer must have given you permission to perform these checks before proceeding.`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK.',
    type: Customer,
  })
  @ApiBadRequestResponse({
    status: 400,
    description:
      'Not all pre-conditions for automatic verification have been met. Check if all required documents have been uploaded.',
    schema: {
      type: 'object',
      example: {
        message: 'Please upload the required document(s): National ID, Selfie',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
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
  async verify(
    @Param('id') id: string,
    @Headers() headers: any,
  ): Promise<Customer> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    const requestedBy = headers.requestedby;
    if (orgId) {
      return this.customersService.verify(id, orgId, requestedBy);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Delete(':id')
  @ApiTags('Customer')
  @ApiBasicAuth()
  @ApiHeader({
    name: 'RequestedBy',
    required: true,
    description:
      'This header value should clearly indicate who triggered this request. It could be a user ID, customer name, email address, or any other value that will allow accurate tracking of who made changes and when.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique id of the customer to delete.',
  })
  @ApiOperation({
    summary: 'Delete a single customer and any linked documents by ID.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK. Customer deleted.',
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
  async remove(@Param('id') id: string, @Headers() headers: any) {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    const requestedBy = headers.requestedby;
    if (orgId) {
      return this.customersService.remove(orgId, id, requestedBy);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Patch(':id')
  @ApiTags('Customer')
  @ApiBasicAuth()
  @ApiHeader({
    name: 'RequestedBy',
    required: true,
    description:
      'This header value should clearly indicate who triggered this request. It could be a user ID, customer name, email address, or any other value that will allow accurate tracking of who made changes and when.',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique id of the customer to update.',
  })
  @ApiOperation({
    summary: 'Update an existing customer for KYC validation.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK. Customer updated.',
    type: Customer,
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
  @ApiBadRequestResponse({
    status: 400,
    description:
      'The request contains invalid or missing values. Check the error message for more details.',
    schema: {
      type: 'object',
      example: {
        message: [
          'Invalid input: identityDocumentNumber does not match with gender',
          'Invalid input: identityDocumentNumber does not match with dateOfBirth',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async update(
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Headers() headers: any,
    @Param('id') id: string,
  ): Promise<Customer> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    const requestedBy = headers.requestedby;
    if (orgId) {
      return this.customersService.update(
        id,
        updateCustomerDto,
        orgId,
        requestedBy,
      );
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('/liveness/sessioncreate/:CustomerId')
  @ApiTags('Customer Liveness')
  @ApiBasicAuth()
  @ApiParam({
    name: 'CustomerId',
    description: 'The unique id of the customer to verify.',
  })
  @ApiOperation({
    summary: `Creates and returns a new sessionId for a front-end application to begin the liveness verification check.`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK. Session created.',
    schema: {
      type: 'string',
      example: '655549e4-1863-40c7-81bf-000fb0c83a48',
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
  async createLivenessSession(
    @Param('CustomerId') customerId: string,
    @Headers() headers: any,
  ): Promise<string> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return this.customersService.createLivenessSession(customerId, orgId);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('/liveness/sessionresults/:CustomerId/:SessionId')
  @ApiTags('Customer Liveness')
  @ApiBasicAuth()
  @ApiParam({
    name: 'CustomerId',
    description: 'The unique id of the customer to verify.',
  })
  @ApiParam({
    name: 'SessionId',
    description:
      'The unique id of the existing session to fetch the results for.',
  })
  @ApiOperation({
    summary: `Returns the results of an existing liveness session.`,
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK.',
    type: LivenessResultDto,
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
  async resultLivenessSession(
    @Param('CustomerId') customerId: string,
    @Param('SessionId') sessionId: string,
    @Headers() headers: any,
  ): Promise<LivenessResultDto> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return this.customersService.resultLivenessSession(
        customerId,
        orgId,
        sessionId,
      );
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
