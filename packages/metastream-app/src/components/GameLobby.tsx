import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { ipcRenderer } from 'electron'

import { server_addChat } from 'lobby/actions/chat'
import { VideoPlayer } from 'components/lobby/VideoPlayer'
import { IMediaItem, PlaybackState } from 'lobby/reducers/mediaPlayer'
import { isUrl } from 'utils/url'
import { sendMediaRequest } from 'lobby/actions/mediaPlayer'
import { IMessage } from 'lobby/reducers/chat'
import { Chat } from 'components/chat'

import styles from './GameLobby.css'
import { getCurrentMedia, getPlaybackState } from 'lobby/reducers/mediaPlayer.helpers'
import { TitleBar } from 'components/TitleBar'
import { PlaybackControls } from 'components/media/PlaybackControls'
import { ActivityMonitor } from 'components/lobby/ActivityMonitor'
import { WebBrowser } from 'components/browser/WebBrowser'
import { registerMediaShortcuts, unregisterMediaShortcuts } from 'lobby/actions/shortcuts'
import { IAppState } from 'reducers'
import { Modal } from 'components/lobby/Modal'
import * as Modals from 'components/lobby/modals'
import { UserList } from './lobby/UserList'
import { MediaList } from './lobby/MediaList'
import { LobbyModal } from '../reducers/ui'
import { setLobbyModal } from '../actions/ui'
import { isDeveloper } from '../reducers/settings'
import { getNumUsers } from '../lobby/reducers/users.helpers'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps {
  host: boolean
}

interface IState {
  inactive: boolean
  modal?: LobbyModal
  modalProps?: React.Props<any> & { [key: string]: any }
}

interface IConnectedProps {
  currentMedia?: IMediaItem
  messages: IMessage[]
  playback: PlaybackState
  modal?: LobbyModal
  developer: boolean
  isMultiplayer: boolean
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class _GameLobby extends React.Component<PrivateProps, IState> {
  private player: VideoPlayer | null = null

  private get isPlaying() {
    return this.props.playback === PlaybackState.Playing
  }

  private get isInteracting() {
    return this.player && this.player.state.interacting
  }

  private get isInactive() {
    return (
      this.state.inactive &&
      this.isPlaying &&
      !(this.player && this.player.state.interacting) &&
      !this.state.modal
    )
  }

  state: IState = { inactive: false }

  componentDidMount() {
    ipcRenderer.on('command', this.onWindowCommand)
    this.props.dispatch!(registerMediaShortcuts())
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('command', this.onWindowCommand)
    this.props.dispatch!(unregisterMediaShortcuts())
  }

  componentWillUpdate(nextProps: PrivateProps) {
    if (nextProps.modal && this.props.modal !== nextProps.modal) {
      this.setState({ modal: nextProps.modal })
    }
  }

  render(): JSX.Element {
    const { currentMedia: media } = this.props
    return (
      <div
        className={cx(styles.container, {
          lobbyInactive: this.isInactive,
          modalVisible: !!this.state.modal
        })}
      >
        <ActivityMonitor
          onChange={active => {
            this.setState({ inactive: !active })

            const { player } = this
            if (this.isPlaying && player && player.state.interacting) {
              player.exitInteractMode()
            }
          }}
        />

        <VideoPlayer
          theRef={el => (this.player = el)}
          className={styles.video}
          onInteractChange={() => this.forceUpdate()}
        />

        {this.isInteracting ? null : this.renderControls()}
        {this.isInteracting ? null : (
          <TitleBar className={styles.titlebar} title={media && media.title} />
        )}

        {this.state.modal && this.renderModal()}

        {this.isInactive && <div className={styles.inactiveOverlay} />}
      </div>
    )
  }

  private renderControls() {
    return (
      <section className={styles.controls}>
        {this.renderPlaybackControls()}

        <UserList
          className={styles.users}
          onInvite={() => this.openModal(LobbyModal.Invite)}
          openSessionSettings={() => this.openModal(LobbyModal.SessionSettings)}
        />
        <MediaList
          className={styles.queue}
          onAddMedia={this.openBrowser}
          onShowInfo={this.showInfo}
        />

        <Chat
          className={styles.chat}
          messages={this.props.messages}
          sendMessage={this.sendChat}
          disabled={!!this.state.modal}
          showHint={this.props.isMultiplayer}
        />
      </section>
    )
  }

  private renderModal() {
    switch (this.state.modal!) {
      case LobbyModal.Browser:
        return (
          <WebBrowser
            className={styles.modal}
            onClose={this.closeModal}
            {...this.state.modalProps}
            devTools={this.props.developer}
          />
        )
      case LobbyModal.Invite:
        return (
          <Modal className={styles.modal} onClose={this.closeModal}>
            <Modals.Invite />
          </Modal>
        )
      case LobbyModal.MediaInfo:
        const media =
          (this.state.modalProps && this.state.modalProps.media) || this.props.currentMedia
        return (
          <Modal className={styles.modal} onClose={this.closeModal}>
            <Modals.MediaInfo media={media} onClose={this.closeModal} />
          </Modal>
        )
      case LobbyModal.SessionSettings:
        return (
          <Modal className={styles.modal} onClose={this.closeModal}>
            <Modals.SessionSettings />
          </Modal>
        )
    }
  }

  private renderPlaybackControls(): JSX.Element {
    return (
      <PlaybackControls
        className={styles.playbackControls}
        reload={() => {
          if (this.player) {
            this.player.reload()
          }
        }}
        debug={() => {
          if (this.player) {
            this.player.debug()
          }
        }}
        openBrowser={this.openBrowser}
        showInfo={this.showInfo}
      />
    )
  }

  private onWindowCommand = (sender: Electron.WebContents, cmd: string) => {
    switch (cmd) {
      case 'window:new-tab':
        this.openBrowser()
        break
    }
  }

  private sendChat = (text: string): void => {
    if (isUrl(text)) {
      this.props.dispatch!(sendMediaRequest(text, 'chat'))
    } else {
      this.props.dispatch!(server_addChat(text))
    }
  }

  private openBrowser = (url?: string) => {
    this.setState({ modal: LobbyModal.Browser, modalProps: { initialUrl: url } })
  }

  private showInfo = (media?: IMediaItem) => {
    this.setState({ modal: LobbyModal.MediaInfo, modalProps: { media } })
  }

  private openModal = (modal: LobbyModal) => {
    this.setState({ modal })
  }

  private closeModal = () => {
    this.setState({ modal: undefined })

    if (this.props.modal) {
      this.props.dispatch!(setLobbyModal())
    }
  }
}

export const GameLobby = connect(
  (state: IAppState): IConnectedProps => {
    return {
      currentMedia: getCurrentMedia(state),
      messages: state.chat.messages,
      playback: getPlaybackState(state),
      modal: state.ui.lobbyModal,
      developer: isDeveloper(state),
      isMultiplayer: getNumUsers(state) > 1
    }
  }
)(_GameLobby) as React.ComponentClass<IProps>
