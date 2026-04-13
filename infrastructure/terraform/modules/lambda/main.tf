# IAM role for Lambda execution
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.project_name}-dynamodb-policy"
  description = "Allow Lambda functions to access DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:TransactGetItems"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })

  tags = var.tags
}

# Attach DynamoDB policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# IAM policy for Systems Manager Parameter Store access (for JWT secret)
resource "aws_iam_policy" "ssm_access" {
  name        = "${var.project_name}-ssm-policy"
  description = "Allow Lambda functions to access SSM Parameter Store"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${var.project_name}/*"
      }
    ]
  })

  tags = var.tags
}

# Attach SSM policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_ssm" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.ssm_access.arn
}

# IAM policy for SES access (for password reset emails)
resource "aws_iam_policy" "ses_access" {
  name        = "${var.project_name}-ses-policy"
  description = "Allow Lambda functions to send emails via SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

# Attach SES policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_ses" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.ses_access.arn
}

# Lambda Layer for shared dependencies (node_modules)
# Temporarily disabled until we build actual Lambda functions in Phase 3
# resource "aws_lambda_layer_version" "dependencies" {
#   filename            = var.lambda_layer_filename
#   layer_name          = "${var.project_name}-dependencies"
#   compatible_runtimes = [var.lambda_runtime]
#   source_code_hash    = fileexists(var.lambda_layer_filename) ? filebase64sha256(var.lambda_layer_filename) : ""

#   description = "Shared dependencies for Lambda functions (bcryptjs, jsonwebtoken, AWS SDK)"

#   lifecycle {
#     create_before_destroy = true
#   }
# }

# Lambda functions will be created dynamically
# For now, we'll export the role and layer for use in function definitions
