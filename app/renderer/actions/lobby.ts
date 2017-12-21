import { Thunk } from 'types/thunk';
import { actionCreator } from 'utils/redux';
import { push } from 'react-router-redux';
import { PlatformService } from 'renderer/platform';
import { ILobbySession } from 'renderer/platform/types';

export const loadLobbies = actionCreator<void>('LOAD_LOBBIES');
export const setLobbies = actionCreator<ILobbySession[]>('SET_LOBBIES');

export const requestLobbies = (): Thunk<void> => {
  return async (dispatch, getState) => {
    dispatch(loadLobbies());

    let lobbies: ILobbySession[];

    try {
      lobbies = await PlatformService.findLobbies();
    } catch (e) {
      console.error(e);
      return;
    }

    dispatch(setLobbies(lobbies));
  };
};
