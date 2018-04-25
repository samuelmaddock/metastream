const { ipcRenderer } = chrome
import { sha1 } from 'crypto-hash'

let valid: boolean | null = null
let license: string | null = null

export function hasValidLicense(): boolean {
  if (typeof valid === 'boolean') {
    return valid
  } else {
    const result = ipcRenderer.sendSync('validate-license')
    valid = result.valid
    license = result.license
    return !!valid
  }
}

export function getLicense() {
  if (hasValidLicense()) {
    return typeof license === 'string' ? license : undefined
  }
}

export async function getLicenseHash(): Promise<string | undefined> {
  const license = getLicense()
  if (license) {
    return await sha1(license)
  }
}

export function registerLicense(license: string) {
  valid = ipcRenderer.sendSync('register-license', license)
  return !!valid
}

export function removeLicense() {
  ipcRenderer.send('remove-license')
  valid = false
}
