# SES module outputs

output "verified_email" {
  description = "The verified email address for sending"
  value       = aws_ses_email_identity.sender.email
}
