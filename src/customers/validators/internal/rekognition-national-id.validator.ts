import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Customer, VerificationResult } from '../../entities/customer.entity';
import { DOCUMENT_TYPE } from '../../../enums/enum';
import {
  CompareFacesCommand,
  CompareFacesCommandOutput,
  DetectLabelsCommand,
  DetectLabelsCommandOutput,
  DetectTextCommand,
  DetectTextCommandOutput,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';
import * as moment from 'moment';

const likenessThreshold = 94;
@Injectable()
export class RekognitionNationalIdValidator {
  private readonly logger = new Logger(RekognitionNationalIdValidator.name);
  constructor() {}
  public async validateCustomer(
    customer: Customer,
  ): Promise<Array<VerificationResult>> {
    const verifications = [];
    try {
      const idImage = customer.documents.find(
        (doc) => doc.documentType === DOCUMENT_TYPE.NATIONAL_ID,
      );

      const selfieImage = customer.documents.find(
        (doc) => doc.documentType === DOCUMENT_TYPE.SELFIE,
      );

      const govIdImage = customer.documents.find(
        (doc) => doc.documentType === DOCUMENT_TYPE.SELFIE,
      );

      const livenessImage = customer.documents.find(
        (doc) => doc.documentType === DOCUMENT_TYPE.LIVENESS,
      );

      if (!idImage) {
        verifications.push({
          verificationName: 'National ID document uploaded',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: 'Please upload an image of your National ID',
        });
      } else {
        verifications.push({
          verificationName: 'National ID document uploaded',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (!selfieImage) {
        verifications.push({
          verificationName: 'Selfie image uploaded',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: 'Please upload an image of your face.',
        });
      } else {
        verifications.push({
          verificationName: 'Selfie image uploaded',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (!livenessImage) {
        verifications.push({
          verificationName: 'Liveness reference image uploaded',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: 'Please perform the liveness verification.',
        });
      } else {
        verifications.push({
          verificationName: 'Liveness reference image uploaded',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }

      if (!idImage || !selfieImage || !livenessImage) {
        return verifications;
      }

      const rekognitionClient = new RekognitionClient({
        region: process.env.AWS_REGION,
      });

      // Get labels from image:
      const paramsLabels = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: idImage.uploadedFileName,
          },
        },
        MaxLabels: 5,
        MinConfidence: 90,
      };
      const labelsResult: DetectLabelsCommandOutput =
        await rekognitionClient.send(new DetectLabelsCommand(paramsLabels));
      if (!labelsResult.Labels.find((l) => l.Name === 'Id Cards')) {
        verifications.push({
          verificationName: 'Image recognised as ID document',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      } else {
        verifications.push({
          verificationName: 'Image recognised as ID document',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }

      // Get text from image:
      const paramsText = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: idImage.uploadedFileName,
          },
        },
      };
      const textResult: DetectTextCommandOutput = await rekognitionClient.send(
        new DetectTextCommand(paramsText),
      );
      const docText = {
        idNumber: textResult?.TextDetections?.find(
          (t) =>
            t.DetectedText.split(' ').join('') ==
              `I.D.No.${customer.identityDocumentNumber.split(' ').join('')}` ||
            t.DetectedText.split(' ').join('') ==
              `${customer.identityDocumentNumber.split(' ').join('')}`,
        ),
        firstName: textResult?.TextDetections?.find(
          (t) =>
            t.DetectedText.toUpperCase() === customer.firstName.toUpperCase(),
        ),
        lastName: textResult?.TextDetections?.find(
          (t) =>
            t.DetectedText.toUpperCase() === customer.lastName.toUpperCase(),
        ),
        dateOfBirth: textResult?.TextDetections?.find(
          (t) =>
            t.DetectedText ===
              moment(new Date(customer.dateOfBirth)).format('YYYY-MM-DD') ||
            t.DetectedText ===
              moment(new Date(customer.dateOfBirth))
                .format('DD MMM YYYY')
                .toUpperCase(),
        ),
      };

      if (!docText.idNumber) {
        verifications.push({
          verificationName: 'ID number recognised in ID document',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      } else {
        verifications.push({
          verificationName: 'ID number recognised in ID document',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (!docText.firstName) {
        verifications.push({
          verificationName: 'First name(s) recognised in ID document',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      } else {
        verifications.push({
          verificationName: 'First name(s) recognised in ID document',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (!docText.lastName) {
        verifications.push({
          verificationName: 'Last name recognised in ID document',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      } else {
        verifications.push({
          verificationName: 'Last name recognised in ID document',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }
      if (!docText.dateOfBirth) {
        verifications.push({
          verificationName: 'Date of birth recognised in ID document',
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      } else {
        verifications.push({
          verificationName: 'Date of birth recognised in ID document',
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: '',
        });
      }

      // Compare Id image to Selfie image
      const paramsCompare = {
        TargetImage: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: idImage.uploadedFileName,
          },
        },
        SourceImage: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: selfieImage.uploadedFileName,
          },
        },
        SimilarityThreshold: 0,
      };
      const compareResult: CompareFacesCommandOutput =
        await rekognitionClient.send(new CompareFacesCommand(paramsCompare));
      if (+compareResult.FaceMatches[0]?.Similarity < likenessThreshold) {
        verifications.push({
          verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.SELFIE}`,
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `${DOCUMENT_TYPE.NATIONAL_ID} photo does not sufficiently match ${DOCUMENT_TYPE.SELFIE} (${compareResult.FaceMatches[0].Similarity} %)`,
        });
      } else {
        verifications.push({
          verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.SELFIE}`,
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `${DOCUMENT_TYPE.NATIONAL_ID} photo sufficiently matches ${DOCUMENT_TYPE.SELFIE} (${compareResult.FaceMatches[0].Similarity} %)`,
        });
      }

      // Compare Id image to Liveness reference image
      const paramsLiveness = {
        TargetImage: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: idImage.uploadedFileName,
          },
        },
        SourceImage: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: livenessImage.uploadedFileName,
          },
        },
        SimilarityThreshold: 0,
      };
      const livenessResult: CompareFacesCommandOutput =
        await rekognitionClient.send(new CompareFacesCommand(paramsLiveness));
      if (+livenessResult.FaceMatches[0]?.Similarity < likenessThreshold) {
        verifications.push({
          verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.LIVENESS}`,
          passed: false,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `${DOCUMENT_TYPE.NATIONAL_ID} photo does not sufficiently match ${DOCUMENT_TYPE.LIVENESS} (${livenessResult.FaceMatches[0].Similarity} %)`,
        });
      } else {
        verifications.push({
          verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.LIVENESS}`,
          passed: true,
          warning: false,
          dateCreated: new Date().getTime(),
          details: `${DOCUMENT_TYPE.NATIONAL_ID} photo sufficiently matches ${DOCUMENT_TYPE.LIVENESS} (${livenessResult.FaceMatches[0].Similarity} %)`,
        });
      }

      // Compare Id image to Government image (if it exists):
      if (govIdImage) {
        const paramsCompareGov = {
          TargetImage: {
            S3Object: {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Name: idImage.uploadedFileName,
            },
          },
          SourceImage: {
            S3Object: {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Name: govIdImage.uploadedFileName,
            },
          },
          SimilarityThreshold: 0,
        };
        const compareResultGov: CompareFacesCommandOutput =
          await rekognitionClient.send(
            new CompareFacesCommand(paramsCompareGov),
          );
        if (+compareResultGov.FaceMatches[0]?.Similarity < likenessThreshold) {
          verifications.push({
            verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO}`,
            passed: false,
            warning: false,
            dateCreated: new Date().getTime(),
            details: `${DOCUMENT_TYPE.NATIONAL_ID} photo does not sufficiently match ${DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO} (${compareResultGov.FaceMatches[0].Similarity} %)`,
          });
        } else {
          verifications.push({
            verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO}`,
            passed: true,
            warning: false,
            dateCreated: new Date().getTime(),
            details: `${DOCUMENT_TYPE.NATIONAL_ID} photo sufficiently matches ${DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO} (${compareResultGov.FaceMatches[0].Similarity} %)`,
          });
        }
      } else {
        verifications.push({
          verificationName: `${DOCUMENT_TYPE.NATIONAL_ID} photo matches ${DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO}`,
          passed: true,
          warning: true,
          dateCreated: new Date().getTime(),
          details: `${DOCUMENT_TYPE.GOVERNMENT_ID_PHOTO} not found.`,
        });
      }
    } catch (error) {
      this.logger.error(
        'Error performing image facial recognition:',
        error.message,
      );
      verifications.push({
        verificationName: `Recognition verifcation process successful`,
        passed: false,
        warning: true,
        dateCreated: new Date().getTime(),
        details: `There was a system error during the document/facial recognition process. A request for manual verification will be sent.`,
      });
    }
    return verifications;
  }
}
