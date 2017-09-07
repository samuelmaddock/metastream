import { EventEmitter } from "events";
import { IRTCPeerCoordinator, RTCPeerConn } from "lobby/rtc";

export class ElectronRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  signal(signal: string): void {
    throw new Error("Method not implemented.");
  }
}
