# Database outputs
output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = module.database.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = module.database.table_arn
}

# Lambda outputs
output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = module.lambda.lambda_role_arn
}

output "lambda_layer_arn" {
  description = "ARN of the Lambda layer"
  value       = module.lambda.lambda_layer_arn
}

# API Gateway outputs
output "api_endpoint" {
  description = "API Gateway invoke URL"
  value       = module.api.api_endpoint
}

output "api_id" {
  description = "API Gateway REST API ID"
  value       = module.api.api_id
}

# Frontend outputs
output "frontend_bucket_name" {
  description = "Name of the frontend S3 bucket"
  value       = module.frontend.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.frontend.cloudfront_distribution_id
}

output "website_url" {
  description = "Frontend website URL"
  value       = module.frontend.website_url
}

output "cloudfront_domain" {
  description = "CloudFront domain name"
  value       = module.frontend.cloudfront_domain_name
}

# Deployment information
output "deployment_info" {
  description = "Important deployment information"
  value = {
    api_endpoint      = module.api.api_endpoint
    website_url       = module.frontend.website_url
    table_name        = module.database.table_name
    cloudfront_domain = module.frontend.cloudfront_domain_name
  }
}
