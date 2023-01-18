resource "aws_cloudwatch_metric_alarm" "failed_lambda_add_product" {
  alarm_name          = "failed_lambda_add_product"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = "${aws_lambda_function.add_product.function_name}"
  }

  alarm_description = "Number of errors for the \"${aws_lambda_function.add_product.function_name}\" lambda function"
  alarm_actions     = ["${aws_sns_topic.failed_add_product.arn}"]
}

resource "aws_cloudwatch_metric_alarm" "failed_lambda_on_product_add" {
  alarm_name          = "failed_lambda_on_product_add"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = "${aws_lambda_function.on_product_add.function_name}"
  }

  alarm_description = "Number of errors for the \"${aws_lambda_function.on_product_add.function_name}\" lambda function"
  alarm_actions     = ["${aws_sns_topic.failed_on_product_add.arn}"]
}
