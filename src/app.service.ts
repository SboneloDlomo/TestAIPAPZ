import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppService {
  private readonly configService: ConfigService;
  private readonly logger = new Logger(AppService.name);

  constructor(configService: ConfigService) {
    this.configService = configService;
  }
}
