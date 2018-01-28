import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { IAppState } from 'renderer/reducers';
import { addUser, removeUser } from '../middleware/users';

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
    return { ...rest };
  }

  return state;
};

export const getUserName = (state: IAppState, userId: string): string => {
  const user = state.users[userId];
  return user ? user.name : 'Unknown';
};
