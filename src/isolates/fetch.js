import Debug from 'debug'
const debug = Debug('AI:fetch')

export const api = {
  // TODO make a readPage function that returns a summary of a url
  post: {
    description: `Sends an http post request to the address in the url parameter with everything in the data parameter being sent as the POST data.  The results are returned as a json object.  For example the following function input parameters:

      const url = 'https://example.com/api/endpoint'
      const data = {
        param1: 'value1',
        param2: 'value2'
      }
      
      would result in the call:

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
      
      fetch(url, requestOptions)
        .then(response => response.json())

      which would return the results as a json object.
      `,
    type: 'object',
    additionalProperties: false,
    required: ['url'],
    properties: {
      url: { type: 'string' },
      data: { type: 'object' },
    },
  },
}
export const functions = {
  post: async ({ url, data }) => {
    debug('post', url, data)
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
    if (data) {
      requestOptions.body = JSON.stringify(data)
    }
    return fetch(url, requestOptions).then((response) => response.json())
  },
}
