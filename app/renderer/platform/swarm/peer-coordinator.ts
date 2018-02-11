import SimplePeer, { SimplePeerData } from 'simple-peer'
const { remote, ipcRenderer } = chrome
import { EventEmitter } from 'events'

import { NetUniqueId } from 'renderer/network'
import { RTCPeerConn, IRTCPeerCoordinator, SignalData } from 'renderer/network/rtc'

import { ElectronLobby, IElectronLobbyMessage } from 'renderer/platform/electron/lobby'
import { PlatformService } from '../index';

const iceServers = [{ url: 'stun:stun3.l.google.com:19302' }]

export class SwarmRTCPeerCoordinator extends EventEmitter implements IRTCPeerCoordinator {
  private connecting = new Map<string, RTCPeerConn>()

  constructor(private host: boolean) {
    super()
    ipcRenderer.on('rtc-peer-init', this.onInitPeer)
    ipcRenderer.on('rtc-peer-signal', this.onSignal)
    ipcRenderer.on('rtc-peer-timeout', this.onTimeout)
  }

  close() {
    this.connecting.forEach(conn => conn.close())
    this.connecting.clear()

    ipcRenderer.removeListener('rtc-peer-init', this.onInitPeer)
    ipcRenderer.removeListener('rtc-peer-signal', this.onSignal)
    ipcRenderer.removeListener('rtc-peer-timeout', this.onTimeout)
  }

  private onInitPeer = async (event: Electron.Event, peerId: string) => {
    console.debug(`[PeerCoordinator] Init ${peerId}`)
    const peer = this.createPeer(peerId)

    peer.on('signal', (signal: SimplePeerData) => {
      console.info(`[PeerCoordinator] Got signal for ${peerId}`)
      ipcRenderer.send('rtc-peer-signal', peerId, signal)
    })

    const error = (e: Error) => {
      console.error(`[PeerCoordinator] Peer errored ${peerId}\n`, e)
      ipcRenderer.send('rtc-peer-error', peerId)
      peer.close()
    };

    peer.once('connect', () => {
      console.info(`[PeerCoordinator] Peer connected ${peerId}`)
      ipcRenderer.send('rtc-peer-connect', peerId)
      peer.removeListener('error', error)
      peer.removeListener('close', error)
    })

    peer.once('error', error)
    peer.once('close', error)
  }

  private onSignal = (event: Electron.Event, peerId: string, signal: SimplePeer.SignalData) => {
    if (this.connecting.has(peerId)) {
      const peer = this.connecting.get(peerId)!
      peer.signal(signal)
    }
  }

  private onTimeout = (event: Electron.Event, peerId: string) => {
    if (this.connecting.has(peerId)) {
      const peer = this.connecting.get(peerId)!
      peer.close()
    }
  }

  private createPeer(userId: string): RTCPeerConn {
    const peer = new SimplePeer({
      initiator: !this.host,
      config: {
        iceServers
      }
    })

    const netId = new NetUniqueId(userId)
    const conn = new RTCPeerConn(netId, peer)

    this.connecting.set(userId, conn)

    conn.once('connect', () => {
      conn.removeAllListeners()
      this.connecting.delete(userId)
      this.emit('connection', conn)
    })

    conn.once('close', () => {
      this.connecting.delete(userId)
    })

    return conn
  }
}
