import { Test, TestingModule } from '@nestjs/testing';
import { ProgressCalculator } from '../calc-progress';
import { Customer } from '../../customers/entities/customer.entity';
import {
  CUSTOMER_STATUS,
  DOCUMENT_STATUS,
  DOCUMENT_TYPE,
} from '../../enums/enum';

describe('Progress Calculator', () => {
  let service: ProgressCalculator;
  let customer: Customer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressCalculator],
    }).compile();

    service = module.get<ProgressCalculator>(ProgressCalculator);

    customer = {
      id: '9501010001111',
      organisationId: 'eedc1e89-d7dc-433e-93a5-82afb3763d67',
      documents: [],
      customerStatus: CUSTOMER_STATUS.NEW,
      customerStatusReason: 'New KYC requested',
      manualVerificationRequested: false,
      manuallyVerified: undefined,
      manuallyVerifiedBy: undefined,
      verified: false,
      dateVerified: undefined,
      verificationResults: [],
      progress: 0,
      dateCreated: 0,
      dateUpdated: 0,
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return 0% when customer has no uploaded documents and no verfications', async () => {
    // GIVEN

    // WHEN
    const { overallProgressPercent, failureCount, warningCount } =
      await service.calculateProgress(customer);

    // THEN
    expect(overallProgressPercent).toEqual(0);
    expect(failureCount).toEqual(0);
    expect(warningCount).toEqual(0);
  });

  it('should return 25% when customer has half the uploaded documents and no verfications', async () => {
    // GIVEN
    customer.documents = [];
    customer.documents.push({
      documentType: DOCUMENT_TYPE.NATIONAL_ID,
      documentStatus: DOCUMENT_STATUS.UPLOADED,
    });
    customer.documents.push({
      documentType: DOCUMENT_TYPE.SELFIE,
      documentStatus: DOCUMENT_STATUS.MISSING,
    });

    // WHEN
    const { overallProgressPercent, failureCount, warningCount } =
      await service.calculateProgress(customer);

    // THEN
    expect(overallProgressPercent).toEqual(25);
    expect(failureCount).toEqual(0);
    expect(warningCount).toEqual(0);
  });

  it('should return 50% when customer has half the uploaded documents and half the verfications', async () => {
    // GIVEN
    customer.documents = [];
    customer.documents.push({
      documentType: DOCUMENT_TYPE.NATIONAL_ID,
      documentStatus: DOCUMENT_STATUS.UPLOADED,
    });
    customer.documents.push({
      documentType: DOCUMENT_TYPE.SELFIE,
      documentStatus: DOCUMENT_STATUS.MISSING,
    });
    customer.verificationResults = [];
    customer.verificationResults.push({
      verificationName: 'Test1',
      passed: true,
      warning: false,
      dateCreated: 0,
    });
    customer.verificationResults.push({
      verificationName: 'Test2',
      passed: false,
      warning: true,
      dateCreated: 0,
    });

    // WHEN
    const { overallProgressPercent, failureCount, warningCount } =
      await service.calculateProgress(customer);

    // THEN
    expect(overallProgressPercent).toEqual(50);
    expect(failureCount).toEqual(1);
    expect(warningCount).toEqual(1);
  });

  it('should return 100% when customer has all the uploaded documents and all the verfications', async () => {
    // GIVEN
    customer.documents = [];
    customer.documents.push({
      documentType: DOCUMENT_TYPE.NATIONAL_ID,
      documentStatus: DOCUMENT_STATUS.UPLOADED,
    });
    customer.documents.push({
      documentType: DOCUMENT_TYPE.SELFIE,
      documentStatus: DOCUMENT_STATUS.UPLOADED,
    });
    customer.verificationResults = [];
    customer.verificationResults.push({
      verificationName: 'Test1',
      passed: true,
      warning: false,
      dateCreated: 0,
    });
    customer.verificationResults.push({
      verificationName: 'Test2',
      passed: true,
      warning: false,
      dateCreated: 0,
    });

    // WHEN
    const { overallProgressPercent, failureCount, warningCount } =
      await service.calculateProgress(customer);

    // THEN
    expect(overallProgressPercent).toEqual(100);
    expect(failureCount).toEqual(0);
    expect(warningCount).toEqual(0);
  });
});
