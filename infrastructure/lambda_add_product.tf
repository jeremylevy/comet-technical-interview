locals {
  add_product_fn_name = "addProduct"
}

resource "aws_iam_role" "add_product_lambda" {
  name = "add_product_lambda_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "add_product_lambda" {
  name = "add_product_lambda_role_policy"
  role = aws_iam_role.add_product_lambda.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [ 
    {
      "Effect":"Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },

    {
      "Effect":"Allow",
      "Action": [
        "dynamodb:PutItem"
      ],
      "Resource": "${aws_dynamodb_table.products.arn}"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_log_group" "add_product_lambda" {
  # <!> name must match lambda function name for logs to be stored
  name              = "/aws/lambda/${local.add_product_fn_name}"
  retention_in_days = 14
}

data "archive_file" "add_product_lambda" {
  type             = "zip"
  source_dir       = "${path.module}/../dist"
  output_file_mode = "0666"
  output_path      = "${path.module}/../out/add_product.zip"
}

resource "aws_lambda_function" "add_product" {
  filename         = data.archive_file.add_product_lambda.output_path
  source_code_hash = data.archive_file.add_product_lambda.output_base64sha256

  function_name = local.add_product_fn_name
  handler       = "actions/add_product.handler"
  runtime       = "nodejs14.x"

  role = aws_iam_role.add_product_lambda.arn

  timeout     = 40
  memory_size = 512

  environment {
    variables = {
      DYNAMODB_PRODUCTS_TABLE_NAME = aws_dynamodb_table.products.name
    }
  }

  # <!> log group needs to be created BEFORE the lambda function
  depends_on = [aws_cloudwatch_log_group.add_product_lambda]
}

resource "aws_lambda_permission" "add_product" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add_product.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.products.execution_arn}/*/*"
}
