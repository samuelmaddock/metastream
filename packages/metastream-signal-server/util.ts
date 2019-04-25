import { EventEmitter } from 'events'

export const waitEvent = (emitter: EventEmitter, eventName: string, timeout: number = 5000): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      let timeoutId: number | undefined
  
      const callback = (...args: any[]) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = undefined
        }
        resolve(args)
      }
  
      const timeoutCallback = () => {
        if (timeoutId) timeoutId = undefined
        emitter.removeListener(eventName, callback)
        reject(`Timeout waiting for '${eventName}' response`)
      }
  
      emitter.once(eventName, callback)
      timeoutId = (setTimeout(timeoutCallback, timeout) as any) as number
    })
  }
  