import { EventEmitter } from 'events';
import { ipcRenderer, remote } from 'electron';

import { Deferred } from 'utils/async';

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
    this.ownerId = opts.host ? remote.getCurrentWindow().id + '' : opts.hostId!;

    window.addEventListener('beforeunload', this.close, false);

    ipcRenderer.on(`platform-lobby-message-${this.id}`, this.onMessage);
    console.log(
      `Renderer ElectronLobby now listening for messages on 'platform-lobby-message-${this.id}'`
    );
  }

  close = (): void => {
    window.removeEventListener('beforeunload', this.close, false);
    ipcRenderer.removeListener(`platform-lobby-message-${this.id}`, this.onMessage);
    ipcRenderer.send('platform-leave-lobby', this.id);
  };

  private onMessage = (event: any, senderId: number, msg: Buffer): void => {
    const entry: IElectronLobbyMessage = {
      senderId: senderId + '',
      message: msg
    };
    console.log('Received Electron lobby message', entry);
    this.emit('message', entry);
  };

  getOwner(): string {
    return this.ownerId;
  }

  sendChatMessage(targetId: string, message: Buffer) {
    ipcRenderer.send(`platform-lobby-message-${this.id}`, targetId, message);
  }

  static async createLobby(): Promise<ElectronLobby> {
    const deferred = new Deferred<ElectronLobby>();

    ipcRenderer.once('platform-create-lobby-result', (event: any, sessionId: string) => {
      const lobby = new ElectronLobby({ id: sessionId, host: true });
      deferred.resolve(lobby);
    });

    ipcRenderer.send('platform-create-lobby');

    return await deferred.promise;
  }

  static async joinLobby(lobbyId: string): Promise<ElectronLobby> {
    const deferred = new Deferred<ElectronLobby>();
    ipcRenderer.send('platform-join-lobby', lobbyId);

    ipcRenderer.once(
      'platform-join-lobby-result',
      (event: any, success: boolean, hostId: string) => {
        const lobby = new ElectronLobby({ id: lobbyId, hostId });
        deferred.resolve(lobby);
      }
    );

    return deferred.promise;
  }
}
