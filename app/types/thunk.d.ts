import { ThunkAction } from 'redux-thunk';
import { IAppState } from 'reducers';

interface IExtra {
}

export type Thunk<T> = ThunkAction<T, IAppState, IExtra>;
