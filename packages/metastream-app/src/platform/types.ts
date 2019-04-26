import { NetServer, NetUniqueId } from 'network'

export interface ILobbyOptions {
  p2p?: boolean
  websocket?: boolean
}

export type Key = Uint8Array

export interface KeyPair {
  publicKey: Key
  privateKey: Key
}
