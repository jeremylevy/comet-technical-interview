import AWS from 'aws-sdk'
import { DynamoDBStreamEvent } from 'aws-lambda'

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const SNSTopicARN = process.env.SNS_TOPIC_ARN

  if (typeof SNSTopicARN !== 'string' || SNSTopicARN.length === 0) {
    throw new Error('the environment variable "SNS_TOPIC_ARN" is not set')
  }

  const record = event.Records[0]

  if (record.eventName !== 'INSERT') {
    return
  }

  const productName = record.dynamodb?.NewImage?.name.S

  if (productName === undefined) {
    throw new Error('undefined product name')
  }

  const SNSClient = new AWS.SNS({ apiVersion: '2010-03-31' })

  await SNSClient.publish({
    Message: `New product added in DB: ${productName}`,
    TopicArn: SNSTopicARN
  }).promise()
}
