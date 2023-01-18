import AWS from 'aws-sdk'
import { APIGatewayProxyResult } from 'aws-lambda'
import AWSMock from 'aws-sdk-mock'

import { handler } from './add_product'
import Product from '../models/Product'

type BadRequestRespBuilder = (errorMessage: string) => APIGatewayProxyResult

const buildBadRequestResp: BadRequestRespBuilder = errorMessage => ({
  statusCode: 400,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: `{"error_message":"${errorMessage}"}`
})

describe('handler', () => {
  beforeEach(() => {
    process.env.DYNAMODB_PRODUCTS_TABLE_NAME = 'products'
  })

  afterEach(() => {
    jest.restoreAllMocks()
    AWSMock.restore()
    delete process.env.DYNAMODB_PRODUCTS_TABLE_NAME
  })

  it.each(
    [
      [null],
      ['bad_json']
    ]
  )('returns HTTP status code 400 when non-JSON body', async body => {
    const resp = await handler({
      body
    } as any)

    expect(resp)
      .toStrictEqual(
        buildBadRequestResp('product must be passed as a JSON object')
      )
  })

  it.each(
    [
      ['{"bar":"baz"}'],
      ['{"name":""}']
    ]
  )('returns HTTP status code 400 when no product name passed', async body => {
    const resp = await handler({
      body
    } as any)

    expect(resp)
      .toStrictEqual(
        buildBadRequestResp('product must have a non-empty \\"name\\" property')
      )
  })

  it('works when valid product passed', async () => {
    let DynamoDBPutParams = {}
    AWSMock.setSDKInstance(AWS)
    AWSMock.mock('DynamoDB.DocumentClient', 'put', (params: any, cb: (err: null) => void) => {
      DynamoDBPutParams = params
      cb(null)
    })

    const productName = 'product_name'

    const resp = await handler({
      body: JSON.stringify({
        name: productName
      })
    } as any)

    expect(resp.statusCode).toStrictEqual(201)

    const headers: any = (resp.headers !== undefined) ? resp.headers : {}
    expect(headers['Content-Type']).toStrictEqual('application/json; charset=utf-8')

    const createdProduct: Product = JSON.parse(resp.body)
    expect(createdProduct.name).toStrictEqual(productName)
    expect(createdProduct.id.length).toBeGreaterThan(0)

    expect(DynamoDBPutParams).toStrictEqual({
      TableName: process.env.DYNAMODB_PRODUCTS_TABLE_NAME,
      Item: createdProduct
    })
  })

  it('throws when the "DYNAMODB_PRODUCTS_TABLE_NAME" env var is not set', async () => {
    const productName = 'product_name'

    delete process.env.DYNAMODB_PRODUCTS_TABLE_NAME

    expect.assertions(1)

    try {
      await handler({
        body: JSON.stringify({
          name: productName
        })
      } as any)
    } catch (e) {
      expect((e as Error).message)
        .toStrictEqual('the environment variable "DYNAMODB_PRODUCTS_TABLE_NAME" is not set')
    }
  })

  it('throws when DynamoDB returns an error', async () => {
    const errorMessage = 'Unknown error'
    AWSMock.setSDKInstance(AWS)
    AWSMock.mock('DynamoDB.DocumentClient', 'put', (_: any, cb: (err: Error) => void) => {
      cb(new Error(errorMessage))
    })

    expect.assertions(1)

    try {
      const productName = 'product_name'

      await handler({
        body: JSON.stringify({
          name: productName
        })
      } as any)
    } catch (e) {
      expect((e as Error).message).toStrictEqual(errorMessage)
    }
  })
})
