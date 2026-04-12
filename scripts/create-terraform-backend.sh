#!/bin/bash

# Script to create S3 bucket and DynamoDB table for Terraform backend
set -e

PROJECT_NAME="doylee-dinners"
AWS_REGION="us-west-2"
BUCKET_NAME="${PROJECT_NAME}-terraform-state"
DYNAMODB_TABLE="${PROJECT_NAME}-terraform-lock"

echo "🚀 Creating Terraform backend infrastructure..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Create S3 bucket for state storage
echo "📦 Creating S3 bucket: $BUCKET_NAME"
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3api create-bucket \
        --bucket $BUCKET_NAME \
        --region $AWS_REGION \
        --create-bucket-configuration LocationConstraint=$AWS_REGION

    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket $BUCKET_NAME \
        --versioning-configuration Status=Enabled

    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket $BUCKET_NAME \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'

    # Block public access
    aws s3api put-public-access-block \
        --bucket $BUCKET_NAME \
        --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

    echo "✅ S3 bucket created successfully"
else
    echo "ℹ️  S3 bucket already exists"
fi

# Create DynamoDB table for state locking
echo "🔒 Creating DynamoDB table: $DYNAMODB_TABLE"
if ! aws dynamodb describe-table --table-name $DYNAMODB_TABLE --region $AWS_REGION > /dev/null 2>&1; then
    aws dynamodb create-table \
        --table-name $DYNAMODB_TABLE \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region $AWS_REGION \
        --tags Key=Project,Value=$PROJECT_NAME Key=ManagedBy,Value=terraform

    echo "⏳ Waiting for table to become active..."
    aws dynamodb wait table-exists --table-name $DYNAMODB_TABLE --region $AWS_REGION

    echo "✅ DynamoDB table created successfully"
else
    echo "ℹ️  DynamoDB table already exists"
fi

echo ""
echo "✨ Terraform backend infrastructure created!"
echo ""
echo "Next steps:"
echo "  1. Update backend.tf with the following values:"
echo "     bucket         = \"$BUCKET_NAME\""
echo "     dynamodb_table = \"$DYNAMODB_TABLE\""
echo "     region         = \"$AWS_REGION\""
echo ""
echo "  2. Uncomment the backend block in backend.tf"
echo "  3. Run 'terraform init' to initialize the backend"
