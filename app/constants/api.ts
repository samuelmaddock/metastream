export const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://getmetastream.com/api'
    : 'http://localhost:5000/getmetastream/us-central1/api'

export const CDN_URL = 'http://cdn.getmetastream.com/'

export const API_ORIGIN = 'https://app.getmetastream.com/'
