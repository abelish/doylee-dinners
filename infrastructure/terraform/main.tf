terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

# Database module - DynamoDB table
module "database" {
  source = "./modules/database"

  table_name                    = "${var.project_name}-table"
  billing_mode                  = var.dynamodb_billing_mode
  enable_point_in_time_recovery = false # Disable for free tier
  enable_ttl                    = false # Can enable later for session cleanup

  tags = var.tags
}

# Lambda module - IAM roles and layer
module "lambda" {
  source = "./modules/lambda"

  project_name       = var.project_name
  aws_region         = var.aws_region
  dynamodb_table_arn = module.database.table_arn
  lambda_runtime     = var.lambda_runtime

  tags = var.tags

  depends_on = [module.database]
}

# API Gateway module
module "api" {
  source = "./modules/api"

  project_name = var.project_name
  aws_region   = var.aws_region
  stage_name   = var.environment

  # CORS - CloudFront origin
  cors_allowed_origin = "https://${module.frontend.cloudfront_domain_name}"

  tags = var.tags
}

# Frontend module - S3 + CloudFront
module "frontend" {
  source = "./modules/frontend"

  project_name  = var.project_name
  bucket_suffix = var.environment
  custom_domain = var.frontend_domain_name

  tags = var.tags
}

# Store JWT secret in Systems Manager Parameter Store
resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/jwt-secret"
  description = "JWT secret key for token generation"
  type        = "SecureString"
  value       = var.jwt_secret

  tags = var.tags
}

# Store table name in Parameter Store for easy access
resource "aws_ssm_parameter" "table_name" {
  name        = "/${var.project_name}/table-name"
  description = "DynamoDB table name"
  type        = "String"
  value       = module.database.table_name

  tags = var.tags
}

# Store API endpoint in Parameter Store
resource "aws_ssm_parameter" "api_endpoint" {
  name        = "/${var.project_name}/api-endpoint"
  description = "API Gateway endpoint URL"
  type        = "String"
  value       = module.api.api_endpoint

  tags = var.tags
}
