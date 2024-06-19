import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerValidator {
  private readonly logger = new Logger(CustomerValidator.name);
  constructor() {}
  public async validateCustomer(
    customer: Customer,
  ): Promise<{ isValid: boolean; validationErrors: string[] }> {
    let isValid = true;
    const validationErrors = [];

    if (!customer.id || customer.id === '') {
      validationErrors.push('Missing input: id');
    }

    if (!customer.organisationId || customer.organisationId === '') {
      validationErrors.push('Missing input: organisationId');
    }

    if (!customer.firstName || customer.firstName.length < 2) {
      validationErrors.push('Invalid input: firstName');
    }

    if (!customer.lastName || customer.lastName.length < 2) {
      validationErrors.push('Invalid input: lastName');
    }

    if (!isDate(customer.dateOfBirth)) {
      validationErrors.push('Invalid input: dateOfBirth');
    }

    if (validationErrors.length != 0) {
      isValid = false;
    }
    return { isValid, validationErrors };
  }
}

function isDate(object: any): boolean {
  return !isNaN(new Date(object).getTime());
}
