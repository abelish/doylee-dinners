# SES module variables

variable "sender_email" {
  description = "Email address to verify and use as sender"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
