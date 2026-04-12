#!/bin/bash

# Deploy Lambda functions to AWS
set -e

PROJECT_NAME="doylee-dinners"
REGION="us-west-2"
PACKAGES_DIR="/Users/ahendlish/Documents/Projects/doylee-dinners/backend/packages"

# Get outputs from Terraform
cd /Users/ahendlish/Documents/Projects/doylee-dinners/infrastructure/terraform

LAMBDA_ROLE_ARN=$(terraform output -raw lambda_role_arn)
TABLE_NAME=$(terraform output -raw dynamodb_table_name)
API_ID=$(terraform output -raw api_id)
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain)
CORS_ORIGIN="https://$CLOUDFRONT_DOMAIN"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Deploying Lambda functions to AWS..."
echo ""
echo "Configuration:"
echo "  Region: $REGION"
echo "  Role ARN: $LAMBDA_ROLE_ARN"
echo "  Table: $TABLE_NAME"
echo "  API ID: $API_ID"
echo "  CORS Origin: $CORS_ORIGIN"
echo ""

# Get JWT secret from Parameter Store
JWT_SECRET=$(aws ssm get-parameter --name "/$PROJECT_NAME/jwt-secret" --with-decryption --query 'Parameter.Value' --output text --region $REGION)

# Function to create or update Lambda
deploy_lambda() {
  local FUNC_NAME=$1
  local HANDLER=$2
  local ZIP_FILE=$3

  echo "📦 Deploying $FUNC_NAME..."

  # Check if function exists
  if aws lambda get-function --function-name $FUNC_NAME --region $REGION >/dev/null 2>&1; then
    echo "  ↻ Updating existing function..."
    aws lambda update-function-code \
      --function-name $FUNC_NAME \
      --zip-file fileb://$ZIP_FILE \
      --region $REGION \
      --output json > /dev/null

    # Update environment variables
    aws lambda update-function-configuration \
      --function-name $FUNC_NAME \
      --environment "Variables={TABLE_NAME=$TABLE_NAME,JWT_SECRET=$JWT_SECRET,CORS_ORIGIN=$CORS_ORIGIN,NODE_ENV=production}" \
      --region $REGION \
      --output json > /dev/null

    echo "  ✅ Updated"
  else
    echo "  ➕ Creating new function..."
    aws lambda create-function \
      --function-name $FUNC_NAME \
      --runtime nodejs20.x \
      --role $LAMBDA_ROLE_ARN \
      --handler $HANDLER \
      --zip-file fileb://$ZIP_FILE \
      --timeout 10 \
      --memory-size 256 \
      --environment "Variables={TABLE_NAME=$TABLE_NAME,JWT_SECRET=$JWT_SECRET,CORS_ORIGIN=$CORS_ORIGIN,NODE_ENV=production}" \
      --region $REGION \
      --output json > /dev/null

    echo "  ✅ Created"
  fi

  # Grant API Gateway permission to invoke
  # Remove old permission if exists (to handle updates)
  aws lambda remove-permission \
    --function-name $FUNC_NAME \
    --statement-id apigateway-invoke \
    --region $REGION 2>/dev/null || true

  # Add permission with correct source ARN
  aws lambda add-permission \
    --function-name $FUNC_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION \
    --output json > /dev/null 2>&1 && echo "  ✅ Invoke permission granted" || echo "  ℹ️  Permission already exists"
}

# Deploy auth functions
deploy_lambda "$PROJECT_NAME-auth-register" "functions/auth/register.handler" "$PACKAGES_DIR/auth-register.zip"
deploy_lambda "$PROJECT_NAME-auth-login" "functions/auth/login.handler" "$PACKAGES_DIR/auth-login.zip"
deploy_lambda "$PROJECT_NAME-auth-me" "functions/auth/me.handler" "$PACKAGES_DIR/auth-me.zip"
deploy_lambda "$PROJECT_NAME-auth-logout" "functions/auth/logout.handler" "$PACKAGES_DIR/auth-logout.zip"

echo ""
echo "📦 Deploying meal functions..."

# Deploy meal functions
deploy_lambda "$PROJECT_NAME-meals-create" "functions/meals/create.handler" "$PACKAGES_DIR/meals-create.zip"
deploy_lambda "$PROJECT_NAME-meals-list" "functions/meals/list.handler" "$PACKAGES_DIR/meals-list.zip"
deploy_lambda "$PROJECT_NAME-meals-get" "functions/meals/get.handler" "$PACKAGES_DIR/meals-get.zip"
deploy_lambda "$PROJECT_NAME-meals-update" "functions/meals/update.handler" "$PACKAGES_DIR/meals-update.zip"
deploy_lambda "$PROJECT_NAME-meals-delete" "functions/meals/delete.handler" "$PACKAGES_DIR/meals-delete.zip"
deploy_lambda "$PROJECT_NAME-meals-signup" "functions/meals/signup.handler" "$PACKAGES_DIR/meals-signup.zip"
deploy_lambda "$PROJECT_NAME-meals-remove-signup" "functions/meals/remove-signup.handler" "$PACKAGES_DIR/meals-remove-signup.zip"

echo ""
echo "✅ All Lambda functions deployed!"
echo ""
echo "Functions created:"
aws lambda list-functions --region $REGION --query "Functions[?starts_with(FunctionName, '$PROJECT_NAME')].FunctionName" --output table
