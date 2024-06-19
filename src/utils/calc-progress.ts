import { Injectable } from '@nestjs/common';
import { Customer } from '../customers/entities/customer.entity';
import { DOCUMENT_STATUS } from '../enums/enum';

@Injectable()
export class ProgressCalculator {
  constructor() {}
  public calculateProgress(customer: Customer): {
    overallProgressPercent: number;
    failureCount: number;
    warningCount: number;
  } {
    let overallProgressPercent = 0;
    let failureCount = 0;
    let warningCount = 0;
    const docCountWeight = 0.5;
    const verificationCountWeight = 0.5;

    const docCount = customer?.documents?.length;
    if (docCount === 0) {
      overallProgressPercent = overallProgressPercent + 0;
    } else {
      const uploadedDocCount = customer?.documents?.filter(
        (doc) => doc.documentStatus === DOCUMENT_STATUS.UPLOADED,
      ).length;
      overallProgressPercent =
        overallProgressPercent + (uploadedDocCount / docCount) * docCountWeight;
    }

    const verificationCount = customer?.verificationResults?.length;
    if (verificationCount === 0) {
      overallProgressPercent = overallProgressPercent + 0;
    } else {
      const verifiedCount = customer?.verificationResults?.filter(
        (res) => res.passed === true,
      ).length;
      warningCount = customer?.verificationResults?.filter(
        (res) => res.warning === true,
      ).length;
      failureCount = verificationCount - verifiedCount;
      overallProgressPercent =
        overallProgressPercent +
        (verifiedCount / verificationCount) * verificationCountWeight;
    }

    overallProgressPercent = Math.round(overallProgressPercent * 100);
    return { overallProgressPercent, failureCount, warningCount };
  }
}
