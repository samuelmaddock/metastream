import { ipcRenderer } from 'electron';

import { Platform, ILobbyOptions, ILobbySession } from "platform/types";
import { IRTCPeerCoordinator } from "lobby/rtc";
import { Deferred } from "utils/async";

export class ElectronPlatform extends Platform {
  private currentSession: string;

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const deferred = new Deferred<boolean>();

    ipcRenderer.once('platform-create-lobby-result', (event: any, sessionId: string) => {
      this.currentSession = sessionId;
      deferred.resolve(true);
    });

    ipcRenderer.send('platform-create-lobby');

    return await deferred.promise;
  }

  joinLobby(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  leaveLobby(id: string): boolean {
    throw new Error("Method not implemented.");
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
