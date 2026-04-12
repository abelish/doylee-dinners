output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_exec.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_exec.name
}

output "lambda_layer_arn" {
  description = "ARN of the Lambda layer with dependencies"
  value       = ""  # Disabled until Phase 3
  # value       = aws_lambda_layer_version.dependencies.arn
}

output "lambda_layer_version" {
  description = "Version of the Lambda layer"
  value       = ""  # Disabled until Phase 3
  # value       = aws_lambda_layer_version.dependencies.version
}
