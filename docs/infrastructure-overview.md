# Infrastructure Overview

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront                          │
│                    (CDN Distribution)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
                         ▼
             ┌───────────────────────┐
             │     S3 Bucket         │
             │  (React Frontend)     │
             └───────────────────────┘
                         │
                         │ API Calls
                         │
                         ▼
             ┌───────────────────────┐
             │    API Gateway        │
             │   (REST API)          │
             └───────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐  ┌────────────┐  ┌────────────┐
│ Lambda: Auth   │  │Lambda:Meals│  │Lambda:Users│
│ - register     │  │ - create   │  │ - get      │
│ - login        │  │ - list     │  │ - update   │
│ - logout       │  │ - get      │  │            │
│ - me           │  │ - update   │  │            │
└────────┬───────┘  └─────┬──────┘  └──────┬─────┘
         │                │                 │
         └────────────────┼─────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │      DynamoDB         │
              │  (Single Table)       │
              │  - PK/SK design       │
              │  - GSI1 (email)       │
              │  - GSI2 (date)        │
              └───────────────────────┘
                          │
                          │
                          ▼
              ┌───────────────────────┐
              │  Systems Manager      │
              │  Parameter Store      │
              │  - JWT secret         │
              │  - Config values      │
              └───────────────────────┘
```

## Terraform Modules

### 1. Database Module (`modules/database`)
**Purpose:** DynamoDB table with single-table design

**Resources:**
- DynamoDB table with PK/SK
- GSI1 for email-based user lookup
- GSI2 for date-based meal queries
- Server-side encryption enabled
- Optional TTL for session cleanup

**Outputs:**
- `table_name` - For Lambda environment variables
- `table_arn` - For IAM policies

### 2. Lambda Module (`modules/lambda`)
**Purpose:** IAM roles, policies, and shared Lambda layer

**Resources:**
- IAM execution role with policies for:
  - CloudWatch Logs (logging)
  - DynamoDB (data access)
  - Systems Manager (secrets)
- Lambda layer with shared dependencies

**Outputs:**
- `lambda_role_arn` - For Lambda functions
- `lambda_layer_arn` - For attaching to functions

### 3. API Gateway Module (`modules/api`)
**Purpose:** REST API with CORS and logging

**Resources:**
- REST API with resources:
  - `/auth` - Authentication endpoints
  - `/users` - User management
  - `/meals` - Meal management
  - `/meals/{mealId}/signups` - Signup management
- API Gateway stage (prod)
- CloudWatch logs
- CORS configuration

**Outputs:**
- `api_endpoint` - Full invoke URL
- Resource IDs for Lambda integrations

### 4. Frontend Module (`modules/frontend`)
**Purpose:** Static website hosting with CDN

**Resources:**
- S3 bucket (private, versioned, encrypted)
- CloudFront distribution with:
  - Origin Access Identity for S3
  - HTTPS redirect
  - Gzip compression
  - SPA routing support (404 → index.html)
- Price Class 100 (North America + Europe only)

**Outputs:**
- `website_url` - CloudFront URL
- `cloudfront_distribution_id` - For cache invalidation

## Resource Naming Convention

All resources follow the pattern: `{project_name}-{resource_type}-{environment}`

Examples:
- `doylee-dinners-table-prod`
- `doylee-dinners-lambda-exec-role`
- `doylee-dinners-api`
- `doylee-dinners-frontend-prod`

## Free Tier Optimization

### DynamoDB
- **Billing Mode:** Pay-per-request (no upfront capacity)
- **Free Tier:** 25 GB storage, 25 WCU, 25 RCU
- **Estimated Usage:** 1.5 MB storage, ~100 requests/day
- **Cost:** $0/month (well within free tier)

### Lambda
- **Memory:** 256 MB per function
- **Timeout:** 10 seconds
- **Free Tier:** 1M requests/month, 400,000 GB-seconds
- **Estimated Usage:** 1,000 requests/month, ~2,500 GB-seconds
- **Cost:** $0/month

### API Gateway
- **Type:** REST API (regional)
- **Free Tier:** 1M requests/month for 12 months
- **Estimated Usage:** 1,000 requests/month
- **Cost:** $0/month (first year)

### S3
- **Storage:** ~5 MB (React build)
- **Free Tier:** 5 GB storage, 20,000 GET, 2,000 PUT
- **Estimated Usage:** 500 GET requests/month
- **Cost:** $0/month

### CloudFront
- **Price Class:** 100 (cheapest)
- **Free Tier:** 50 GB data transfer out, 2M requests
- **Estimated Usage:** 1 GB transfer, 500 requests/month
- **Cost:** $0/month

**Total Monthly Cost:** ~$0 (within free tier limits)

## Security Features

### Encryption
- **DynamoDB:** Server-side encryption at rest (default)
- **S3:** Encryption at rest
- **CloudFront:** HTTPS enforced
- **Parameter Store:** SecureString for JWT secret

### Access Control
- **S3:** Private bucket with CloudFront OAI
- **API Gateway:** CORS configured
- **Lambda:** Least-privilege IAM roles
- **DynamoDB:** Item-level access via Lambda only

### Secrets Management
- JWT secret stored in Parameter Store (encrypted)
- No secrets in code or Terraform state
- Environment-specific configuration

## Monitoring & Logging

### CloudWatch Logs
- API Gateway logs (7-day retention)
- Lambda logs (default retention)
- Structured logging for debugging

### Metrics
- API Gateway: Request count, latency, errors
- Lambda: Invocations, duration, errors, throttles
- DynamoDB: Read/write capacity, throttles

### Alarms (Optional)
Can be added for:
- API Gateway 5XX errors
- Lambda errors/throttles
- DynamoDB throttles
- Billing alerts

## Deployment Process

### Initial Deployment
1. Configure AWS CLI
2. Create Terraform backend (optional)
3. Configure `terraform.tfvars`
4. Run `terraform init`
5. Run `terraform apply`
6. Build and deploy Lambda functions
7. Build and deploy frontend

### Updates
1. Modify Terraform files
2. Run `terraform plan` to review
3. Run `terraform apply` to deploy
4. Update Lambda functions if needed
5. Update frontend if needed

### CI/CD (Phase 6)
GitHub Actions will automate:
- Backend: Build, test, package, deploy Lambdas
- Frontend: Build, sync to S3, invalidate cache
- Infrastructure: Terraform plan on PR, apply on merge

## State Management

### Local Backend (Default)
- State stored in `terraform.tfstate`
- Good for: Learning, single developer
- **Warning:** Don't commit to git!

### S3 Backend (Recommended)
- State stored in S3 with versioning
- DynamoDB for locking (prevents concurrent changes)
- Good for: Production, team collaboration

To migrate:
```bash
bash scripts/create-terraform-backend.sh
# Uncomment backend block in backend.tf
terraform init -migrate-state
```

## Disaster Recovery

### Backups
- **DynamoDB:** Point-in-time recovery (optional, costs extra)
- **S3:** Versioning enabled
- **Terraform State:** S3 versioning + backend locking

### Restore Process
1. Restore from S3 bucket version
2. Restore DynamoDB from PITR (if enabled)
3. Redeploy Lambda functions
4. Invalidate CloudFront cache

## Cost Monitoring

### AWS Budgets
Set up budget alert:
```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "doylee-dinners",
    "BudgetLimit": {"Amount": "1", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

### Cost Explorer
- Review monthly costs in AWS Console
- Check service-level breakdown
- Monitor trends

### Free Tier Usage
Check in AWS Console → Billing → Free Tier

## Maintenance

### Regular Tasks
- Monitor CloudWatch logs for errors
- Review AWS Cost Explorer monthly
- Update Lambda dependencies
- Rotate JWT secret periodically

### Terraform Updates
- Update provider versions
- Run `terraform plan` before `apply`
- Test in local environment first

## Limitations

### Free Tier Constraints
- **CloudFront:** 50 GB/month data transfer
- **API Gateway:** 1M requests/month (12 months only)
- **Lambda:** 1M requests/month
- **DynamoDB:** 25 GB storage

### Service Limits
- **Lambda:** 10-second max timeout
- **API Gateway:** 29-second timeout
- **CloudFront:** ~10-15 minute deployment time
- **DynamoDB:** Eventually consistent reads

## Scaling Considerations

If usage grows beyond free tier:

1. **DynamoDB:** Add provisioned capacity or stay on-demand
2. **Lambda:** Increase memory/timeout if needed
3. **CloudFront:** Upgrade price class for global coverage
4. **API Gateway:** Consider caching for read-heavy endpoints

## Troubleshooting

See [deployment-guide.md](./deployment-guide.md) for common issues and solutions.
