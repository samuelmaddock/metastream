import shortid from 'shortid'

export class MultiTabObserver {
  private channel?: BroadcastChannel
  private observerId = shortid()

  constructor() {
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('multitab_observer')
      this.channel.addEventListener('message', this.onMessage)
    }
  }

  destroy() {
    if (this.channel) {
      this.channel.close()
    }
  }

  private onMessage = (event: MessageEvent) => {
    const action = event.data
    if (action.id === this.observerId) return
    switch (action.type) {
      case 'ping':
        this.channel!.postMessage({ type: 'pong', payload: this.observerId })
        break
    }
  }

  getIsMultiTab() {
    if (!this.channel) return Promise.resolve(false)
    return new Promise(resolve => {
      let done = false
      let timeoutId: any

      const channel = this.channel!
      channel.postMessage({ type: 'ping', id: this.observerId })

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        channel.removeEventListener('message', onMessage)
        done = true
      }

      const onMessage = (event: MessageEvent) => {
        const action = event.data
        if (action.type === 'pong' && action.id !== this.observerId) {
          cleanup()
          resolve(true)
        }
      }
      channel.addEventListener('message', onMessage)

      timeoutId = setTimeout(() => {
        timeoutId = undefined
        cleanup()
        resolve(false)
      }, 200)
    })
  }
}
