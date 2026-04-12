#!/bin/bash

# Test DynamoDB by writing and reading a test item
set -e

TABLE_NAME="doylee-dinners-table"

echo "🧪 Testing DynamoDB..."
echo ""

# Write test item
echo "1️⃣ Writing test item..."
aws dynamodb put-item \
  --table-name $TABLE_NAME \
  --item '{
    "PK": {"S": "TEST#123"},
    "SK": {"S": "METADATA"},
    "testAttribute": {"S": "Hello from DynamoDB!"},
    "timestamp": {"S": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}
  }'
echo "✅ Item written"
echo ""

# Read test item
echo "2️⃣ Reading test item..."
aws dynamodb get-item \
  --table-name $TABLE_NAME \
  --key '{"PK": {"S": "TEST#123"}, "SK": {"S": "METADATA"}}' \
  --query 'Item'
echo ""

# Count items
echo "3️⃣ Current item count:"
aws dynamodb scan --table-name $TABLE_NAME --select COUNT --query 'Count'
echo ""

# Clean up
echo "4️⃣ Cleaning up test item..."
aws dynamodb delete-item \
  --table-name $TABLE_NAME \
  --key '{"PK": {"S": "TEST#123"}, "SK": {"S": "METADATA"}}'
echo "✅ Test complete!"
