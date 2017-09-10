import { Reducer } from "redux";
import { NetworkState } from "types/network";
import { isType } from "utils/redux";
import { addChat } from "lobby/net/actions/chat";
import { addUser, removeUser } from "lobby/net/middleware/users";
import { ILobbyNetState } from "lobby/net/reducers";

export interface IUser {
  id: string;
  name: string;
}

export interface IUsersState {
  [key: string]: IUser | undefined;
}

const initialState: IUsersState = {};

export const users: Reducer<IUsersState> = (state: IUsersState = initialState, action: any) => {
  if (isType(action, addUser)) {
    const conn = action.payload.conn;
    const id = conn.id.toString();
    return {
      ...state,
      [id]: {
        id,
        name: action.payload.name
      }
    };
  } else if (isType(action, removeUser)) {
    const id = action.payload;
    const { [id]: removed, ...rest } = state;
    return {...rest};
  }

  return state;
};

export const getUserName = (state: ILobbyNetState, userId: string): string => {
  const user = state.users[userId];
  return user ? user.name : 'Unknown';
};
