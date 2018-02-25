import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'
import { validateLicense } from 'license-gen'
import { LICENSE_PUBLIC_KEY } from 'constants/license'
import log from 'browser/log'

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

const validate = (license: string) => {
  let valid
  try {
    valid = validateLicense(license, LICENSE_PUBLIC_KEY) as boolean
  } catch (e) {
    valid = false
  }
  return valid
}

ipcMain.on('validate-license', (event: Electron.Event) => {
  const license = readLicense()
  event.returnValue = license ? validate(license) : false
})

ipcMain.on('register-license', (event: Electron.Event, license: string) => {
  const valid = validate(license)
  if (valid) {
    writeLicense(license)
  }
  event.returnValue = valid
})
