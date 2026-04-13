# SES Email Module

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Verify email address for sending
resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

# Output verification token (user needs to check email and click verification link)
output "verification_instructions" {
  value = "Check ${var.sender_email} inbox for verification email from AWS SES and click the verification link"
}
