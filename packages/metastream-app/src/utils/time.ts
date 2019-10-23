const formatSeconds = (sec: number): string => {
  sec = Math.round(sec)

  let hours: string | number = Math.floor(sec / 3600)
  let minutes: string | number = Math.floor((sec % 3600) / 60)
  let seconds: string | number = sec % 60

  if (minutes < 10) {
    minutes = '0' + minutes
  }

  if (seconds < 10) {
    seconds = '0' + seconds
  }

  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`
}

export const formatMs = (ms: number): string => {
  return formatSeconds(ms / 1000)
}

export const formatShortMs = (ms: number): string => {
  const sec = Math.round(ms / 1000)

  let hours: string | number = Math.floor(sec / 3600)
  let minutes: string | number = Math.floor((sec % 3600) / 60)
  let seconds: string | number = sec % 60

  if (hours > 0 && minutes < 10) {
    minutes = '0' + minutes
  }

  if ((hours > 0 || minutes > 0) && seconds < 10) {
    seconds = '0' + seconds
  }

  return hours > 0
    ? `${hours}:${minutes}:${seconds}`
    : minutes > 0
    ? `${minutes}:${seconds}`
    : `${seconds}`
}

const canFormatTime = Boolean(Intl.DateTimeFormat && Intl.DateTimeFormat.prototype.formatToParts)
const time12Formatter: any = canFormatTime
  ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' })
  : null

export const formatShortTimestamp = (timestamp: number) => {
  if (!canFormatTime) return null
  const date = new Date(timestamp)
  const parts = time12Formatter.formatToParts(date)
  const result = parts
    .reduce((str: string, part: any) => {
      if (part.type === 'dayPeriod') return str
      return str + part.value
    }, '')
    .trim()
  return result
}
