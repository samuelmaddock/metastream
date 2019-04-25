import { Middleware } from 'redux'

import { netRpcMiddleware } from 'network/middleware/rpc'
import { netSyncMiddleware } from 'network/middleware/sync'
import { usersMiddleware } from 'lobby/middleware/users'
import { sessionMiddleware, SessionObserver } from 'lobby/middleware/session'

// import { FirebaseSessionObserver } from 'vendor/firebase/sessionObserver'

// prettier-ignore
const sessionObservers = [
  // FEATURE_SESSION_BROWSER && new FirebaseSessionObserver()
].filter(Boolean) as SessionObserver[]

const middleware: Middleware[] = [
  netRpcMiddleware(),
  netSyncMiddleware(),
  usersMiddleware(),
  sessionMiddleware(sessionObservers)
]

export default middleware
