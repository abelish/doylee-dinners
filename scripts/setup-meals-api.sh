#!/bin/bash

# Setup API Gateway methods and integrations for meal endpoints
set -e

PROJECT_NAME="doylee-dinners"
REGION="us-west-2"

# Get Terraform outputs
cd /Users/ahendlish/Documents/Projects/doylee-dinners/infrastructure/terraform
API_ID=$(terraform output -raw api_id)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain)
CORS_ORIGIN="https://$CLOUDFRONT_DOMAIN"

echo "🔗 Setting up Meals API Gateway integrations..."
echo ""
echo "API ID: $API_ID"
echo "Account: $ACCOUNT_ID"
echo "CORS Origin: $CORS_ORIGIN"
echo ""

# Get resource IDs from API Gateway
MEALS_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/meals'].id" --output text)
echo "Meals resource ID: $MEALS_RESOURCE_ID"
echo ""

# Function to create method and integration
create_method_integration() {
  local RESOURCE_PATH=$1
  local HTTP_METHOD=$2
  local LAMBDA_NAME=$3

  echo "📍 Setting up $HTTP_METHOD $RESOURCE_PATH"

  # Get or create resource
  RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='$RESOURCE_PATH'].id" --output text)

  if [ -z "$RESOURCE_ID" ]; then
    # Need to create resource
    if [[ "$RESOURCE_PATH" == *"{mealId}"* ]] && [[ "$RESOURCE_PATH" != *"/signup" ]]; then
      # It's a path parameter resource (not signup)
      PARENT_ID=$MEALS_RESOURCE_ID
      PATH_PART=$(basename $RESOURCE_PATH)
    elif [[ "$RESOURCE_PATH" == *"/signup" ]]; then
      # It's the signup sub-resource
      MEAL_ID_RESOURCE=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='/meals/{mealId}'].id" --output text)
      PARENT_ID=$MEAL_ID_RESOURCE
      PATH_PART="signup"
    else
      echo "  ⚠️ Unknown resource pattern: $RESOURCE_PATH"
      return 1
    fi

    RESOURCE_ID=$(aws apigateway create-resource \
      --rest-api-id $API_ID \
      --parent-id $PARENT_ID \
      --path-part $PATH_PART \
      --region $REGION \
      --query 'id' \
      --output text 2>/dev/null)

    # If creation failed (resource already exists), get the existing one
    if [ -z "$RESOURCE_ID" ]; then
      RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query "items[?path=='$RESOURCE_PATH'].id" --output text)
    fi

    echo "  ✅ Using resource: $RESOURCE_ID"
  fi

  # Create method
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method $HTTP_METHOD \
    --authorization-type NONE \
    --region $REGION \
    --output json > /dev/null 2>&1 || echo "  ℹ️  Method already exists"

  # Create integration
  LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_NAME"

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method $HTTP_METHOD \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION \
    --output json > /dev/null

  echo "  ✅ Integrated with $LAMBDA_NAME"

  # Create OPTIONS method for CORS
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION \
    --output json > /dev/null 2>&1 || true

  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
    --region $REGION \
    --output json > /dev/null 2>&1 || true

  # Delete existing method response
  aws apigateway delete-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --region $REGION 2>/dev/null || true

  aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Credentials":false}' \
    --region $REGION \
    --output json > /dev/null 2>&1 || true

  aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$CORS_ORIGIN'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,Authorization'\",\"method.response.header.Access-Control-Allow-Credentials\":\"'true'\"}" \
    --region $REGION \
    --output json > /dev/null 2>&1 || true

  echo "  ✅ CORS configured"
}

# Setup each endpoint
create_method_integration "/meals" "POST" "$PROJECT_NAME-meals-create"
create_method_integration "/meals" "GET" "$PROJECT_NAME-meals-list"
create_method_integration "/meals/{mealId}" "GET" "$PROJECT_NAME-meals-get"
create_method_integration "/meals/{mealId}" "PUT" "$PROJECT_NAME-meals-update"
create_method_integration "/meals/{mealId}" "DELETE" "$PROJECT_NAME-meals-delete"
create_method_integration "/meals/{mealId}/signup" "POST" "$PROJECT_NAME-meals-signup"
create_method_integration "/meals/{mealId}/signup" "DELETE" "$PROJECT_NAME-meals-remove-signup"

echo ""
echo "🚀 Deploying API..."

# Create deployment
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Deployment with meal endpoints" \
  --region $REGION \
  --query 'id' \
  --output text)

echo "  ✅ Deployed (ID: $DEPLOYMENT_ID)"

echo ""
echo "✅ Meals API Gateway setup complete!"
echo ""
echo "🌐 API Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "Available meal endpoints:"
echo "  POST   https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals"
echo "  GET    https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals"
echo "  GET    https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals/{mealId}"
echo "  PUT    https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals/{mealId}"
echo "  DELETE https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals/{mealId}"
echo "  POST   https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals/{mealId}/signup"
echo "  DELETE https://$API_ID.execute-api.$REGION.amazonaws.com/prod/meals/{mealId}/signup"
echo ""
