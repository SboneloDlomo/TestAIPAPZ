import { Test, TestingModule } from '@nestjs/testing';
import { AuditTrailService } from '../audit-trail.service';
import { Logger } from '@nestjs/common';
import { AUDIT_TRAIL_ACTION } from '../../enums/enum';
import { mockClient } from 'aws-sdk-client-mock';
import { dynamoDBClient } from '../../database/dynamoDBClient';
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

describe('Audit Trail Service', () => {
  const mockDynamoDbDocumentClient = mockClient(dynamoDBClient);
  let service: AuditTrailService;
  let mockLoggerError;
  let mockLoggerDebug;
  const organisationId = 'ef71e7eb-d216-42ce-966d-e2f78399628c';
  const mockCustomer = {
    id: '60fb42c3-dc7c-4c3d-a248-b898691d2af6',
    customerId: '9508041112453',
    organisationId: organisationId,
    dateCreated: 0,
    createdBy: 'Unit Test',
    action: AUDIT_TRAIL_ACTION.CUSTOMER_CREATED,
  };

  beforeEach(async () => {
    mockDynamoDbDocumentClient.reset();
    mockLoggerError = jest.fn();
    mockLoggerDebug = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditTrailService,
        {
          provide: Logger,
          useValue: { error: mockLoggerError, debug: mockLoggerDebug },
        },
      ],
    }).compile();
    service = module.get<AuditTrailService>(AuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Create: should return false when missing required params', async () => {
    // GIVEN
    const preChangeObject = {};
    const postChangeObject = {};
    const organisationId = '';
    // WHEN
    const result = await service.create(
      mockCustomer.customerId,
      organisationId,
      mockCustomer.createdBy,
      mockCustomer.action,
      preChangeObject,
      postChangeObject,
    );
    // THEN
    expect(result).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Audit Trail: Error while creating audit trail entry: ',
      'organisationId and customerId must be defined.',
    );
  });

  it('Create: should succeed when all parameters are defined', async () => {
    // GIVEN
    const preChangeObject = { firstName: 'Testing', email: 'old@email.com' };
    const postChangeObject = { firstName: 'Testing', email: 'new@email.com' };
    // WHEN
    const result = await service.create(
      mockCustomer.customerId,
      mockCustomer.organisationId,
      mockCustomer.createdBy,
      mockCustomer.action,
      preChangeObject,
      postChangeObject,
    );
    // THEN
    expect(result).toBe(true);
  });

  it('FindOne: should return a single entity when all parameters are defined', async () => {
    // GIVEN
    mockDynamoDbDocumentClient.on(GetCommand).resolves({
      Item: mockCustomer,
    });
    // WHEN
    const result = await service.findOne(organisationId, mockCustomer.id);
    // THEN
    expect(
      service.findOne(organisationId, mockCustomer.id),
    ).resolves.toEqual<any>(mockCustomer);
    expect(result).toEqual(mockCustomer);
  });

  it('FindAll: should return array when all parameters are defined', async () => {
    // GIVEN
    mockDynamoDbDocumentClient.on(ScanCommand).resolves({
      Items: [mockCustomer],
    });
    // WHEN
    const result = await service.findAll(organisationId);
    // THEN
    expect(service.findAll(organisationId)).resolves.toEqual<any>([
      mockCustomer,
    ]);
    expect(result).toEqual([mockCustomer]);
  });
});
