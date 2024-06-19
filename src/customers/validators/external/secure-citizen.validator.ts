import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Customer, VerificationResult } from '../../entities/customer.entity';
import { COUNTRY, DOCUMENT_TYPE } from '../../../enums/enum';
import axios from 'axios';
import { fetchSecrets } from '../../../utils/fetch-secrets';
import { DocumentsService } from '../../../documents/documents.service';
import { CustomerDocument } from '../../../documents/entities/customerDocument.entity';
@Injectable()
export class SecureCitizenValidator {
  private readonly logger = new Logger(SecureCitizenValidator.name);
  constructor(
    @Inject(DocumentsService)
    private documentsService: DocumentsService,
  ) {}
  public async validateCustomer(customer: Customer): Promise<{
    verifications: Array<VerificationResult>;
    govIdPhoto: CustomerDocument;
  }> {
    const verifications = [];
    let govIdPhoto: CustomerDocument = undefined;

    if (customer.identityDocumentCountry !== COUNTRY.ZA) {
      verifications.push({
        verificationName: 'Secure Citizen verification possible',
        passed: true,
        warning: true,
        dateCreated: new Date().getTime(),
        details: 'Not a South African citizen',
      });
      return { verifications, govIdPhoto };
    } else {
      verifications.push({
        verificationName: 'Secure Citizen verification possible',
        passed: true,
        warning: false,
        dateCreated: new Date().getTime(),
        details: '',
      });
    }

    let secrets;
    try {
      // Get API connection details:
      secrets = await fetchSecrets();

      const accessToken = await this.loginSecureCitizen(secrets);
      if (!accessToken) {
        verifications.push({
          verificationName: `Secure Citizen verifcation process successful`,
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `There was a system error during the Secure Citizen verification process. A request for manual verification will be sent.`,
        });
        return {
          verifications,
          govIdPhoto,
        };
      }

      const rsaIdVerification = await this.RsaIdVerification(
        customer,
        secrets,
        accessToken,
      );

      if (!rsaIdVerification) {
        verifications.push({
          verificationName: `Secure Citizen verifcation process successful`,
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `There was a system error during the Secure Citizen verification process. A request for manual verification will be sent.`,
        });
        return {
          verifications,
          govIdPhoto,
        };
      }

      if (
        rsaIdVerification?.['FacialImage'] &&
        rsaIdVerification?.['FacialImage'] !== ''
      ) {
        // Image from Department of Home Affairs returned, so save to S3 for further validation comparisons:
        const buf = Buffer.from(
          rsaIdVerification?.['FacialImage']?.replace(
            /^data:image\/\w+;base64,/,
            '',
          ),
          'base64',
        );
        govIdPhoto = await this.documentsService.uploadFile(
          'HANIS.jpg',
          buf,
          customer.id,
          customer.organisationId,
          DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO,
          'SecureCitizen',
        );
      }
      if (rsaIdVerification?.['DeadIndicator'] === true) {
        verifications.push({
          verificationName: 'Secure Citizen not listed as deceased',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `This person is listed as being deceased as of ${rsaIdVerification?.['DateOfDeath']}.`,
        });
      } else {
        verifications.push({
          verificationName: 'Secure Citizen not listed as deceased',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (rsaIdVerification?.['IDBlocked'] === true) {
        verifications.push({
          verificationName: 'Secure Citizen ID not blocked',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `This ID number has been blocked by the Department of Home Affairs.`,
        });
      } else {
        verifications.push({
          verificationName: 'Secure Citizen ID not blocked',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (
        +rsaIdVerification?.['FirstNameResult'] !== 100 ||
        +rsaIdVerification?.['LastNameResult'] !== 100
      ) {
        verifications.push({
          verificationName: 'Secure Citizen names match',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `The first name(s) or last name verification failed. Check spelling.`,
        });
      } else {
        verifications.push({
          verificationName: 'Secure Citizen names match',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (rsaIdVerification?.['OnNPR'] === false) {
        verifications.push({
          verificationName: 'Secure Citizen NPR',
          passed: true,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `This ID number is missing from the National Population Register.`,
        });
      } else {
        verifications.push({
          verificationName: 'Secure Citizen NPR',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `This ID number is on the National Population Register.`,
        });
      }
      if (rsaIdVerification?.['OnHanis'] === false) {
        verifications.push({
          verificationName: 'Secure Citizen HANIS',
          passed: true,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `This ID number is missing from the Home Affairs National Identification System.`,
        });
      } else {
        verifications.push({
          verificationName: 'Secure Citizen HANIS',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `This ID number is on the Home Affairs National Identification System.`,
        });
      }
      if (rsaIdVerification?.['SAFPSResults'] !== null) {
        verifications.push({
          verificationName: 'Secure Citizen SAFPS',
          passed: true,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `This ID number has been found on the South African Fraud Prevention Service.`,
        });
      } else {
        verifications.push({
          verificationName: 'Secure Citizen SAFPS',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `This ID number has not been found on the South African Fraud Prevention Service.`,
        });
      }
    } catch (error) {
      console.error(
        'Error processing Secure Citizen verification: ',
        JSON.stringify(error),
      );
      {
        verifications.push({
          verificationName: `Secure Citizen verifcation process successful`,
          passed: false,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `There was a system error during the Secure Citizen verification process. A request for manual verification will be sent.`,
        });
      }
    }

    return { verifications, govIdPhoto };
  }

  private async RsaIdVerification(
    customer: Customer,
    secrets: any,
    accessToken: string,
  ): Promise<object> {
    const urlRSAIDVerification = `${secrets?.securecitizen?.rsaid_url}`;
    let rsaidResult;
    try {
      const form = {
        IdNumber: customer.identityDocumentNumber,
        RequestReason: 'Apzor KYC',
        CRef: customer.id,
        ConsentReceived: true,
        Subsidiary: '',
        IdentityCache: true,
        CachePreferred: true,
        SAFPSRequired: true,
        LivenessRequired: false,
        HANISImageRequired: true,
        FirstNames: `${customer.firstName} ${customer.middleNames}`.trim(),
        LastName: customer.lastName.trim(),
        FaceString: '',
      };
      const options = {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      };
      rsaidResult = await axios.post(urlRSAIDVerification, form, options);
      return rsaidResult.data.response;
    } catch (error) {
      this.logger.error(
        `Error validating at (${urlRSAIDVerification}): `,
        error.response.data.error_description,
      );
      return undefined;
    }
  }
  private async loginSecureCitizen(secrets: any): Promise<string> {
    const urlLogin = `${secrets?.securecitizen?.token_url}`;
    let loginResult;
    try {
      const form = {
        grant_type: 'password',
        scope: secrets?.securecitizen?.scope,
        username: secrets?.securecitizen?.username,
        password: secrets?.securecitizen?.password,
        client_id: secrets?.securecitizen?.client_id,
        client_secret: secrets?.securecitizen?.client_secret,
      };
      const options = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Connection: 'keep-alive',
        },
      };
      loginResult = await axios.post(urlLogin, form, options);
      if (loginResult.status !== 200) {
        this.logger.error(loginResult.statusText, loginResult.status);
        return undefined;
      }
      return loginResult?.data?.access_token;
    } catch (error) {
      this.logger.error(
        `Error authenticating at (${urlLogin}): `,
        error.response.data.error_description,
      );
      return undefined;
    }
  }
}
