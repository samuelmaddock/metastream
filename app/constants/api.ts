export const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://getmetastream.com/api'
    : 'http://localhost:5000/getmetastream/us-central1/api'

export const CDN_URL = 'https://d3dxb9zhznq01f.cloudfront.net'

export const API_ORIGIN = 'https://app.getmetastream.com/'
