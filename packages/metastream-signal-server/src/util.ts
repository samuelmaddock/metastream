import { EventEmitter } from 'events'

export interface CancelablePromise<T> extends Promise<T> {
  cancel(): void
}

export const waitEvent = <T = {}>(
  emitter: EventEmitter,
  eventName: string,
  timeout: number = 5000
): CancelablePromise<T[]> => {
  let timeoutId: any
  let resolve: Function, reject: Function

  const promise: any = new Promise<T[]>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    emitter.removeListener(eventName, callback)
  }
  promise.cancel = cleanup

  const callback = (...args: any[]) => {
    cleanup()
    resolve(args)
  }

  const timeoutCallback = () => {
    cleanup()
    reject(`Timeout waiting for '${eventName}' response`)
  }

  emitter.addListener(eventName, callback)
  timeoutId = setTimeout(timeoutCallback, timeout)

  return promise
}
