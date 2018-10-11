import { Middleware } from 'redux'

import { netRpcMiddleware } from 'renderer/network/middleware/rpc'
import { netSyncMiddleware } from 'renderer/network/middleware/sync'
import { usersMiddleware } from 'renderer/lobby/middleware/users'
import { sessionMiddleware, SessionObserver } from 'renderer/lobby/middleware/session'

import { FirebaseSessionObserver } from 'renderer/vendor/firebase/sessionObserver'
import { DiscordSessionObserver, discordInviteMiddleware } from 'renderer/vendor/discord'

const sessionObservers = [
  FEATURE_SESSION_BROWSER && new FirebaseSessionObserver(),
  FEATURE_DISCORD_RP && new DiscordSessionObserver()
].filter(Boolean) as SessionObserver[]

const middleware: Middleware[] = [
  netRpcMiddleware(),
  netSyncMiddleware(),
  usersMiddleware(),
  sessionMiddleware(sessionObservers)
]

if (FEATURE_DISCORD_RP) {
  middleware.push(discordInviteMiddleware())
}

export default middleware
