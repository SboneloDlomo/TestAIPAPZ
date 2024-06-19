#!/bin/sh

cat <<EOF >> /root/.aws/config
[default]
output = json
region = eu-west-1
EOF

cat <<EOF >> ~/.aws/credentials
[default]
aws_access_key_id = dummy-val
aws_secret_access_key = dummy-val
EOF

echo "All needed localstack services are working"

cd /resources
for f in *.sh; do
  source "$f" -H
done
