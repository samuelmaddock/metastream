import { CDN_URL } from './api'

export default (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  ? {
      provider: 'generic',
      url: `http://localhost:8080/`
    }
  : {
      provider: 'github',
      repo: 'metastream',
      owner: 'samuelmaddock'
    })
