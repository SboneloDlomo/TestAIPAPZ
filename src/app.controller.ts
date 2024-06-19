import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private configService: ConfigService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check to confirm status of the API.',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Healthy. API is running and accessible.',
    schema: {
      type: 'string',
      example: 'Server is running',
    },
  })
  @Get('health')
  @ApiTags('Internal')
  getHealth(): string {
    return 'Server is running';
  }
}
