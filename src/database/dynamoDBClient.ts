import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import 'dotenv/config';

const { DYNAMODB_ENDPOINT_URL, AWS_REGION, ENV } = process.env;
const dbClient = new DynamoDBClient(
  ENV?.startsWith('local')
    ? {
        region: AWS_REGION,
        endpoint: DYNAMODB_ENDPOINT_URL,
      }
    : {
        region: AWS_REGION,
      },
);

export const dynamoDBClient = DynamoDBDocumentClient.from(dbClient);
