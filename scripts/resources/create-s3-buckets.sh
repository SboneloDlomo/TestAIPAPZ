echo "Creating S3 Buckets"

aws s3api create-bucket --endpoint-url http://localstack:4566 --bucket local-apz-kyc-documents --region eu-est-1

aws s3api list-buckets --endpoint-url http://localstack:4566

aws s3 ls s3://local-apz-kyc-documents --endpoint-url http://localstack:4566
