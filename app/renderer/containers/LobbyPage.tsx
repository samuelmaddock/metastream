import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { createStore, Store } from 'redux'
import { IReactReduxProps } from 'types/redux'

import { IAppState, AppReplicatedState } from 'renderer/reducers'

import { NetworkState } from 'types/network'
import { Lobby } from 'renderer/components/Lobby'
import { GameLobby } from 'renderer/components/GameLobby'
import { PlatformService } from 'renderer/platform'
import { NetServer } from 'renderer/network'
import { RTCServer } from 'renderer/network/rtc'
import { NetActions } from 'renderer/network/actions'
import { ReplicatedState } from 'renderer/network/types'
import { push } from 'react-router-redux'

interface IRouteParams {
  lobbyId: string
}

interface IProps extends RouteComponentProps<IRouteParams> {}

interface IConnectedProps {}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {}
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

export class _LobbyPage extends Component<PrivateProps> {
  private server?: NetServer
  private host: boolean

  constructor(props: PrivateProps) {
    super(props)

    const lobbyId = props.match.params.lobbyId
    this.host = lobbyId === 'create'
  }

  private async setupLobby(): Promise<void> {
    let success

    if (this.lobbyId) {
      success = await PlatformService.joinLobby(this.lobbyId)
    } else {
      success = await PlatformService.createLobby({
        maxMembers: 4
      })
    }

    if (success) {
      this.onJoinLobby()
    } else {
      setTimeout(() => {
        console.log('Failed to join lobby')
        this.props.dispatch(push('/'))
      }, 500)
    }
  }

  private onJoinLobby(): void {
    const peerCoord = PlatformService.createPeerCoordinator()
    const rtcServer = new RTCServer({
      isHost: this.host,
      peerCoord
    })

    this.server = rtcServer

    this.props.dispatch(
      NetActions.connect({
        server: rtcServer,
        host: this.host,
        replicated: AppReplicatedState as ReplicatedState<any>
      })
    )

    this.forceUpdate()
  }

  componentWillMount(): void {
    this.setupLobby()
  }

  componentWillUnmount(): void {
    if (this.server) {
      PlatformService.leaveLobby(this.lobbyId || '')
      this.server.close()
      this.props.dispatch(NetActions.disconnect())
    }
  }

  private get lobbyId(): string | undefined {
    const { match } = this.props
    const lobbyId = match.params.lobbyId
    return lobbyId === 'create' ? undefined : lobbyId
  }

  render(): JSX.Element {
    if (!this.server) {
      return <div>Connecting...</div>
    }

    return <GameLobby host={this.host} />
  }
}

export const LobbyPage = connect<IConnectedProps, {}, IProps>(mapStateToProps)(_LobbyPage)
