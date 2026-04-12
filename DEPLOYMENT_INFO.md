# Doylee Dinners - AWS Deployment Summary

**Deployment Date:** April 11, 2026
**Status:** ✅ Successfully Deployed

## Deployed Resources

### Frontend
- **CloudFront URL:** https://d24ba9lcvbc48t.cloudfront.net
- **S3 Bucket:** doylee-dinners-frontend-prod
- **CloudFront Distribution ID:** E3QI4HJQ38OYVT
- **Status:** Ready (3-5 minute propagation time)

### Backend
- **API Gateway Endpoint:** https://cxzol9zbdf.execute-api.us-west-2.amazonaws.com/prod
- **API Gateway ID:** cxzol9zbdf
- **Status:** Created (deployment pending Lambda functions)

### Database
- **DynamoDB Table:** doylee-dinners-table
- **Table ARN:** arn:aws:dynamodb:us-west-2:933858446951:table/doylee-dinners-table
- **Billing Mode:** Pay-per-request
- **GSI1:** Email lookup for authentication
- **GSI2:** Date-based meal queries

### IAM & Security
- **Lambda Execution Role:** doylee-dinners-lambda-exec-role
- **JWT Secret:** Stored in SSM Parameter Store at `/doylee-dinners/jwt-secret`
- **Table Name:** Stored in SSM Parameter Store at `/doylee-dinners/table-name`
- **API Endpoint:** Stored in SSM Parameter Store at `/doylee-dinners/api-endpoint`

### Logging
- **API Gateway Logs:** `/aws/apigateway/doylee-dinners` (7-day retention)
- **Lambda Logs:** Will be created when functions are deployed

## Next Steps

### Phase 3: Build Authentication (Next)
1. Install backend dependencies: `cd backend && npm install`
2. Build TypeScript types for DynamoDB entities
3. Create Lambda functions:
   - `auth-register` - POST /auth/register
   - `auth-login` - POST /auth/login
   - `auth-me` - GET /auth/me
   - `auth-logout` - POST /auth/logout
4. Create shared utilities (JWT, bcrypt, DynamoDB client)
5. Deploy Lambda functions
6. Build React auth components

### Deploy Frontend (When Ready)
```bash
cd frontend
npm install
npm run build

# Deploy to S3
aws s3 sync build/ s3://doylee-dinners-frontend-prod/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E3QI4HJQ38OYVT \
  --paths "/*"
```

## AWS Console Links

- **DynamoDB:** https://console.aws.amazon.com/dynamodbv2/home?region=us-west-2#tables
- **API Gateway:** https://console.aws.amazon.com/apigateway/home?region=us-west-2#/apis/cxzol9zbdf
- **CloudFront:** https://console.aws.amazon.com/cloudfront/v4/home?region=us-west-2#/distributions/E3QI4HJQ38OYVT
- **S3:** https://console.aws.amazon.com/s3/buckets/doylee-dinners-frontend-prod?region=us-west-2
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

### API Gateway returns errors?
- Lambda functions not deployed yet (Phase 3)
- Check API Gateway console for deployment status

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
