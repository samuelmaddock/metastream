import { ipcRenderer } from 'electron'
import { CoreOptions, RequestResponse } from 'request'

let fetchId = 0
const mainFetch = (url: string, options?: CoreOptions): Promise<RequestResponse> => {
  return new Promise((resolve, reject) => {
    if (url.startsWith('//')) {
      url = `https:${url}`
    }

    try {
      new URL(url)
    } catch (e) {
      reject(e)
      return
    }

    const requestId = fetchId++

    const handler = (event: any, responseId: number, err: any, resp: any) => {
      if (requestId !== responseId) {
        return
      }
      ipcRenderer.removeListener('fetch-response', handler)

      if (err) {
        reject(err)
        return
      }

      resolve(resp)
    }

    ipcRenderer.on('fetch-response', handler)

    ipcRenderer.send('fetch-request', requestId, url, options)
  })
}

export const fetchText = async <T = string>(
  url: string,
  options?: CoreOptions
): Promise<[T, RequestResponse]> => {
  const resp = await mainFetch(url, options)
  return [resp.body, resp]
}

export const fetchResponse = async (
  url: string,
  options?: CoreOptions
): Promise<RequestResponse> => {
  const resp = await mainFetch(url, options)
  return resp
}
