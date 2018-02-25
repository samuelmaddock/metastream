import { ipcMain } from 'electron'
import { validateLicense } from 'license-gen'
import { LICENSE_PUBLIC_KEY } from 'constants/license'
import { log } from 'browser/log'

const validate = (license: string) => {
  let valid
  try {
    valid = validateLicense(license, LICENSE_PUBLIC_KEY)
  } catch (e) {
    valid = false
  }
  return valid
}

ipcMain.on('validate-license', (event: Electron.Event, license: string) => {
  // TODO: read from file
  event.returnValue = false
})

ipcMain.on('register-license', (event: Electron.Event, license: string) => {
  const valid = validate(license)

  // TODO: write to file

  event.returnValue = valid
})
