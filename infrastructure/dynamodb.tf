resource "aws_dynamodb_table" "products" {
  name     = "products"
  hash_key = "id"

  billing_mode = "PAY_PER_REQUEST"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }
}
