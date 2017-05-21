import { Thunk } from 'types/thunk';
import { LOBBY_GAME_GUID } from "constants/steamworks";
import { getLobbyData } from "utils/steamworks";

export const requestLobbies = (): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    const requestList = () => {
      steamworks.requestLobbyList({
        filters: [
          { key: 'game', value: LOBBY_GAME_GUID, comparator: steamworks.LobbyComparison.Equal }
        ],
        distance: steamworks.LobbyDistanceFilter.Worldwide,
        count: 50
      }, (count) => {
        console.info('Received lobby list', count);

        let lobbies: any = {};

        for (let i = 0; i < count; i++) {
          const lobby = steamworks.getLobbyByIndex(i);
          lobbies[lobby.getRawSteamID()] = getLobbyData(steamworks, lobby);
        }

        console.log(lobbies);
      });
    }
  };
}

export const initSteam = (): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    // TODO: move init code here?
  };
}
