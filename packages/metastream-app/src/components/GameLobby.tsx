import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import { VideoPlayer } from 'components/lobby/VideoPlayer'
import { IMediaItem, PlaybackState, PendingMedia } from 'lobby/reducers/mediaPlayer'
import { Chat, ChatComponent } from 'components/chat'

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
import { setPendingMedia } from 'lobby/actions/mediaPlayer'
import { sendMediaRequest, ClientMediaRequestOptions } from 'lobby/actions/media-request'

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
  playback: PlaybackState
  modal?: LobbyModal
  isChatDocked: boolean
  isMultiplayer: boolean
  pendingMedia?: PendingMedia
  isExtensionInstalled?: boolean
}

interface DispatchProps {
  registerMediaShortcuts(): void
  unregisterMediaShortcuts(): void
  closeLobbyModal(): void
  clearPendingMedia(): void
  sendMediaRequest(opts: ClientMediaRequestOptions): void
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps & DispatchProps

class _GameLobby extends React.Component<PrivateProps, IState> {
  private player: VideoPlayer | null = null
  private chat: ChatComponent | null = null

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
    this.checkPendingMedia()
  }

  componentWillUnmount() {
    this.props.unregisterMediaShortcuts()
  }

  componentDidUpdate(prevProps: PrivateProps) {
    if (this.props.modal && this.props.modal !== prevProps.modal) {
      this.setState({ modal: this.props.modal })
    }
    this.checkPendingMedia()
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
            disabled={!!this.state.modal}
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
        <MediaList className={styles.queue} onShowInfo={this.showInfo} />

        {!this.props.isChatDocked && (
          <Chat
            theRef={el => (this.chat = el)}
            className={styles.chatFloat}
            disabled={!!this.state.modal}
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

  private checkPendingMedia() {
    const { pendingMedia, isExtensionInstalled } = this.props
    if (pendingMedia && isExtensionInstalled) {
      this.props.clearPendingMedia()
      this.props.sendMediaRequest({
        ...pendingMedia,
        source: pendingMedia.source || 'pending',
        immediate: this.props.host
      })
    }
  }
}

export const GameLobby = (connect(
  (state: IAppState): IConnectedProps => {
    return {
      currentMedia: getCurrentMedia(state),
      playback: getPlaybackState(state),
      modal: state.ui.lobbyModal,
      isChatDocked: state.settings.chatLocation === ChatLocation.DockRight,
      isMultiplayer: getNumUsers(state) > 1,
      pendingMedia: state.mediaPlayer.pendingMedia,
      isExtensionInstalled: state.ui.isExtensionInstalled
    }
  },
  (dispatch: Function): DispatchProps => ({
    registerMediaShortcuts: () => dispatch(registerMediaShortcuts()),
    unregisterMediaShortcuts: () => dispatch(unregisterMediaShortcuts()),
    closeLobbyModal: () => dispatch(setLobbyModal()),
    clearPendingMedia: () => dispatch(setPendingMedia()),
    sendMediaRequest: (opts: ClientMediaRequestOptions) => {
      dispatch(sendMediaRequest(opts))
    }
  })
)(_GameLobby) as any) as React.ComponentClass<IProps>
