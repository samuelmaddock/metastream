import { Action } from "redux";

interface IAction<P> extends Action {
  type: string;
  payload: P;
}

export interface IActionCreator<P = void> {
    type: string;
    (payload?: P): IAction<P>;
}

export function actionCreator<P>(type: string): IActionCreator<P> {
    const creator = (payload: P): any => ({ type, payload });

    (creator as any).displayName = type;
    (creator as any).type = type;

    Object.defineProperties(creator, {
      displayName: {
        value: type
      },
      type: {
        value: type,
        writable: false
      }
    });

    return creator as any;
}

export function isType<P>(action: Action, actionCreator: IActionCreator<P>): action is IAction<P> {
    return action.type === actionCreator.type;
}
