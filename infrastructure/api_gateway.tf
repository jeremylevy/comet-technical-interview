resource "aws_api_gateway_rest_api" "products" {
  name = "products_api"
}

resource "aws_api_gateway_method" "add_product" {
  rest_api_id   = aws_api_gateway_rest_api.products.id
  resource_id   = aws_api_gateway_rest_api.products.root_resource_id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "add_product" {
  rest_api_id = aws_api_gateway_rest_api.products.id
  resource_id = aws_api_gateway_rest_api.products.root_resource_id
  http_method = aws_api_gateway_method.add_product.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.add_product.invoke_arn
}

resource "aws_api_gateway_deployment" "products" {
  rest_api_id = aws_api_gateway_rest_api.products.id

  depends_on = [aws_api_gateway_integration.add_product]
}

resource "aws_api_gateway_stage" "products_dev" {
  deployment_id = aws_api_gateway_deployment.products.id
  rest_api_id   = aws_api_gateway_rest_api.products.id
  stage_name    = "dev"
}