import { EventEmitter } from 'events'
import { VERSION } from '../constants/app'
import { sleep } from '../utils/async'

const UPDATE_INTERVAL = 12 * 60 * 60 * 1000

class UpdateService extends EventEmitter {
  constructor() {
    super()
    this.checkForUpdate = this.checkForUpdate.bind(this)
    setInterval(this.checkForUpdate, UPDATE_INTERVAL)
  }

  async checkForUpdate(delay?: number) {
    if (delay) await sleep(delay)

    let liveVersion

    try {
      const response = await fetch('/version.txt', { cache: 'no-cache' })
      liveVersion = response.status === 200 && (await response.text())
    } catch (e) {
      console.error('Failed to check for update', e)
    }

    if (!liveVersion) return

    const isUpdateAvailable = VERSION !== liveVersion

    if (isUpdateAvailable) {
      this.emit('update', liveVersion, VERSION)
    }
  }

  update = async () => {
    // unregister all service workers to clear cache
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map(registration => registration.unregister()))

    window.location.reload(true)
  }
}

export const updateService = new UpdateService()
