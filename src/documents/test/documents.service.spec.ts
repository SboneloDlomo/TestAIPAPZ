import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from '../documents.service';
import { ProgressCalculator } from '../../utils/calc-progress';
import { Logger } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService, ProgressCalculator, Logger],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
