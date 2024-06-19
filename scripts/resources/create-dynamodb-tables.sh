echo "Creating DynamoDB tables"

aws dynamodb create-table --cli-input-json file://table-customers-script.json --endpoint-url http://localstack:4566

aws dynamodb create-table --cli-input-json file://table-audit-trail-script.json --endpoint-url http://localstack:4566

aws dynamodb list-tables --endpoint-url http://localstack:4566

aws s3 ls s3://local-apz-kyc-documents --endpoint-url http://localstack:4566

