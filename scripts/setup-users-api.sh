#!/bin/bash

# Setup API Gateway endpoints for users

API_ID="cxzol9zbdf"
REGION="us-west-2"
ACCOUNT_ID="933858446951"
CORS_ORIGIN="https://d24ba9lcvbc48t.cloudfront.net"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text)

# Check if /users resource exists
USERS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?pathPart==`users`].id' --output text)

if [ -z "$USERS_RESOURCE_ID" ]; then
  echo "Creating /users resource..."
  USERS_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part users \
    --query 'id' --output text)
  echo "Created /users resource: $USERS_RESOURCE_ID"
else
  echo "Using existing /users resource: $USERS_RESOURCE_ID"
fi

# Check if /users/{userId} resource exists
USER_ID_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?pathPart==`{userId}`].id' --output text)

if [ -z "$USER_ID_RESOURCE_ID" ]; then
  echo "Creating /users/{userId} resource..."
  USER_ID_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $USERS_RESOURCE_ID \
    --path-part '{userId}' \
    --query 'id' --output text)
  echo "Created /users/{userId} resource: $USER_ID_RESOURCE_ID"
else
  echo "Using existing /users/{userId} resource: $USER_ID_RESOURCE_ID"
fi

# Setup GET /users/{userId}
echo "Setting up GET /users/{userId}..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE \
  --no-api-key-required > /dev/null

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:doylee-dinners-users-get/invocations" > /dev/null

# Setup PUT /users/{userId}
echo "Setting up PUT /users/{userId}..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method PUT \
  --authorization-type NONE \
  --no-api-key-required > /dev/null

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method PUT \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:doylee-dinners-users-update/invocations" > /dev/null

# Setup OPTIONS for CORS
echo "Setting up OPTIONS /users/{userId}..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE > /dev/null

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}' > /dev/null

aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Headers": false, "method.response.header.Access-Control-Allow-Methods": false, "method.response.header.Access-Control-Allow-Origin": false, "method.response.header.Access-Control-Allow-Credentials": false}' > /dev/null

aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $USER_ID_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\", \"method.response.header.Access-Control-Allow-Methods\": \"'GET,PUT,OPTIONS'\", \"method.response.header.Access-Control-Allow-Origin\": \"'$CORS_ORIGIN'\", \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"}" > /dev/null

# Create new deployment
echo "Creating new deployment..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --query 'id' --output text)

echo "✓ User API endpoints configured"
echo "Deployment ID: $DEPLOYMENT_ID"
echo ""
echo "Available endpoints:"
echo "  GET  /users/{userId} - Get user profile"
echo "  PUT  /users/{userId} - Update user profile"
