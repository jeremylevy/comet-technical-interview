import { APIGatewayProxyResult } from 'aws-lambda'

export const resp = (statusCode: number, body: object): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify(body)
})
