import { ipcRenderer } from 'electron';

import { Platform, ILobbyOptions, ILobbySession } from "platform/types";
import { IRTCPeerCoordinator } from "lobby/rtc";
import { Deferred } from "utils/async";
import { ElectronRTCPeerCoordinator } from "platform/electron/peer-coordinator";
import { ElectronLobby } from "platform/electron/lobby";

export class ElectronPlatform extends Platform {
  private currentSession: ElectronLobby | null;

  async createLobby(opts: ILobbyOptions): Promise<boolean> {
    const lobby = await ElectronLobby.createLobby();
    this.currentSession = lobby;
    return !!lobby;
  }

  async joinLobby(id: string): Promise<boolean> {
    const lobby = await ElectronLobby.joinLobby(id);
    this.currentSession = lobby;
    return !!lobby;
  }

  leaveLobby(id: string): boolean {
    if (this.currentSession) {
      this.currentSession.close();
      this.currentSession = null;
    }
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
    if (!this.currentSession) {
      throw new Error('[Electron Platform] createPeerCoordinator: No active session.');
    }

    return new ElectronRTCPeerCoordinator(this.currentSession);
  }

}
