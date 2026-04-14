# Doylee Dinners - AWS Deployment Summary

**Initial Deployment:** April 11, 2026  
**Last Updated:** April 14, 2026  
**Status:** ✅ Production Ready

## Deployed Resources

### Frontend
- **CloudFront URL:** https://d24ba9lcvbc48t.cloudfront.net
- **S3 Bucket:** doylee-dinners-frontend-prod
- **CloudFront Distribution ID:** E3QI4HJQ38OYVT
- **Status:** Ready (3-5 minute propagation time)

### Backend
- **API Gateway Endpoint:** https://cxzol9zbdf.execute-api.us-west-2.amazonaws.com/prod
- **API Gateway ID:** cxzol9zbdf
- **Lambda Functions:** 13 deployed (auth, meals, users)
- **Status:** ✅ Fully Deployed

### Database
- **DynamoDB Table:** doylee-dinners-table
- **Table ARN:** arn:aws:dynamodb:us-west-2:933858446951:table/doylee-dinners-table
- **Billing Mode:** Pay-per-request
- **GSI1:** Email lookup for authentication
- **GSI2:** Date-based meal queries
- **TTL:** Enabled on `expiresAt` field (auto-cleanup for reset tokens)

### Email (AWS SES)
- **Verified Email:** doyleedinners@gmail.com
- **Status:** Sandbox mode (can send TO verified addresses only)
- **Sender Name:** "Doylee Dinners"
- **Daily Limit:** 200 emails/day
- **Use Cases:**
  - Password reset emails with secure tokens
  - Meal announcement emails to all users

### IAM & Security
- **Lambda Execution Role:** doylee-dinners-lambda-exec-role
  - DynamoDB access (read/write/query/scan)
  - SES access (send emails)
  - SSM Parameter Store access (read secrets)
  - CloudWatch Logs access
- **SSM Parameters:**
  - `/doylee-dinners/jwt-secret` - JWT signing secret
  - `/doylee-dinners/table-name` - DynamoDB table name
  - `/doylee-dinners/api-endpoint` - API Gateway URL
  - `/doylee-dinners/ses-verified-email` - SES sender email
  - `/doylee-dinners/frontend-url` - CloudFront URL

### Logging
- **API Gateway Logs:** `/aws/apigateway/doylee-dinners` (7-day retention)
- **Lambda Logs:** Will be created when functions are deployed

## Deployment Procedures

### Deploy Backend Lambda Functions

```bash
# 1. Build TypeScript
cd backend
npm run build

# 2. Package Lambda functions
cd ..
bash scripts/package-lambdas.sh

# 3. Deploy to AWS
bash scripts/deploy-lambdas.sh
```

**Note:** The deploy script uses S3 for large packages (>50MB). It automatically:
- Uploads packages to `s3://doylee-dinners-lambda-deployments/`
- Updates Lambda function code via S3
- Updates environment variables
- Waits for functions to stabilize
- Grants API Gateway invoke permissions

### Deploy Frontend

```bash
# 1. Build React app
cd frontend
npm install
npm run build

# 2. Deploy to S3
aws s3 sync build/ s3://doylee-dinners-frontend-prod/ --delete

# 3. Invalidate CloudFront cache (required for changes to appear)
aws cloudfront create-invalidation \
  --distribution-id E3QI4HJQ38OYVT \
  --paths "/*"
```

CloudFront invalidation takes 1-2 minutes to propagate.

### Verify Email Addresses (SES Sandbox)

To allow a user to receive emails in sandbox mode:

```bash
# Verify email address
aws ses verify-email-identity \
  --email-address user@example.com \
  --region us-west-2
```

The user will receive a verification email from AWS. Once verified, they can receive:
- Password reset emails
- Meal announcement emails

### Update Terraform Infrastructure

```bash
cd infrastructure/terraform

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan
```

## AWS Console Links

- **DynamoDB:** https://console.aws.amazon.com/dynamodbv2/home?region=us-west-2#tables
- **Lambda Functions:** https://console.aws.amazon.com/lambda/home?region=us-west-2#/functions
- **API Gateway:** https://console.aws.amazon.com/apigateway/home?region=us-west-2#/apis/cxzol9zbdf
- **CloudFront:** https://console.aws.amazon.com/cloudfront/v4/home?region=us-west-2#/distributions/E3QI4HJQ38OYVT
- **S3 Frontend:** https://console.aws.amazon.com/s3/buckets/doylee-dinners-frontend-prod?region=us-west-2
- **S3 Lambda Deployments:** https://console.aws.amazon.com/s3/buckets/doylee-dinners-lambda-deployments?region=us-west-2
- **SES (Email):** https://console.aws.amazon.com/ses/home?region=us-west-2
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups
- **Parameter Store:** https://console.aws.amazon.com/systems-manager/parameters?region=us-west-2

## Cost Monitoring

**Estimated Monthly Cost:** $0 (within free tier)

Monitor usage at:
- https://console.aws.amazon.com/billing/home#/freetier
- https://console.aws.amazon.com/cost-management/home

**Set up budget alert:**
```bash
aws budgets create-budget \
  --account-id 933858446951 \
  --budget '{
    "BudgetName": "doylee-dinners",
    "BudgetLimit": {"Amount": "1", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

## Troubleshooting

### Frontend not loading?
- CloudFront can take 3-5 minutes to propagate
- Check S3 bucket has files: `aws s3 ls s3://doylee-dinners-frontend-prod/`
- Verify CloudFront distribution is deployed (not disabled)

### API returns 502 errors?
- Check Lambda function handler path is correct
- View CloudWatch logs: `aws logs tail /aws/lambda/doylee-dinners-FUNCTION-NAME --since 5m`
- Verify environment variables are set on Lambda

### Emails not sending?
**Check CloudWatch logs:**
```bash
aws logs tail /aws/lambda/doylee-dinners-meals-update --since 10m --format short
aws logs tail /aws/lambda/doylee-dinners-auth-reset-password --since 10m --format short
```

**Common issues:**
- **Recipient not verified (sandbox mode):** Verify email with `aws ses verify-email-identity`
- **Missing env vars:** Check Lambda has `SES_VERIFIED_EMAIL` and `FRONTEND_URL`
- **SES not called:** Look for "Calling SES to send email" in logs
- **Lambda timeout:** Ensure Lambda waits for email promises to complete

**Emails going to spam?**
- Gmail → Gmail via SES often triggers spam filters (domain mismatch)
- Solution: Use custom domain and request SES production access
- Temporary fix: Gmail filter to never mark as spam

### Lambda function too large?
If package exceeds 50MB, the deploy script automatically uses S3:
- Uploads to `s3://doylee-dinners-lambda-deployments/`
- Updates Lambda code from S3 reference
- Handles large node_modules correctly

### Need to tear down?
```bash
cd infrastructure/terraform

# Empty S3 bucket first
aws s3 rm s3://doylee-dinners-frontend-prod --recursive

# Destroy all infrastructure
terraform destroy
```

## Security Notes

- JWT secret is encrypted in SSM Parameter Store
- S3 bucket is private (CloudFront access only)
- All traffic uses HTTPS
- DynamoDB encrypted at rest
- IAM roles use least-privilege policies

## Backup & Recovery

- **DynamoDB:** Point-in-time recovery disabled (save costs)
- **S3:** Versioning enabled for frontend bucket
- **Terraform State:** Stored locally (consider S3 backend for production)

## Support

- Documentation: `/docs` directory
- Infrastructure code: `/infrastructure/terraform`
- Terraform outputs: `/infrastructure/outputs.json`
