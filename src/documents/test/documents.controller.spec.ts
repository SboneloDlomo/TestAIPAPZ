import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from '../documents.controller';
import { DocumentsService } from '../documents.service';
import { AlternateAuthenticationService } from '../../utils/alt-authentication';
import { ConfigService } from '@nestjs/config';
import { ProgressCalculator } from '../../utils/calc-progress';
import { Logger } from '@nestjs/common';

describe('DocumentsController', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        Logger,
        DocumentsService,
        AlternateAuthenticationService,
        ConfigService,
        ProgressCalculator,
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
