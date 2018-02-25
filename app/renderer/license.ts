const { ipcRenderer } = chrome

let valid: boolean | null = null

export function hasValidLicense() {
  if (typeof valid === 'boolean') {
    return valid
  } else {
    valid = ipcRenderer.sendSync('validate-license')
    return valid
  }
}

export function registerLicense(license: string) {
  valid = ipcRenderer.sendSync('register-license', license)
  return !!valid
}
