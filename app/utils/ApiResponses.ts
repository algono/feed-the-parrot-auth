export function response(statusCode: number, data = {}) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Origin': '*',
    },
    statusCode,
    body: JSON.stringify(data),
  }
}