import { Logger, Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { AlternateAuthenticationService } from '../utils/alt-authentication';
import { AuditTrailService } from '../audit-trail/audit-trail.service';
import { ProgressCalculator } from '../utils/calc-progress';

@Module({
  controllers: [DocumentsController],
  providers: [
    Logger,
    DocumentsService,
    AlternateAuthenticationService,
    AuditTrailService,
    ProgressCalculator,
  ],
})
export class DocumentsModule {}
