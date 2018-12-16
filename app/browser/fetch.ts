import { ipcMain } from 'electron'
import request, { CoreOptions } from 'request'

/** Fetch API for renderer without CORS */
const requestHandler = (
  event: Electron.Event,
  requestId: number,
  url: string,
  options: CoreOptions
) => {
  request(
    url,
    {
      gzip: true,
      ...options
    },
    (err, resp, body) => {
      if (err) {
        event.sender.send('fetch-response', requestId, err)
        return
      }

      const response = {
        statusCode: resp.statusCode,
        headers: resp.headers,
        body: resp.body
      }

      event.sender.send('fetch-response', requestId, err, response)
    }
  )
}
ipcMain.on('fetch-request', requestHandler)
