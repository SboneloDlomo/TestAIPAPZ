import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Customer, VerificationResult } from '../../entities/customer.entity';
import axios from 'axios';
import { fetchSecrets } from '../../../utils/fetch-secrets';
import * as moment from 'moment';

@Injectable()
export class OFACValidator {
  private readonly logger = new Logger(OFACValidator.name);
  constructor() {}
  public async validateCustomer(
    customer: Customer,
  ): Promise<Array<VerificationResult>> {
    const verifications = [];
    let secrets;
    try {
      // Get API connection details:
      secrets = await fetchSecrets();
      const { ofacResult, nameToSearch } = await this.OFACSearch(
        customer,
        secrets,
      );
      if (!ofacResult || ofacResult?.error === true) {
        verifications.push({
          verificationName: `OFAC verifcation process successful`,
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `There was a system error during the OFAC verification process. A request for manual verification will be sent.`,
        });
        return verifications;
      } else {
        verifications.push({
          verificationName: `OFAC verifcation process successful`,
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: ``,
        });
      }

      if (ofacResult?.matches?.[nameToSearch].length === 0) {
        verifications.push({
          verificationName: `Customer not flagged on OFAC`,
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `There were no results found for (${nameToSearch}) on the OFAC source databases.`,
        });
      } else {
        verifications.push({
          verificationName: `Customer not flagged on OFAC`,
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `One or more results were found for (${nameToSearch}) on the OFAC source databases (${JSON.stringify(ofacResult?.matches?.[nameToSearch][0].programs)}).`,
        });
      }
    } catch (error) {
      console.error(
        'Error processing OFAC verification: ',
        JSON.stringify(error),
      );
      {
        verifications.push({
          verificationName: `OFAC verifcation process successful`,
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `There was a system error during the OFAC verification process. A request for manual verification will be sent.`,
        });
      }
    }

    return verifications;
  }

  private async OFACSearch(
    customer: Customer,
    secrets: any,
  ): Promise<{ ofacResult: any; nameToSearch: string }> {
    const apiKey = `${secrets?.ofac?.api_key}`;
    const url = `${secrets?.ofac?.url}`;
    const nameToSearch =
      `${customer.firstName} ${customer.middleNames} ${customer.lastName}`
        .replace('  ', ' ')
        .trim();
    let ofacResult;
    try {
      const form = {
        apiKey: apiKey,
        minScore: 98,
        source: ['SDN', 'UK'],
        cases: [
          {
            name: nameToSearch,
            dob: moment(new Date(customer.dateOfBirth)).format('YYYY-MM-DD'),
            gender: customer.gender,
          },
        ],
      };
      const options = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };
      ofacResult = await axios.post(url, form, options);
      ofacResult = ofacResult?.data;
      return { ofacResult, nameToSearch };
    } catch (error) {
      this.logger.error(`Error validating at (${url}): `, error.response.data);
      return { ofacResult, nameToSearch };
    }
  }
}
