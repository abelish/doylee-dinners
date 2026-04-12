#!/bin/bash

# Local deployment script for Doylee Dinners to LocalStack
set -e

echo "🚀 Deploying Doylee Dinners to LocalStack..."

# Configuration
LOCALSTACK_ENDPOINT="http://localhost:4566"
AWS_REGION="us-west-2"
TABLE_NAME="doylee-dinners"

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=$AWS_REGION

# Check if LocalStack is running
echo "📡 Checking LocalStack connection..."
if ! curl -s "$LOCALSTACK_ENDPOINT/_localstack/health" > /dev/null; then
    echo "❌ LocalStack is not running. Start it with: npm run local:start"
    exit 1
fi
echo "✅ LocalStack is running"

# Create DynamoDB table
echo "📊 Creating DynamoDB table: $TABLE_NAME..."
aws dynamodb create-table \
    --endpoint-url $LOCALSTACK_ENDPOINT \
    --table-name $TABLE_NAME \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
        AttributeName=GSI2PK,AttributeType=S \
        AttributeName=GSI2SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"GSI1\",
                \"KeySchema\": [
                    {\"AttributeName\": \"GSI1PK\", \"KeyType\": \"HASH\"},
                    {\"AttributeName\": \"GSI1SK\", \"KeyType\": \"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\": \"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            },
            {
                \"IndexName\": \"GSI2\",
                \"KeySchema\": [
                    {\"AttributeName\": \"GSI2PK\", \"KeyType\": \"HASH\"},
                    {\"AttributeName\": \"GSI2SK\", \"KeyType\": \"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\": \"ALL\"},
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 5,
                    \"WriteCapacityUnits\": 5
                }
            }
        ]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    2>/dev/null && echo "✅ Table created successfully" || echo "ℹ️  Table already exists"

# List tables to verify
echo "📋 Verifying table creation..."
aws dynamodb list-tables --endpoint-url $LOCALSTACK_ENDPOINT

echo "✨ Local deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Build backend: cd backend && npm run build"
echo "  2. Start frontend: cd frontend && npm start"
echo "  3. Test API endpoints with your Lambda functions"
