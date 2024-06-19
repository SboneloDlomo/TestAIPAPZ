import { Test } from '@nestjs/testing';
import { CustomersModule } from '../customers.module';
import { CustomersService } from '../customers.service';
import { Logger } from '@nestjs/common';
import { CustomerValidator } from '../validators/customer.validator';
import { ZaNationalIdValidator } from '../validators/internal/za-national-id.validator';
import { SecureCitizenValidator } from '../validators/external/secure-citizen.validator';
import { RekognitionNationalIdValidator } from '../validators/internal/rekognition-national-id.validator';
import { OFACValidator } from '../validators/external/ofac.validator';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from '../../documents/documents.service';
import { ProgressCalculator } from '../../utils/calc-progress';

describe('CustomersModule', () => {
  it('should compile the module', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CustomersModule],
      providers: [
        CustomersService,
        Logger,
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

    await moduleRef.resolve(CustomersService);
    expect(moduleRef.get(CustomersService)).toBeInstanceOf(CustomersService);
  });
});
