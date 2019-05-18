export default (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  ? {
      provider: 'generic',
      url: `http://localhost:8080/`
    }
  : {
      provider: 'github',
      repo: 'metastream-legacy-releases',
      owner: 'samuelmaddock'
    })
