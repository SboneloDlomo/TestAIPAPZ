import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from '../customers.controller';
import { CustomersService } from '../customers.service';
import { AlternateAuthenticationService } from '../../utils/alt-authentication';
import { CustomerValidator } from '../validators/customer.validator';
import { ConfigService } from '@nestjs/config';
import { ZaNationalIdValidator } from '../validators/internal/za-national-id.validator';
import { SecureCitizenValidator } from '../validators/external/secure-citizen.validator';
import { RekognitionNationalIdValidator } from '../validators/internal/rekognition-national-id.validator';
import { DocumentsService } from '../../documents/documents.service';
import { ProgressCalculator } from '../../utils/calc-progress';
import { OFACValidator } from '../validators/external/ofac.validator';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { Customer } from '../entities/customer.entity';
import {
  COUNTRY,
  CUSTOMER_STATUS,
  GENDER,
  ID_DOCUMENT_TYPE,
} from '../../enums/enum';
import { LivenessResultDto } from '../dto/liveness-result.dto';

describe('CustomersController', () => {
  let controller: CustomersController;
  let mockCustomersService;
  let mockAlternateAuthenticationService;
  const orgId = 'test-organisation-id-01';
  const result1: CreateCustomerDto = {
    id: 'Test',
    firstName: 'Test',
    middleNames: 'Test',
    lastName: 'Test',
    gender: GENDER.MALE,
    identityDocumentNumber: 'TEST',
    identityDocumentType: ID_DOCUMENT_TYPE.NATIONAL_ID,
    identityDocumentCountry: COUNTRY.ZA,
    dateOfBirth: '2000/01/01',
    countryOfBirth: COUNTRY.ZA,
  };
  const result2: Customer = {
    id: result1.id,
    organisationId: orgId,
    documents: [],
    customerStatus: CUSTOMER_STATUS.NEW,
    customerStatusReason: 'Test',
    progress: 0,
    dateCreated: 0,
    dateUpdated: 0,
  };
  const result3: UpdateCustomerDto = {
    id: result1.id,
    manuallyVerified: true,
    manuallyVerifiedBy: 'Test',
  };

  beforeEach(async () => {
    mockCustomersService = jest.fn();
    mockAlternateAuthenticationService = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        Logger,
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
          provide: CustomersService,
          useValue: {
            create: mockCustomersService,
            createLivenessSession: mockCustomersService,
            findAll: mockCustomersService,
            findOne: mockCustomersService,
            remove: mockCustomersService,
            resultLivenessSession: mockCustomersService,
            update: mockCustomersService,
            verify: mockCustomersService,
          },
        },
        {
          provide: AlternateAuthenticationService,
          useValue: { altAuth: mockAlternateAuthenticationService },
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Create', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.create(new CreateCustomerDto(), {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });

    it('should return a single newly created customer', async () => {
      // GIVEN
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(result2);
      // WHEN
      const response = await controller.create(result1, {});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result2);
    });
  });
  describe('CreateLivenessSession', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.createLivenessSession('TestUUID', {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });

    it('should return a Liveness Session ID', async () => {
      // GIVEN
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue('TestSessionId');
      // WHEN
      const response = await controller.createLivenessSession('TestUUID', {});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual('TestSessionId');
    });
  });
  describe('FindAll', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.findAll({});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });

    it('should return an array of customers', async () => {
      // GIVEN
      const results: Customer[] = [];
      results.push(result2);
      results.push(result2);
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(results);
      // WHEN
      const response = await controller.findAll({});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(results);
    });
  });
  describe('FindOne', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.findOne('TestUUID', {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });
    it('should return a single customer', async () => {
      // GIVEN
      const result: Customer = result2;
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(result);
      // WHEN
      const response = await controller.findOne(result2.id, {});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });
  });
  describe('Remove', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.remove('TestUUID', {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });
    it('should delete a single customer', async () => {
      // GIVEN
      const result = HttpStatus.OK;
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(result);
      // WHEN
      const response = await controller.remove('TestUUID', {});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });
  });
  describe('ResultLivenessSession', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.resultLivenessSession('TestUUID', 'TestSessionId', {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });
    it('should return Liveness results', async () => {
      // GIVEN
      const result = new LivenessResultDto();
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(result);
      // WHEN
      const response = await controller.resultLivenessSession(
        'TestUUID',
        'TestSessionId',
        {},
      );
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });
  });
  describe('Update', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.update(new UpdateCustomerDto(), {}, 'TestUUID');
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });
    it('should update a single customer', async () => {
      // GIVEN
      const result: Customer = Object.assign(result2, result3);
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(result);
      // WHEN
      const response = await controller.update(result3, {}, result2.id);
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });
  });
  describe('Verify', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      try {
        // WHEN
        await controller.verify('TestUUID', {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(error).toEqual(result);
      }
    });
    it('should verify a single customer', async () => {
      // GIVEN
      const result: Customer = result2;
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockCustomersService.mockReturnValue(result);
      // WHEN
      const response = await controller.verify('TestUUID', {});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockCustomersService).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });
  });
});
