output "api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "api_endpoint" {
  description = "Invoke URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/prod"  # Will be real once deployed
  # value       = aws_api_gateway_stage.main.invoke_url
}

output "api_stage_name" {
  description = "Name of the API Gateway stage"
  value       = "prod"  # Hardcoded for now
  # value       = aws_api_gateway_stage.main.stage_name
}

output "root_resource_id" {
  description = "Root resource ID of the API Gateway"
  value       = aws_api_gateway_rest_api.main.root_resource_id
}

# Resource IDs for creating Lambda integrations
output "auth_resource_id" {
  description = "Resource ID for /auth"
  value       = aws_api_gateway_resource.auth.id
}

output "users_resource_id" {
  description = "Resource ID for /users"
  value       = aws_api_gateway_resource.users.id
}

output "meals_resource_id" {
  description = "Resource ID for /meals"
  value       = aws_api_gateway_resource.meals.id
}

output "meal_id_resource_id" {
  description = "Resource ID for /meals/{mealId}"
  value       = aws_api_gateway_resource.meal_id.id
}

output "meal_signups_resource_id" {
  description = "Resource ID for /meals/{mealId}/signups"
  value       = aws_api_gateway_resource.meal_signups.id
}
