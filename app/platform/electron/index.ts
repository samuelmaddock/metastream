import { ipcRenderer } from 'electron';

import { Platform, ILobbyOptions, ILobbySession } from "platform/types";
import { IRTCPeerCoordinator } from "lobby/rtc";
import { Deferred } from "utils/async";

export class ElectronPlatform extends Platform {
  private currentSessionId: string | null;

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const deferred = new Deferred<boolean>();

    ipcRenderer.once('platform-create-lobby-result', (event: any, sessionId: string) => {
      this.currentSessionId = sessionId;
      deferred.resolve(true);
    });

    ipcRenderer.send('platform-create-lobby');

    return await deferred.promise;
  }

  joinLobby(id: string): Promise<boolean> {
    const deferred = new Deferred<boolean>();
    this.currentSessionId = id;
    ipcRenderer.send('platform-join-lobby', id);

    ipcRenderer.once('platform-join-lobby-result', (event: any, success: boolean) => {
      deferred.resolve(success);
    });

    return deferred.promise;
  }

  leaveLobby(id: string): boolean {
    ipcRenderer.send('platform-leave-lobby', id);
    this.currentSessionId = null;
    return true;
  }

  async findLobbies(): Promise<ILobbySession[]> {
    const deferred = new Deferred<ILobbySession[]>();

    ipcRenderer.once('platform-query-result', (event: any, results: any) => {
      deferred.resolve(results);
    });

    ipcRenderer.send('platform-query', {});

    return await deferred.promise;
  }

  createPeerCoordinator(): IRTCPeerCoordinator {
    throw new Error("Method not implemented.");
  }

}
