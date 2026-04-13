# Project-wide variables
variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "doylee-dinners"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

# DynamoDB variables
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

# Lambda variables
variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Lambda memory allocation in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 10
}

# JWT configuration
variable "jwt_secret" {
  description = "JWT secret key (should be stored in Parameter Store)"
  type        = string
  sensitive   = true
}

# Frontend configuration
variable "frontend_domain_name" {
  description = "Custom domain name for frontend (optional)"
  type        = string
  default     = ""
}

# SES configuration
variable "ses_sender_email" {
  description = "Email address to verify and use for sending (e.g., noreply@doylee-dinners.com)"
  type        = string
}

# Tags
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "doylee-dinners"
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}
