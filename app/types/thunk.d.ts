import { ThunkAction } from 'redux-thunk';
import { IAppState } from "reducers";

interface IExtra {
  steamworks: Steamworks.API;
}

export type Thunk<T> = ThunkAction<T, IAppState, IExtra>;
