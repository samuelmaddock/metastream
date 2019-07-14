import { SignalData } from 'simple-peer'

/** 64-char hex public key. */
export type RoomID = string

export type ClientID = number

export const enum MessageType {
  CreateRoom,
  CreateRoomSuccess,
  JoinRoom,
  AuthChallenge,
  AuthResponse,
  CandidateOffer,
  Ping,
  Pong,
  RoomNotFound
}

export type Request =
  | {
      t: MessageType.CreateRoom
      id: string
    }
  | { t: MessageType.CreateRoomSuccess }
  | {
      t: MessageType.JoinRoom
      id: string
      /** Offer */
      o: SignalData
    }
  | {
      t: MessageType.AuthResponse
      /** Challenge */
      c: string
    }
  | {
      t: MessageType.AuthChallenge
      /** Challenge */
      c: string
    }
  | {
      t: MessageType.CandidateOffer
      /** Offer */
      o: SignalData
      /** From */
      f?: ClientID
      to?: ClientID
    }
  | { t: MessageType.Ping }
  | { t: MessageType.Pong }
  | { t: MessageType.RoomNotFound }

export enum SignalErrorCode {
  RoomNotFound = 'roomnotfound'
}
