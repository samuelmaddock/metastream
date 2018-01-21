'use strict'

const http = require('http')
const electron = require('electron')

/** Polyfill for Electron net API removed in Muon */
electron.net = {
  request: http.request
}
