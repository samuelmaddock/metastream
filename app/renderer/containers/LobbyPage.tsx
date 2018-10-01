import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { IReactReduxProps } from 'types/redux'

import { IAppState, AppReplicatedState } from 'renderer/reducers'

import { GameLobby } from 'renderer/components/GameLobby'
import { PlatformService } from 'renderer/platform'
import { NetServer } from 'renderer/network'
import { NetActions } from 'renderer/network/actions'
import { ReplicatedState } from 'renderer/network/types'
import { push } from 'react-router-redux'
import { sleep } from 'utils/async'
import {
  NETWORK_TIMEOUT,
  NetworkDisconnectReason,
  NetworkDisconnectMessages,
  NetworkDisconnectLabels
} from 'constants/network'
import { Connect } from '../components/lobby/Connect'
import { Disconnect } from '../components/lobby/Disconnect'
import { getDisconnectReason, ConnectionStatus } from '../lobby/reducers/session'
import { setDisconnectReason } from '../lobby/actions/session'
import { t } from 'locale'
import { SessionMode } from '../reducers/settings'
import { resetLobby, initLobby } from '../lobby/actions/common'

interface IRouteParams {
  lobbyId: string
}

interface IProps extends RouteComponentProps<IRouteParams> {}

interface IConnectedProps {
  disconnectReason?: NetworkDisconnectReason
  clientAuthorized?: boolean
  sessionMode?: SessionMode
  connectionStatus?: ConnectionStatus
}

interface IState {
  disconnectReason?: NetworkDisconnectReason
}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {
    disconnectReason: getDisconnectReason(state),
    clientAuthorized: state.session.authorized,
    sessionMode: state.settings.sessionMode,
    connectionStatus: state.session.connectionStatus
  }
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

export class _LobbyPage extends Component<PrivateProps, IState> {
  state: IState = {}

  private mounted: boolean = false
  private connected: boolean = false
  private server?: NetServer
  private host: boolean

  private get supportsNetworking() {
    return this.props.sessionMode !== SessionMode.Private
  }

  private get lobbyId(): string | undefined {
    const { match } = this.props
    const lobbyId = match.params.lobbyId
    return lobbyId === 'create' ? undefined : lobbyId
  }

  constructor(props: PrivateProps) {
    super(props)

    const lobbyId = props.match.params.lobbyId
    this.host = lobbyId === 'create'
  }

  private async setupLobby(): Promise<void> {
    let successPromise

    if (this.lobbyId) {
      successPromise = PlatformService.joinLobby(this.lobbyId)
    } else {
      successPromise = PlatformService.createLobby({
        p2p: true,
        websocket: true
      })
    }

    // TODO: will this reject the promise that loses?
    const result = await Promise.race([successPromise, sleep(NETWORK_TIMEOUT)])
    const success = typeof result === 'boolean' ? result : false
    if (!this.mounted) return

    if (success) {
      this.onJoinLobby(PlatformService.getServer()!)
    } else {
      this.onConnectionFailed()
    }
  }

  private closeLobby() {
    this.connected = false

    if (this.server) {
      this.server.removeListener('close', this.disconnect)
      this.server = undefined
    }

    PlatformService.leaveLobby(this.lobbyId || '')
    this.props.dispatch(NetActions.disconnect({ host: this.host }))
  }

  private onJoinLobby(server: NetServer): void {
    this.server = server
    this.server.once('close', this.disconnect)

    if (this.host || this.server.connected) {
      // Server is ready
      this.onConnection()
    } else {
      this.onConnectionFailed()
    }
  }

  private onConnection(): void {
    this.props.dispatch(
      NetActions.connect({
        server: this.server!,
        host: this.host,
        replicated: AppReplicatedState as ReplicatedState<any>
      })
    )

    this.connected = true
    this.forceUpdate()
  }

  private onConnectionFailed(): void {
    this.disconnect(NetworkDisconnectReason.Timeout)
  }

  private disconnect = (
    reason: NetworkDisconnectReason = NetworkDisconnectReason.HostDisconnect,
    immediate?: boolean
  ) => {
    this.connected = false

    if (immediate || this.host) {
      this.props.dispatch(push('/'))
      return
    }

    reason = this.props.disconnectReason || reason
    this.setState({ disconnectReason: reason })

    {
      const reasonKey: any = NetworkDisconnectMessages[reason]
      let msg = t(reasonKey) || reasonKey
      console.debug(`Disconnected [${reason}]: ${msg}`)
    }

    ga('event', { ec: 'session', ea: 'disconnect', el: NetworkDisconnectLabels[reason] })

    // Clear disconnect reason in Redux
    if (this.props.disconnectReason) {
      this.props.dispatch!(setDisconnectReason())
    }
  }

  private disconnectImmediate = (
    reason: NetworkDisconnectReason = NetworkDisconnectReason.HostDisconnect
  ) => {
    this.disconnect(reason, true)
  }

  componentWillMount(): void {
    this.props.dispatch(initLobby({ host: this.host }))

    if (!this.host || this.supportsNetworking) {
      this.setupLobby()
    }
  }

  componentDidMount() {
    this.mounted = true
    window.addEventListener('beforeunload', this.beforeUnload, false)
  }

  componentWillUnmount(): void {
    window.removeEventListener('beforeunload', this.beforeUnload, false)
    this.closeLobby()
    this.mounted = false
    this.props.dispatch(resetLobby({ host: this.host }))
  }

  componentDidUpdate(prevProps: PrivateProps) {
    if (this.props.sessionMode !== prevProps.sessionMode) {
      this.onSessionModeChange()
    }
  }

  private onSessionModeChange() {
    if (this.supportsNetworking && !this.connected) {
      this.setupLobby()
    } else if (!this.supportsNetworking && this.connected) {
      this.closeLobby()
    }
  }

  private beforeUnload = () => {
    this.disconnectImmediate()
  }

  render(): JSX.Element {
    if (this.state.disconnectReason) {
      return <Disconnect reason={this.state.disconnectReason} />
    }

    if (!this.host && !(this.connected && this.props.clientAuthorized)) {
      const status =
        this.props.connectionStatus === ConnectionStatus.Pending ? t('waitingForHost') : undefined
      return <Connect onCancel={this.disconnectImmediate} status={status} />
    }

    return <GameLobby host={this.host} />
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps, IAppState>(mapStateToProps)(
  _LobbyPage as any
)
