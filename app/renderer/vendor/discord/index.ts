export { default as DiscordSessionObserver } from './sessionObserver'
export { default as discordInviteMiddleware } from './inviteMiddleware'

import { avatarRegistry, AvatarEntry } from '../../services/avatar'
const { ipcRenderer } = chrome

const DISCORD_CDN = 'https://cdn.discordapp.com/'
const DISCORD_AVATAR_TYPE = 'discord'

let ready: boolean = false
export const isDiscordAvailable = () => ready

/** https://discordapp.com/developers/docs/reference#snowflakes */
function isSnowflake(id: string) {
  return typeof id === 'string' && /\d+/.test(id)
}

function init() {
  avatarRegistry.registerType(DISCORD_AVATAR_TYPE, (userId: string, userAvatar: string) => {
    if (isSnowflake(userId) && typeof userAvatar === 'string') {
      return `${DISCORD_CDN}avatars/${userId}/${userAvatar}.png`
    }
  })

  let avatarEntry: AvatarEntry | null = null

  // Register discord user avatar upon login
  ipcRenderer.on('discord-user', (event: Electron.Event, user: any) => {
    ready = true
    const { id, avatar } = user

    if (id && avatar) {
      // Remove old avatar if Discord was toggled off/on
      if (avatarEntry) {
        avatarRegistry.deleteByURI(avatarEntry.uri)
        avatarEntry = null
      }

      avatarEntry = avatarRegistry.register({
        type: DISCORD_AVATAR_TYPE,
        artist: 'Discord',
        params: [id, avatar]
      })
    }
  })
}

init()
