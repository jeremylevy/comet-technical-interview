resource "aws_sns_topic" "on_product_add" {
  name = "on_product_add"
}

resource "aws_sns_topic_subscription" "on_product_add" {
  topic_arn = aws_sns_topic.on_product_add.arn

  protocol = "email"
  endpoint = var.client_email
}

resource "aws_sns_topic" "failed_add_product" {
  name = "failed_add_product"
}

resource "aws_sns_topic_subscription" "failed_add_product" {
  topic_arn = aws_sns_topic.failed_add_product.arn

  protocol = "email"
  endpoint = var.client_email
}

resource "aws_sns_topic" "failed_on_product_add" {
  name = "failed_on_product_add"
}

resource "aws_sns_topic_subscription" "failed_on_product_add" {
  topic_arn = aws_sns_topic.failed_on_product_add.arn

  protocol = "email"
  endpoint = var.client_email
}
