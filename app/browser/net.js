'use strict'

const http = require('http')
const https = require('https')
const electron = require('electron')

/** Polyfill for Electron net API removed in Muon */
electron.net = {
  request: (opts, cb) => {
    const protocol = typeof opts === 'object' ? opts.protocol : typeof opts === 'string' ? opts : opts.toString()
    const useHttps = protocol.indexOf('https') === 0
    if (useHttps) {
      return https.request(opts, cb)
    } else {
      return http.request(opts, cb)
    }
  }
}
