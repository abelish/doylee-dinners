# Terraform backend configuration for state management
#
# IMPORTANT: Before running terraform init, you must:
# 1. Create an S3 bucket for state storage
# 2. Create a DynamoDB table for state locking
#
# Run: bash ../../scripts/create-terraform-backend.sh
#
# Then uncomment the backend block below and update the bucket name

# terraform {
#   backend "s3" {
#     bucket         = "doylee-dinners-terraform-state"
#     key            = "prod/terraform.tfstate"
#     region         = "us-west-2"
#     encrypt        = true
#     dynamodb_table = "doylee-dinners-terraform-lock"
#   }
# }

# For initial setup, use local backend (default)
# State will be stored in terraform.tfstate file
