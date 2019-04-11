import { chat, IChatState } from './chat'
import { users, IUsersState } from './users'
import { session, ISessionState } from './session'
import { mediaPlayer, IMediaPlayerState } from './mediaPlayer'

export interface ILobbyNetState {
  chat: IChatState
  mediaPlayer: IMediaPlayerState
  session: ISessionState
  users: IUsersState
}

export const lobbyReducers = {
  chat,
  mediaPlayer,
  session,
  users
}
