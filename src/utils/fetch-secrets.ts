import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

export const fetchSecrets = async () => {
  let client;

  if (process.env.ENV?.startsWith('local')) {
    client = new SecretsManagerClient({
      region: process.env.AWS_REGION,
      endpoint: 'http://localstack:4566',
    });
  } else {
    client = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });
  }

  try {
    const secretName = `${process.env.ENV}-apz-kyc-api`;
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      }),
    );
    return JSON.parse(response.SecretString);
  } catch (error) {
    throw error;
  }
};
