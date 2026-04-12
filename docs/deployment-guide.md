# Deployment Guide

This guide walks through deploying Doylee Dinners to AWS.

## Prerequisites

- AWS account (free tier eligible)
- AWS CLI installed and configured
- Terraform installed (1.0+)
- Node.js 18+ and npm

## Step 1: Configure AWS CLI

If you haven't already:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-west-2`
- Default output format: `json`

Verify configuration:
```bash
aws sts get-caller-identity
```

## Step 2: Create Terraform Backend (Optional but Recommended)

For production use, store Terraform state in S3:

```bash
bash scripts/create-terraform-backend.sh
```

This creates:
- S3 bucket for state storage (with versioning and encryption)
- DynamoDB table for state locking

Then uncomment the backend block in `infrastructure/terraform/backend.tf`.

## Step 3: Configure Terraform Variables

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
project_name = "doylee-dinners"
environment  = "prod"
aws_region   = "us-west-2"

# IMPORTANT: Change this to a secure random string!
jwt_secret = "your-super-secret-jwt-key-minimum-32-characters-long"

# Optional: custom domain
frontend_domain_name = "" # Leave empty for now
```

**Generate a secure JWT secret:**
```bash
# On macOS/Linux:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 4: Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

This downloads the AWS provider and initializes the backend.

## Step 5: Review the Infrastructure Plan

```bash
terraform plan
```

Review what will be created:
- DynamoDB table with GSIs
- IAM roles and policies for Lambda
- API Gateway REST API with resources
- S3 bucket for frontend
- CloudFront distribution
- SSM parameters for secrets

**Expected Resources:** ~20-25 resources

## Step 6: Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted.

This will take 10-15 minutes (CloudFront distribution is slow to create).

**Save the outputs:**
```bash
terraform output > ../outputs.txt
```

Important outputs:
- `api_endpoint` - Your API Gateway URL
- `website_url` - Your CloudFront URL
- `dynamodb_table_name` - Your DynamoDB table
- `cloudfront_distribution_id` - For cache invalidation

## Step 7: Build and Package Lambda Functions

```bash
cd ../../backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Package for Lambda (creates layer.zip and function zips)
npm run package
```

## Step 8: Deploy Lambda Functions

(This will be automated with GitHub Actions later)

For now, Lambda functions will be deployed individually as we create them in Phase 3.

## Step 9: Configure Frontend Environment

```bash
cd ../frontend

# Create production env file
cat > .env.production <<EOF
REACT_APP_API_URL=<your-api-endpoint-from-terraform-output>
REACT_APP_ENVIRONMENT=production
EOF
```

Replace `<your-api-endpoint-from-terraform-output>` with the `api_endpoint` from Step 6.

## Step 10: Build and Deploy Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to S3
aws s3 sync build/ s3://<your-frontend-bucket-name>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <your-cloudfront-distribution-id> \
  --paths "/*"
```

Replace:
- `<your-frontend-bucket-name>` with `frontend_bucket_name` output
- `<your-cloudfront-distribution-id>` with `cloudfront_distribution_id` output

## Step 11: Test Deployment

Visit your `website_url` from the Terraform outputs.

You should see a blank React app (we haven't built the UI yet).

Test the API:
```bash
curl <your-api-endpoint>
```

## Monitoring Costs

Set up a billing alarm to stay within free tier:

```bash
# Set up budget alert for $1
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json
```

Create `budget.json`:
```json
{
  "BudgetName": "doylee-dinners-free-tier",
  "BudgetLimit": {
    "Amount": "1",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

## Updating Infrastructure

When you make changes to Terraform files:

```bash
cd infrastructure/terraform
terraform plan   # Review changes
terraform apply  # Apply changes
```

## Tearing Down

To delete all AWS resources:

```bash
cd infrastructure/terraform

# Empty S3 bucket first (can't delete non-empty buckets)
aws s3 rm s3://$(terraform output -raw frontend_bucket_name) --recursive

# Destroy infrastructure
terraform destroy
```

**Warning:** This will delete all data including the DynamoDB table!

## Troubleshooting

### Terraform Errors

**Error: "bucket already exists"**
- S3 bucket names must be globally unique
- Update `bucket_suffix` in `terraform.tfvars`

**Error: "cannot assume role"**
- Check AWS CLI credentials: `aws sts get-caller-identity`
- Ensure your IAM user has appropriate permissions

### CloudFront is slow
- CloudFront distributions take 10-15 minutes to deploy
- This is normal AWS behavior

### Lambda layer not found
- Make sure you've built the backend: `cd backend && npm run build`
- The layer file should exist at `backend/dist/layer.zip`
- Initially, Terraform will warn about missing layer - this is OK

## Next Steps

Once infrastructure is deployed:

1. **Phase 3:** Build authentication Lambda functions
2. **Phase 4:** Build meal management features  
3. **Phase 5:** Build signup and user preference features
4. **Phase 6:** Set up CI/CD with GitHub Actions

## Useful Commands

```bash
# Check what's deployed
terraform show

# List all resources
terraform state list

# Get specific output
terraform output api_endpoint

# Format Terraform files
terraform fmt -recursive

# Validate configuration
terraform validate
```
