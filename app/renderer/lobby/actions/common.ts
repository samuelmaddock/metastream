import { actionCreator } from 'utils/redux'

export const initLobby = actionCreator<{ host: boolean }>('INIT_LOBBY')
export const resetLobby = actionCreator<{ host: boolean }>('RESET_LOBBY')
