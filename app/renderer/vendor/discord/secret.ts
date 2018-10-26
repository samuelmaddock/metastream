export const encodeDiscordSecret = (secret: string, sessionId: string) => {
  return btoa([secret, sessionId].join(','))
}

export const decodeDiscordSecret = (secretHash: string) => {
  let decoded
  try {
    decoded = atob(secretHash).split(',')
  } catch {
    return null
  }
  return {
    secret: decoded[0],
    id: decoded[1]
  }
}
