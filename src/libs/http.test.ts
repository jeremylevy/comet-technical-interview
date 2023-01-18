import * as http from './http'

describe('resp', () => {
  it.each(
    [
      [200, { bar: 'bar' }],
      [404, { error_message: 'not_found' }]
    ]
  )('returns a valid response for API gateway', async (statusCode, body) => {
    const resp = http.resp(statusCode, body)

    expect(resp).toStrictEqual({
      statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    })
  })
})
