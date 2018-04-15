import { Reducer } from 'redux';
import { isType } from 'utils/redux';
import { IAppState } from 'renderer/reducers';
import { DEFAULT_USERS_MAX } from 'constants/settings';

export interface ISessionState {
  maxUsers: number
};

const initialState: ISessionState = {
  maxUsers: DEFAULT_USERS_MAX
};

export const session: Reducer<ISessionState> = (
  state: ISessionState = initialState,
  action: any
) => {
  return state;
};
