import { DynamoDBStreamEvent, StreamRecord } from 'aws-lambda'
import AWS from 'aws-sdk'
import AWSMock from 'aws-sdk-mock'

import { handler } from './on_product_add'

type DynamoDBStreamEventName = 'INSERT' | 'MODIFY' | 'REMOVE'
type DynamoDBEventBuilder = (eventName: DynamoDBStreamEventName, body: StreamRecord) => DynamoDBStreamEvent

const buildDynamodbEvent: DynamoDBEventBuilder = (eventName, body) => ({
  Records: [{
    dynamodb: body,
    eventName
  }]
})

describe('handler', () => {
  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789:comet_events'
  })

  afterEach(() => {
    jest.restoreAllMocks()
    AWSMock.restore()
    delete process.env.SNS_TOPIC_ARN
  })

  it('passes for "MODIFY" event', async () => {
    const dynamodbEvent = buildDynamodbEvent('MODIFY', {})

    await handler(dynamodbEvent)
  })

  it('passes for "REMOVE" event', async () => {
    const dynamodbEvent = buildDynamodbEvent('REMOVE', {})

    await handler(dynamodbEvent)
  })

  it('works for "INSERT" event', async () => {
    let SNSPublishParams = {}
    AWSMock.setSDKInstance(AWS)
    AWSMock.mock('SNS', 'publish', (params: any, cb: (err: null) => void) => {
      SNSPublishParams = params
      cb(null)
    })

    const productName = 'product_name'
    const dynamodbEvent = buildDynamodbEvent('INSERT', {
      NewImage: {
        name: {
          S: productName
        }
      }
    })

    await handler(dynamodbEvent)

    expect(SNSPublishParams).toStrictEqual({
      Subject: 'New product added in DB!',
      Message: `A new product was added in the database: ${productName}`,
      TopicArn: process.env.SNS_TOPIC_ARN
    })
  })

  it('throws when product name is not set', async () => {
    const dynamodbEvent = buildDynamodbEvent('INSERT', {})

    expect.assertions(1)

    try {
      await handler(dynamodbEvent)
    } catch (e) {
      expect((e as Error).message).toStrictEqual('undefined product name')
    }
  })

  it('throws when the "SNS_TOPIC_ARN" env var is not set', async () => {
    const productName = 'product_name'
    const dynamodbEvent = buildDynamodbEvent('INSERT', {
      NewImage: {
        name: {
          S: productName
        }
      }
    })

    delete process.env.SNS_TOPIC_ARN

    expect.assertions(1)

    try {
      await handler(dynamodbEvent)
    } catch (e) {
      expect((e as Error).message).toStrictEqual('the environment variable "SNS_TOPIC_ARN" is not set')
    }
  })

  it('throws when SNS returns an error', async () => {
    const productName = 'product_name'
    const dynamodbEvent = buildDynamodbEvent('INSERT', {
      NewImage: {
        name: {
          S: productName
        }
      }
    })

    const errorMessage = 'Unknown error'
    AWSMock.setSDKInstance(AWS)
    AWSMock.mock('SNS', 'publish', (_: any, cb: (err: Error) => void) => {
      cb(new Error(errorMessage))
    })

    expect.assertions(1)

    try {
      await handler(dynamodbEvent)
    } catch (e) {
      expect((e as Error).message).toStrictEqual(errorMessage)
    }
  })
})
