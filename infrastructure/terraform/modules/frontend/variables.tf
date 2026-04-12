variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "bucket_suffix" {
  description = "Suffix for S3 bucket name to ensure uniqueness"
  type        = string
  default     = "prod"
}

variable "custom_domain" {
  description = "Custom domain name for CloudFront (optional)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for custom domain (required if custom_domain is set)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
