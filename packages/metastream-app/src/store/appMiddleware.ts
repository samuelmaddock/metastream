import { Middleware } from 'redux'

import { netRpcMiddleware } from 'network/middleware/rpc'
import { netSyncMiddleware } from 'network/middleware/sync'
import { usersMiddleware } from 'lobby/middleware/users'
import { sessionMiddleware, SessionObserver } from 'lobby/middleware/session'
import { pwaMiddleware } from '../middleware/pwa'

const middleware: Middleware[] = [
  netRpcMiddleware(),
  netSyncMiddleware(),
  usersMiddleware(),
  sessionMiddleware(),
  pwaMiddleware()
]

export default middleware
