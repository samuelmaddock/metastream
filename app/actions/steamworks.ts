import { Thunk } from 'types/thunk';
import { LOBBY_GAME_GUID } from "constants/steamworks";
import { getLobbyData } from "utils/steamworks";
import { actionCreator } from "utils/redux";
import { push } from "react-router-redux";

export interface ILobbyRequestResult {
  steamId: Steamworks.SteamID64;
  data: {[key: string]: string}
}

export const loadLobbies = actionCreator<void>('LOAD_LOBBIES');
export const setLobbies = actionCreator<ILobbyRequestResult[]>('SET_LOBBIES');
export const setLobby = actionCreator<void>('SET_LOBBY');

export const initSteam = (): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    // TODO: move init code here?
  };
}

export const requestLobbies = (): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    dispatch(loadLobbies());

    steamworks.requestLobbyList({
      filters: [
        { key: 'game', value: LOBBY_GAME_GUID, comparator: steamworks.LobbyComparison.Equal }
      ],
      distance: steamworks.LobbyDistanceFilter.Worldwide,
      count: 50
    }, (count) => {
      console.info('Received lobby list', count);

      let lobbies = [];

      for (let i = 0; i < count; i++) {
        const lobbyId = steamworks.getLobbyByIndex(i);

        const lobby = {
          steamId: lobbyId.getRawSteamID(),
          data: getLobbyData(steamworks, lobbyId)
        };
        lobbies.push(lobby)
      }

      console.log(lobbies);
      dispatch(setLobbies(lobbies));
    });
  };
}

export const joinLobby = (lobbyId: Steamworks.SteamID64): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    steamworks.joinLobby(lobbyId, (test) => {
      console.info('JOINED LOBBY', lobbyId);
      // dispatch(setLobby());
    });
  };
};

export const leaveLobby = (lobbyId: Steamworks.SteamID64): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    steamworks.leaveLobby(lobbyId);
    console.info('LEFT LOBBY', lobbyId);
    // dispatch(setLobby());
  };
};

export const createLobby = (): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    console.log('Creating lobby...');
    steamworks.createLobby(steamworks.LobbyType.Public, 16, lobbyId => {
      console.info('CREATED LOBBY', lobbyId);
      steamworks.setLobbyData(lobbyId, 'game', LOBBY_GAME_GUID);
      dispatch(push(`/lobby/${lobbyId}?owner`));
    });
  };
};
