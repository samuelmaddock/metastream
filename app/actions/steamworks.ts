import { Thunk } from 'types/thunk';
import { LOBBY_GAME_GUID } from "constants/steamworks";
import { getLobbyData } from "utils/steamworks";
import { actionCreator } from "utils/redux";
import { push } from "react-router-redux";

export interface ILobbyRequestResult {
  steamId: Steamworks.SteamID64;
  data: {[key: string]: string}
}

export interface IChatMessage {
  senderId: Steamworks.SteamID64;
  name: string;
  text: string;
}

interface ILobbyChatAction<P> {
  type: string;
  payload: P;
}

type LobbyChatMessageAction = ILobbyChatAction<string>;

export const loadLobbies = actionCreator<void>('LOAD_LOBBIES');
export const setLobbies = actionCreator<ILobbyRequestResult[]>('SET_LOBBIES');
export const setLobby = actionCreator<void>('SET_LOBBY');
export const addChat = actionCreator<IChatMessage>('ADD_CHAT');

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

const lobbyEvents: any = {};

export const joinLobby = (lobbyId: Steamworks.SteamID64): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    steamworks.joinLobby(lobbyId, (test) => {
      console.info('JOINED LOBBY', lobbyId);
      // dispatch(setLobby());

      // TODO: make this more maintainable
      const events = {
        onChatMsg(lobbyId: Steamworks.SteamID, userId: Steamworks.SteamID, type: any, chatId: number) {
          const entry = steamworks.getLobbyChatEntry(lobbyId.getRawSteamID(), chatId);
          const message = entry.message.toString('utf-8');
          let json: LobbyChatMessageAction;

          try {
            json = JSON.parse(message);
          } catch (e) {
            console.error('Failed to parse message');
            return;
          }

          console.log('Received', entry, json);

          if (json.type === 'chat') {
            dispatch(addChat({
              senderId: entry.steamId,
              name: userId.getPersonaName(),
              text: json.payload
            }));
          }

          // if (entry.steamId !== steamworks.getSteamId().getRawSteamID()) {
          // }
        }
      };
      lobbyEvents[lobbyId] = events;

      steamworks.on('lobby-chat-message', events.onChatMsg);
    });
  };
};

export const leaveLobby = (lobbyId: Steamworks.SteamID64): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    steamworks.leaveLobby(lobbyId);
    console.info('LEFT LOBBY', lobbyId);

    const events = lobbyEvents[lobbyId];
    if (events) {
      steamworks.removeListener('lobby-chat-message', events.onChatMsg);
      lobbyEvents[lobbyId] = undefined;
    }
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

export const sendLobbyChatMsg = (lobbyId: Steamworks.SteamID64, msg: string): Thunk<void> => {
  return (dispatch, getState, { steamworks }) => {
    // TODO: create chat middleware for handling protocol
    const envelope: LobbyChatMessageAction = {
      type: 'chat',
      payload: msg
    };

    const json = JSON.stringify(envelope);
    console.log('SendLobbyChatMsg', json);
    const buf = Buffer.from(json, 'utf-8');
    steamworks.sendLobbyChatMsg(lobbyId, buf);
  };
};
