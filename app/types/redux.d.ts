import { Dispatch, Reducer } from 'redux';
import { IAppState } from 'renderer/reducers';

interface IReactReduxProps {
  dispatch: Dispatch<IAppState>;
}
