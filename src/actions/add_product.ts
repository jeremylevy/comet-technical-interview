import { randomUUID } from 'crypto'

import AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import Product from '../models/Product'
import * as http from '../libs/http'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dynamoDBTableName = process.env.DYNAMODB_PRODUCTS_TABLE_NAME

  if (typeof dynamoDBTableName !== 'string' || dynamoDBTableName.length === 0) {
    throw new Error('the environment variable "DYNAMODB_PRODUCTS_TABLE_NAME" is not set')
  }

  let parsedReqBody: any

  try {
    if (event.body === null) {
      throw new Error('empty request body')
    }

    parsedReqBody = JSON.parse(event.body)
  } catch (e) {
    return http.resp(400, {
      error_message: 'product must be passed as a JSON object'
    })
  }

  const productName = parsedReqBody.name

  if (typeof productName !== 'string' || productName.length === 0) {
    return http.resp(400, {
      error_message: 'product must have a non-empty "name" property'
    })
  }

  const newProduct: Product = {
    id: randomUUID(),
    name: productName
  }

  const dynamoDBClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10'
  })

  await dynamoDBClient.put({
    TableName: dynamoDBTableName,
    Item: newProduct
  }).promise()

  return http.resp(201, newProduct)
}
