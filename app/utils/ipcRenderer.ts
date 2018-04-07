const { ipcRenderer } = chrome

let ipcGuid = 0

export async function ipcRendererRpc<T>(command: string, ...args: any[]) {
  return new Promise<T>((resolve, reject) => {
    const ipcId = ++ipcGuid
    const resultEvent = `${command}-result`
    const cb = (event: Electron.Event, id: number, result: T) => {
      if (id === ipcId) {
        ipcRenderer.removeListener(resultEvent, cb)
        resolve(result)
      }
    }
    ipcRenderer.send(command, ipcGuid++, ...args)
    ipcRenderer.on(resultEvent, cb)
  })
}
