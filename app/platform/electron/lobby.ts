import { EventEmitter } from 'events';
import { steamworks } from "steam";
import { ipcRenderer, remote } from 'electron';
import { NetUniqueId } from "lobby/types";

import { LOBBY_GAME_GUID } from "constants/steamworks";
import { Deferred } from "utils/async";

type SteamID64 = Steamworks.SteamID64;
type SteamUniqueId = NetUniqueId<Steamworks.SteamID64>;

interface ElectronLobbyOptions {
  id: string;
  host?: boolean;
  hostId?: string;
}

export interface IElectronLobbyMessage {
  senderId: string;
  message: Buffer;
}

export class ElectronLobby extends EventEmitter {
  private id: string;

  isOwner: boolean = false;
  ownerId: string;

  private constructor(opts: ElectronLobbyOptions) {
    super();

    this.id = opts.id;
    this.isOwner = !!opts.host;
    this.ownerId = opts.host ? remote.webContents.getFocusedWebContents().id + '' : opts.hostId!;

    // window.addEventListener('beforeunload', this.close, false);

    ipcRenderer.on(`platform-lobby-message-${this.id}`, this.onMessage);
  }

  close = (): void => {
    ipcRenderer.removeListener(`platform-lobby-message-${this.id}`, this.onMessage);
    ipcRenderer.send('platform-leave-lobby', this.id);
  }

  private onMessage = (todo: any): void => {
    const entry: IElectronLobbyMessage = {
      senderId: '-1', // TODO
      message: todo
    };
    console.log('Received Electron lobby message', entry);
    this.emit('message', entry);
  }

  getOwner(): SteamID64 {
    return this.ownerId;
  }

  sendChatMessage(targetId: string, message: Buffer) {
    ipcRenderer.send(`platform-lobby-message-${this.id}`, message);
  }

  static async createLobby(): Promise<ElectronLobby> {
    const deferred = new Deferred<ElectronLobby>();

    ipcRenderer.once('platform-create-lobby-result', (event: any, sessionId: string) => {
      const lobby = new ElectronLobby({id: sessionId, host: true});
      deferred.resolve(lobby);
    });

    ipcRenderer.send('platform-create-lobby');

    return await deferred.promise;
  }

  static async joinLobby(lobbyId: string): Promise<ElectronLobby> {
    const deferred = new Deferred<ElectronLobby>();
    ipcRenderer.send('platform-join-lobby', lobbyId);

    ipcRenderer.once('platform-join-lobby-result', (event: any, success: boolean, hostId: string) => {
      const lobby = new ElectronLobby({id: lobbyId, hostId});
      deferred.resolve(lobby);
    });

    return deferred.promise;
  }
}
