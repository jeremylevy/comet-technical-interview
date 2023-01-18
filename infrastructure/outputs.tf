output "add_product_endpoint" {
  value = "${aws_api_gateway_deployment.products.invoke_url}${aws_api_gateway_stage.products_dev.stage_name}"
}