import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Headers,
} from '@nestjs/common';
import { AuditTrailService } from './audit-trail.service';
import {
  ApiBasicAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuditTrail } from './entities/audit-trail.entity';
import { AlternateAuthenticationService } from '../utils/alt-authentication';

@Controller('audit-trail')
export class AuditTrailController {
  constructor(
    private readonly auditTrailService: AuditTrailService,
    private readonly alternateAuthenticationService: AlternateAuthenticationService,
  ) {}

  @Get()
  @ApiTags('Audit Trail')
  @ApiBasicAuth()
  @ApiOperation({
    summary: 'Get an array of all audit trail logs.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK.',
    type: [AuditTrail],
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
  async findAll(@Headers() headers: any): Promise<AuditTrail[]> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return this.auditTrailService.findAll(orgId);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get(':id')
  @ApiTags('Audit Trail')
  @ApiBasicAuth()
  @ApiParam({
    name: 'id',
    description: 'The unique id of the audit trail log to get.',
  })
  @ApiOperation({
    summary: 'Get a single audit trail log by ID.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'OK.',
    type: AuditTrail,
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
  ): Promise<AuditTrail> {
    const orgId = await this.alternateAuthenticationService.altAuth(headers);
    if (orgId) {
      return this.auditTrailService.findOne(orgId, id);
    } else {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
