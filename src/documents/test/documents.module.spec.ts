import { Test } from '@nestjs/testing';
import { DocumentsModule } from '../documents.module';
import { DocumentsService } from '../documents.service';
import { Logger } from '@nestjs/common';
import { ProgressCalculator } from '../../utils/calc-progress';

describe('DocumentsModule', () => {
  it('should compile the module', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsModule],
      providers: [DocumentsService, Logger, ProgressCalculator],
    }).compile();

    await moduleRef.resolve(DocumentsService);
    expect(moduleRef.get(DocumentsService)).toBeInstanceOf(DocumentsService);
  });
});
