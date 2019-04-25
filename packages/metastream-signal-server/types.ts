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
  CandidateOffer
}

export type Request =
  | {
      type: MessageType.CreateRoom
      id: string
    }
  | { type: MessageType.CreateRoomSuccess }
  | { type: MessageType.JoinRoom; id: string; offer: SignalData }
  | { type: MessageType.AuthResponse; challenge: string }
  | { type: MessageType.AuthChallenge; challenge: string }
  | { type: MessageType.CandidateOffer; offer: SignalData; from?: ClientID; to?: ClientID }
