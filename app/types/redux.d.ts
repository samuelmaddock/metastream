import { Dispatch, Reducer } from 'redux';
import { IAppState } from 'reducers';

interface IReactReduxProps {
  dispatch: Dispatch<IAppState>;
}
