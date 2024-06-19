import { Test, TestingModule } from '@nestjs/testing';
import { AlternateAuthenticationService } from '../../utils/alt-authentication';
import { AuditTrailController } from '../audit-trail.controller';
import { AuditTrailService } from '../audit-trail.service';
import { AUDIT_TRAIL_ACTION } from '../../enums/enum';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuditTrail } from '../entities/audit-trail.entity';

describe('AuditTrailController', () => {
  let controller: AuditTrailController;
  let mockAuditTrailservice;
  let mockAlternateAuthenticationService;
  const orgId = 'test-organisation-id-01';
  const result1 = new AuditTrail(
    'test-customer-id-01',
    orgId,
    'test user',
    AUDIT_TRAIL_ACTION.CUSTOMER_CREATED,
    {},
    {},
  );
  const result2 = new AuditTrail(
    'test-customer-id-02',
    orgId,
    'test user',
    AUDIT_TRAIL_ACTION.CUSTOMER_DELETED,
    {},
    {},
  );

  beforeEach(async () => {
    mockAuditTrailservice = jest.fn();
    mockAlternateAuthenticationService = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditTrailController,
        {
          provide: AuditTrailService,
          useValue: {
            findAll: mockAuditTrailservice,
            findOne: mockAuditTrailservice,
          },
        },
        {
          provide: AlternateAuthenticationService,
          useValue: { altAuth: mockAlternateAuthenticationService },
        },
      ],
    }).compile();

    controller = module.get<AuditTrailController>(AuditTrailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('FindAll', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      mockAuditTrailservice.mockReturnValue([]);
      try {
        // WHEN
        await controller.findAll({});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(mockAuditTrailservice).toHaveBeenCalledTimes(0);
        expect(error).toEqual(result);
      }
    });

    it('should return an array of audit trails', async () => {
      // GIVEN
      const results: AuditTrail[] = [];
      results.push(result1);
      results.push(result2);
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockAuditTrailservice.mockReturnValue(results);
      // WHEN
      const response = await controller.findAll({});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockAuditTrailservice).toHaveBeenCalledTimes(1);
      expect(response).toEqual(results);
    });
  });

  describe('FindOne', () => {
    it('should return an unauthorized error when orgId not found', async () => {
      // GIVEN
      const result = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      mockAlternateAuthenticationService.mockReturnValue(undefined);
      mockAuditTrailservice.mockReturnValue([]);
      try {
        // WHEN
        await controller.findOne(result1.customerId, {});
      } catch (error) {
        // THEN
        expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
        expect(mockAuditTrailservice).toHaveBeenCalledTimes(0);
        expect(error).toEqual(result);
      }
    });

    it('should return a single audit trail', async () => {
      // GIVEN
      const result: AuditTrail = result1;
      mockAlternateAuthenticationService.mockReturnValue(orgId);
      mockAuditTrailservice.mockReturnValue(result);
      // WHEN
      const response = await controller.findOne(result1.customerId, {});
      // THEN
      expect(mockAlternateAuthenticationService).toHaveBeenCalledTimes(1);
      expect(mockAuditTrailservice).toHaveBeenCalledTimes(1);
      expect(response).toEqual(result);
    });
  });
});
