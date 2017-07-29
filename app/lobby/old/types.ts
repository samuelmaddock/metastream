import { Component } from 'react';

export interface ILobbyProps {
  host: boolean;
  hostId: string;
  localId: string;
  lobbySend(data: Buffer): void;
}

export abstract class LobbyComponent<P extends ILobbyProps = ILobbyProps, S = {}> extends Component<P, S> {
  abstract lobbyConnect(): void;
  abstract lobbyReceive(message: ILobbyMessage): void;
}

export const enum LobbyNetworkState {
  Uninitialized = 1,
  Connected
}

export interface ILobbyMessage {
  userId: any;
  data: Buffer;
}

export interface INetAction<T = undefined> {
  type: string;
  payload: T;
}

export interface INetResponse<T = undefined> extends INetAction<T> {
  userId: string;
}
