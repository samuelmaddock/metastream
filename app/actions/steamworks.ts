import { Thunk } from 'types/thunk';
import { LOBBY_GAME_GUID } from "constants/steamworks";
import { getLobbyData } from "utils/steamworks";
import { actionCreator } from "utils/redux";
import { push } from "react-router-redux";
import { PlatformService } from "platform";
import { ILobbySession } from "platform/types";

export const loadLobbies = actionCreator<void>('LOAD_LOBBIES');
export const setLobbies = actionCreator<ILobbySession[]>('SET_LOBBIES');

export const requestLobbies = (): Thunk<void> => {
  return async (dispatch, getState, { steamworks }) => {
    dispatch(loadLobbies());

    let lobbies: ILobbySession[];

    try {
      lobbies = await PlatformService.findLobbies();
    } catch(e) {
      console.error(e);
      return;
    }

    dispatch(setLobbies(lobbies));
  };
}
