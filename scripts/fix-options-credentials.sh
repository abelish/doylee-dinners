#!/bin/bash

# Fix OPTIONS responses to include Access-Control-Allow-Credentials
set -e

API_ID="cxzol9zbdf"
REGION="us-west-2"
CORS_ORIGIN="https://d24ba9lcvbc48t.cloudfront.net"

echo "🔧 Fixing OPTIONS responses to include Access-Control-Allow-Credentials..."
echo ""

# Update each endpoint
for path in "/auth/register" "/auth/login" "/auth/me" "/auth/logout"; do
  RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='$path'].id" --output text)
  echo "📍 Updating OPTIONS for $path (Resource: $RESOURCE_ID)"

  # Update method response to include credentials parameter
  aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Credentials":false}' \
    --region $REGION \
    --output json > /dev/null 2>&1

  # Update integration response to include credentials value
  aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$CORS_ORIGIN'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,Authorization'\",\"method.response.header.Access-Control-Allow-Credentials\":\"'true'\"}" \
    --region $REGION \
    --output json > /dev/null 2>&1

  echo "  ✅ Updated"
done

echo ""
echo "🚀 Deploying API..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Add Access-Control-Allow-Credentials to OPTIONS" \
  --region $REGION \
  --query 'id' \
  --output text)

echo "  ✅ Deployed (ID: $DEPLOYMENT_ID)"
echo ""
echo "✅ OPTIONS responses fixed!"
