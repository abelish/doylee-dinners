output "table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

output "table_id" {
  description = "ID of the DynamoDB table"
  value       = aws_dynamodb_table.main.id
}

output "gsi1_name" {
  description = "Name of GSI1 (email lookup)"
  value       = "GSI1"
}

output "gsi2_name" {
  description = "Name of GSI2 (date-based queries)"
  value       = "GSI2"
}
