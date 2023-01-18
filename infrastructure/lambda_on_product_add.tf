locals {
  on_product_add_fn_name = "onProductAdd"
}

resource "aws_iam_role" "on_product_add_lambda" {
  name = "on_product_add_lambda_role"

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

resource "aws_iam_role_policy" "on_product_add_lambda" {
  name = "on_product_add_lambda_role_policy"
  role = aws_iam_role.on_product_add_lambda.id

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
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:DescribeStream",
        "dynamodb:ListStreams"
      ],
      "Resource": "${aws_dynamodb_table.products.stream_arn}"
    },

    {
      "Effect":"Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "${aws_sns_topic.on_product_add.arn}"
    }
  ]
}
EOF
}

resource "aws_cloudwatch_log_group" "on_product_add_lambda" {
  # <!> name must match lambda function name for logs to be stored
  name              = "/aws/lambda/${local.on_product_add_fn_name}"
  retention_in_days = 14
}

data "archive_file" "on_product_add_lambda" {
  type             = "zip"
  source_dir       = "${path.module}/../dist"
  output_file_mode = "0666"
  output_path      = "${path.module}/../out/on_product_add.zip"
}

resource "aws_lambda_function" "on_product_add" {
  filename         = data.archive_file.on_product_add_lambda.output_path
  source_code_hash = data.archive_file.on_product_add_lambda.output_base64sha256

  function_name = local.on_product_add_fn_name
  handler       = "events/on_product_add.handler"
  runtime       = "nodejs14.x"

  role = aws_iam_role.on_product_add_lambda.arn

  timeout     = 40
  memory_size = 512

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.on_product_add.arn
    }
  }

  # <!> log group needs to be created BEFORE the lambda function
  depends_on = [aws_cloudwatch_log_group.on_product_add_lambda]
}

resource "aws_lambda_event_source_mapping" "on_product_add" {
  event_source_arn = aws_dynamodb_table.products.stream_arn
  function_name    = aws_lambda_function.on_product_add.arn

  starting_position = "LATEST"
  batch_size        = 1

  maximum_retry_attempts = 20
}
