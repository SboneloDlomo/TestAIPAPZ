echo "Creating API secrets in Secrets Manager"

AWS_ACCESS_KEY_ID=dummy-val \
AWS_SECRET_ACCESS_KEY=dummy-val \
aws --endpoint-url http://localstack:4566 secretsmanager create-secret \
    --name local-apz-kyc-api \
    --description "API keys and IDs for any services the KYC system needs to interact with." \
    --secret-string file://secrets.json

aws --endpoint-url http://localstack:4566 secretsmanager list-secrets 