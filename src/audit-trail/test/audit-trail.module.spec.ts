import { Test } from '@nestjs/testing';
import { AuditTrailModule } from '../audit-trail.module';
import { AuditTrailService } from '../audit-trail.service';
import { Logger } from '@nestjs/common';

describe('AuditTrailModule', () => {
  it('should compile the module', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditTrailModule],
      providers: [AuditTrailService, Logger],
    }).compile();

    await moduleRef.resolve(AuditTrailService);
    expect(moduleRef.get(AuditTrailService)).toBeInstanceOf(AuditTrailService);
  });
});
