import fs from 'fs-extra'
import path from 'path'
import request from 'request'
import { app, ipcMain } from 'electron'
import { machineId } from 'node-machine-id'

import { validateLicense, parseLicense } from 'license-gen'
import { LICENSE_PUBLIC_KEY } from 'constants/license'
import { API_URL, API_ORIGIN } from 'constants/api'
import log from 'browser/log'

import * as packageJson from 'package.json'

function getLicensePath() {
  return path.join(app.getPath('userData'), 'license.metastream-license')
}

function writeLicense(license: string) {
  const filepath = getLicensePath()
  try {
    fs.writeFileSync(filepath, license)
  } catch (e) {
    log.error('Failed to write license')
  }
}

function readLicense() {
  const filepath = getLicensePath()
  try {
    return fs.readFileSync(filepath).toString()
  } catch (e) {
    log.error('Failed to read license')
  }
}

function removeLicense() {
  const filepath = getLicensePath()
  try {
    return fs.removeSync(filepath)
  } catch (e) {
    log.error('Failed to remove license')
  }
}

const validate = (license: string) => {
  let valid
  try {
    valid = validateLicense(license, LICENSE_PUBLIC_KEY) as boolean
  } catch (e) {
    valid = false
  }
  return valid
}

const logLicense = async (license: string) => {
  const params = parseLicense(license)
  const machine = await machineId()
  request(`${API_URL}/license/notify`, {
    method: 'POST',
    headers: {
      Origin: API_ORIGIN
    },
    json: {
      n: params.number,
      v: packageJson.version,
      m: machine
    }
  })
}

ipcMain.on('validate-license', (event: Electron.Event) => {
  const license = readLicense()
  event.returnValue = {
    license,
    valid: license ? validate(license) : false
  }
})

ipcMain.on('register-license', (event: Electron.Event, license: string) => {
  const valid = validate(license)
  if (valid) {
    writeLicense(license)
    logLicense(license)
  }
  event.returnValue = valid
})

ipcMain.on('remove-license', () => {
  removeLicense()
})
