import { Logger, Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { AlternateAuthenticationService } from '../utils/alt-authentication';
import { CustomerValidator } from './validators/customer.validator';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { ZaNationalIdValidator } from './validators/internal/za-national-id.validator';
import { SecureCitizenValidator } from './validators/external/secure-citizen.validator';
import { RekognitionNationalIdValidator } from './validators/internal/rekognition-national-id.validator';
import { DocumentsService } from '../documents/documents.service';
import { ProgressCalculator } from '../utils/calc-progress';
import { OFACValidator } from './validators/external/ofac.validator';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 10 }],
    }),
  ],
  controllers: [CustomersController],
  providers: [
    Logger,
    AuditTrailService,
    CustomersService,
    ConfigService,
    AlternateAuthenticationService,
    CustomerValidator,
    ZaNationalIdValidator,
    SecureCitizenValidator,
    RekognitionNationalIdValidator,
    OFACValidator,
    DocumentsService,
    ProgressCalculator,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CustomersModule {}
