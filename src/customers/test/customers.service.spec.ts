import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from '../customers.service';
import { CustomerValidator } from '../validators/customer.validator';
import { ConfigService } from '@nestjs/config';
import { ZaNationalIdValidator } from '../validators/internal/za-national-id.validator';
import { SecureCitizenValidator } from '../validators/external/secure-citizen.validator';
import { RekognitionNationalIdValidator } from '../validators/internal/rekognition-national-id.validator';
import { DocumentsService } from '../../documents/documents.service';
import { ProgressCalculator } from '../../utils/calc-progress';
import { OFACValidator } from '../validators/external/ofac.validator';
import { Logger } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Logger,
        CustomersService,
        CustomerValidator,
        ZaNationalIdValidator,
        SecureCitizenValidator,
        RekognitionNationalIdValidator,
        OFACValidator,
        ConfigService,
        DocumentsService,
        ProgressCalculator,
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
