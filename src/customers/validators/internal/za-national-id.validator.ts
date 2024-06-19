import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Customer, VerificationResult } from '../../entities/customer.entity';
import { COUNTRY, GENDER } from '../../../enums/enum';
import * as moment from 'moment';

@Injectable()
export class ZaNationalIdValidator {
  private readonly logger = new Logger(ZaNationalIdValidator.name);
  constructor() {}
  public async validateCustomer(
    customer: Customer,
  ): Promise<Array<VerificationResult>> {
    const verifications: Array<VerificationResult> = [];

    if (customer.identityDocumentCountry === COUNTRY.ZA) {
      // Custom validator for South African ID numbers - compares DoB, Gender, Citizenship:
      if (isNaN(+customer.identityDocumentNumber)) {
        verifications.push({
          verificationName: 'South African ID captured',
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: 'Not a valid ID number.',
        });
      } else {
        let gender = GENDER.FEMALE;
        const dob = `${new Date(customer.dateOfBirth).getFullYear().toString().substring(0, 2)}${customer.identityDocumentNumber.substring(0, 2)}/${customer.identityDocumentNumber.substring(2, 4)}/${customer.identityDocumentNumber.substring(4, 6)}`;
        const isZaCitizen =
          +customer.identityDocumentNumber.substring(10, 11) === 0
            ? true
            : false;
        if (+customer.identityDocumentNumber.substring(6, 10) >= 5000) {
          gender = GENDER.MALE;
        }

        if (customer.gender !== gender) {
          verifications.push({
            verificationName: 'ID number matches captured gender',
            passed: false,
            warning: false,
            dateCreated: new Date().getTime(),
            details: '',
          });
        } else {
          verifications.push({
            verificationName: 'ID number matches captured gender',
            passed: true,
            warning: false,
            dateCreated: new Date().getTime(),
            details: '',
          });
        }

        if (customer.countryOfBirth === COUNTRY.ZA && isZaCitizen === false) {
          verifications.push({
            verificationName: 'ID number matches country of birth',
            passed: false,
            warning: false,
            dateCreated: new Date().getTime(),
            details: '',
          });
        } else {
          verifications.push({
            verificationName: 'ID number matches country of birth',
            passed: true,
            warning: false,
            dateCreated: new Date().getTime(),
            details: '',
          });
        }

        if (
          moment(new Date(dob)).format('YYYY-MM-DD') !==
          moment(new Date(customer.dateOfBirth)).format('YYYY-MM-DD')
        ) {
          verifications.push({
            verificationName: 'ID number matches date of birth',
            passed: false,
            warning: false,
            dateCreated: new Date().getTime(),
            details: '',
          });
        } else {
          verifications.push({
            verificationName: 'ID number matches date of birth',
            passed: true,
            warning: false,
            dateCreated: new Date().getTime(),
            details: '',
          });
        }
      }
    } else {
      verifications.push({
        verificationName: 'South African ID captured',
        passed: false,
        warning: true,
        dateCreated: new Date().getTime(),
        details: 'Not a South African citizen.',
      });
    }

    return verifications;
  }
}
