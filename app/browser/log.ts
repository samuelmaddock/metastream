import { BrowserWindow } from 'electron'

const _log = (type: string, ...args: any[]) => {
  (console as any)[type].apply(console, args)
  const win = BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('log', { type, args })
  })
}

const createLogger = (type: string) => (...args: any[]) => _log(type, ...args)

const logger = createLogger('log')

Object.assign(logger, {
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  debug: createLogger('debug')
})

type Log = (...args: any[]) => void
interface ILogger {
  (...args: any[]): void
  info: Log
  warn: Log
  error: Log
  debug: Log
}

export default logger as ILogger
export const log = logger
