import { Middleware } from "redux";

import { netRpcMiddleware } from "renderer/network/middleware/rpc";
import { netSyncMiddleware } from "renderer/network/middleware/sync";
import { usersMiddleware } from "renderer/lobby/middleware/users";
import { sessionMiddleware } from "renderer/lobby/middleware/session";

const middleware: Middleware[] = [
  netRpcMiddleware(),
  netSyncMiddleware(),
  usersMiddleware(),
  sessionMiddleware()
]

export default middleware
