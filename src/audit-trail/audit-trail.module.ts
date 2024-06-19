import { Logger, Module } from '@nestjs/common';
import { AuditTrailService } from './audit-trail.service';
import { AuditTrailController } from './audit-trail.controller';
import { AlternateAuthenticationService } from '../utils/alt-authentication';

@Module({
  controllers: [AuditTrailController],
  providers: [AuditTrailService, AlternateAuthenticationService, Logger],
})
export class AuditTrailModule {}
