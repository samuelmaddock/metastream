import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

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
import { getNumUsers } from '../lobby/reducers/users.helpers'
import { IReactReduxProps } from 'types/redux-thunk'
import { ChatLocation } from './chat/Location'
import { setSetting } from '../actions/settings'

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
  isChatDocked: boolean
  isMultiplayer: boolean
}

interface DispatchProps {
  registerMediaShortcuts(): void
  unregisterMediaShortcuts(): void
  sendMediaRequest(text: string): void
  addChat(text: string): void
  closeLobbyModal(): void
  toggleChatLayout(): void
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps & DispatchProps

class _GameLobby extends React.Component<PrivateProps, IState> {
  private player: VideoPlayer | null = null
  private chat: Chat | null = null

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
    this.props.registerMediaShortcuts()
  }

  componentWillUnmount() {
    this.props.unregisterMediaShortcuts()
  }

  componentWillUpdate(nextProps: PrivateProps) {
    if (nextProps.modal && this.props.modal !== nextProps.modal) {
      this.setState({ modal: nextProps.modal })
    }
  }

  render(): JSX.Element {
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

        {this.renderControls()}

        {this.props.isChatDocked && (
          <Chat
            theRef={el => (this.chat = el)}
            className={styles.chatDocked}
            messages={this.props.messages}
            sendMessage={this.sendChat}
            disabled={!!this.state.modal}
            onToggleLayout={this.props.toggleChatLayout}
          />
        )}

        {this.isInactive && <div className={styles.inactiveOverlay} />}
      </div>
    )
  }

  private renderControls() {
    const { currentMedia: media } = this.props

    const controls = this.isInteracting ? null : (
      <>
        {this.renderPlaybackControls()}

        <UserList className={styles.users} onInvite={() => this.openModal(LobbyModal.Invite)} />
        <MediaList
          className={styles.queue}
          onAddMedia={this.openBrowser}
          onShowInfo={this.showInfo}
        />

        {!this.props.isChatDocked && (
          <Chat
            theRef={el => (this.chat = el)}
            className={styles.chatFloat}
            messages={this.props.messages}
            sendMessage={this.sendChat}
            disabled={!!this.state.modal}
            onToggleLayout={this.props.toggleChatLayout}
            showHint
            fade
          />
        )}

        {this.state.modal && this.renderModal()}
      </>
    )

    // Hide back button when modal is open to avoid confusing the back button
    // as the way to close the modal
    const showBackButton = !this.state.modal

    return (
      <section
        className={cx(styles.controls, {
          [styles.controlsDocked]: this.props.isChatDocked
        })}
      >
        <VideoPlayer
          theRef={el => (this.player = el)}
          className={styles.video}
          onInteractChange={() => this.forceUpdate()}
        />

        {controls}

        {this.isInteracting ? null : (
          <TitleBar
            className={styles.titlebar}
            title={media && media.title}
            showBackButton={showBackButton}
            onBack={goBack => {
              if (this.props.host && this.props.isMultiplayer) {
                this.openModal(LobbyModal.EndSession, { onConfirm: goBack })
              } else {
                goBack()
              }
            }}
          />
        )}
      </section>
    )
  }

  private renderModal() {
    let modalChildren
    let fillHeight

    const modalProps = { isHost: this.props.host }

    switch (this.state.modal!) {
      case LobbyModal.Browser: {
        return (
          <WebBrowser
            className={styles.modal}
            onClose={this.closeModal}
            {...this.state.modalProps}
          />
        )
      }
      case LobbyModal.Invite: {
        modalChildren = <Modals.Invite {...modalProps} />
        break
      }
      case LobbyModal.MediaInfo: {
        const media =
          (this.state.modalProps && this.state.modalProps.media) || this.props.currentMedia
        modalChildren = <Modals.MediaInfo media={media} onClose={this.closeModal} />
        break
      }
      case LobbyModal.EndSession: {
        modalChildren = <Modals.EndSession onCancel={this.closeModal} {...this.state.modalProps} />
        break
      }
      case LobbyModal.Settings: {
        modalChildren = <Modals.Settings {...modalProps} />
        fillHeight = true
        break
      }
      default:
        console.warn(`Unknown lobby modal '${this.state.modal}'`)
    }

    if (modalChildren) {
      return (
        <Modal className={styles.modal} onClose={this.closeModal} fill={fillHeight}>
          {modalChildren}
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
        showInteract={() => {
          if (this.player) {
            this.player.enterInteractMode()
          }
        }}
        toggleChat={() => {
          if (this.chat) {
            this.chat.toggle()
          }
        }}
        openSettings={() => {
          this.openModal(LobbyModal.Settings)
        }}
      />
    )
  }

  private sendChat = (text: string): void => {
    if (isUrl(text)) {
      this.props.sendMediaRequest(text)
    } else {
      this.props.addChat(text)
    }
  }

  private openBrowser = (url?: string) => {
    this.setState({ modal: LobbyModal.Browser, modalProps: { initialUrl: url } })
  }

  private showInfo = (media?: IMediaItem) => {
    this.setState({ modal: LobbyModal.MediaInfo, modalProps: { media } })
  }

  private openModal = (modal: LobbyModal, modalProps?: any) => {
    this.setState({ modal, modalProps })
  }

  private closeModal = () => {
    this.setState({ modal: undefined })

    if (this.props.modal) {
      this.props.closeLobbyModal()
    }
  }
}

export const GameLobby = (connect(
  (state: IAppState): IConnectedProps => {
    return {
      currentMedia: getCurrentMedia(state),
      messages: state.chat.messages,
      playback: getPlaybackState(state),
      modal: state.ui.lobbyModal,
      isChatDocked: state.settings.chatLocation === ChatLocation.DockRight,
      isMultiplayer: getNumUsers(state) > 1
    }
  },
  (dispatch: Function): DispatchProps => ({
    registerMediaShortcuts: () => dispatch(registerMediaShortcuts()),
    unregisterMediaShortcuts: () => dispatch(unregisterMediaShortcuts()),
    sendMediaRequest: (text: string) => dispatch(sendMediaRequest(text, 'chat')),
    addChat: (text: string) => dispatch(server_addChat(text)),
    closeLobbyModal: () => dispatch(setLobbyModal()),
    toggleChatLayout() {
      dispatch(
        setSetting('chatLocation', location =>
          location === ChatLocation.DockRight ? ChatLocation.FloatLeft : ChatLocation.DockRight
        )
      )
    }
  })
)(_GameLobby) as any) as React.ComponentClass<IProps>
