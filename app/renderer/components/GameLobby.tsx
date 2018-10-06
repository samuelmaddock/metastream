import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
const { ipcRenderer } = chrome

import { server_addChat } from 'renderer/lobby/actions/chat'
import { VideoPlayer } from 'renderer/components/lobby/VideoPlayer'
import { IMediaItem, PlaybackState } from 'renderer/lobby/reducers/mediaPlayer'
import { isUrl } from 'utils/url'
import { sendMediaRequest } from 'renderer/lobby/actions/mediaPlayer'
import { IMessage } from 'renderer/lobby/reducers/chat'
import { Chat } from 'renderer/components/chat'

import styles from './GameLobby.css'
import { getCurrentMedia, getPlaybackState } from 'renderer/lobby/reducers/mediaPlayer.helpers'
import { TitleBar } from 'renderer/components/TitleBar'
import { PlaybackControls } from 'renderer/components/media/PlaybackControls'
import { ActivityMonitor } from 'renderer/components/lobby/ActivityMonitor'
import { WebBrowser } from 'renderer/components/browser/WebBrowser'
import { registerMediaShortcuts, unregisterMediaShortcuts } from 'renderer/lobby/actions/shortcuts'
import { IAppState } from 'renderer/reducers'
import { Modal } from 'renderer/components/lobby/Modal'
import * as Modals from 'renderer/components/lobby/modals'
import { addExtensionListeners, removeExtensionListeners } from '../actions/extensions'
import { PopupWindow } from './browser/PopupWindow'
import { IPopupState } from '../reducers/extensions'
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
  popup?: IPopupState
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
    ipcRenderer.send('extensions-status')
    this.props.dispatch!(registerMediaShortcuts())
    this.props.dispatch!(addExtensionListeners())
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('command', this.onWindowCommand)
    this.props.dispatch!(unregisterMediaShortcuts())
    this.props.dispatch!(removeExtensionListeners())
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

        {this.props.popup ? <PopupWindow {...this.props.popup} /> : null}
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
      popup: state.extensions.popup,
      modal: state.ui.lobbyModal,
      developer: isDeveloper(state),
      isMultiplayer: getNumUsers(state) > 1
    }
  }
)(_GameLobby) as React.ComponentClass<IProps>
