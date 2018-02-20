import React from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'
const { ipcRenderer } = chrome

import { Lobby } from 'renderer/components/Lobby'
import { IReactReduxProps } from 'types/redux'
import { IUsersState } from 'renderer/lobby/reducers/users'
import { server_addChat } from 'renderer/lobby/actions/chat'
import { getSessionName } from 'renderer/lobby/reducers/session'
import { VideoPlayer } from 'renderer/components/lobby/VideoPlayer'
import { IMediaItem, PlaybackState } from 'renderer/lobby/reducers/mediaPlayer'
import { isUrl } from 'utils/url'
import {
  server_requestMedia,
  server_requestPlayPause,
  server_requestNextMedia,
  server_requestSeek
} from 'renderer/lobby/actions/mediaPlayer'
import { IMessage } from 'renderer/lobby/reducers/chat'
import { Messages } from 'renderer/components/chat/Messages'
import { Chat } from 'renderer/components/chat'

import styles from './GameLobby.css'
import { UserItem } from 'renderer/components/lobby/UserItem'
import { MediaItem } from 'renderer/components/media/MediaItem'
import { Link } from 'react-router-dom'
import {
  getCurrentMedia,
  getMediaQueue,
  getPlaybackState
} from 'renderer/lobby/reducers/mediaPlayer.helpers'
import { ListOverlay } from 'renderer/components/lobby/ListOverlay'
import { TitleBar } from 'renderer/components/TitleBar'
import { PlaybackControls } from 'renderer/components/media/PlaybackControls'
import { setVolume } from 'renderer/actions/settings'
import { ActivityMonitor } from 'renderer/components/lobby/ActivityMonitor'
import { MediaType } from 'renderer/media/types'
import { WebBrowser } from 'renderer/components/browser/WebBrowser'
import { Icon } from 'renderer/components/Icon'
import { registerMediaShortcuts, unregisterMediaShortcuts } from 'renderer/lobby/actions/shortcuts'
import { isUpdateAvailable } from 'renderer/reducers/ui'
import { IAppState } from 'renderer/reducers'
import { HighlightButton } from 'renderer/components/common/button'
import { Modal } from 'renderer/components/lobby/Modal'
import { Invite } from 'renderer/components/lobby/Invite'
import { MediaInfo } from 'renderer/components/lobby/modals/MediaInfo'

interface IProps {
  host: boolean
}

interface IState {
  inactive: boolean
  modal?: LobbyModal
}

interface IConnectedProps {
  currentMedia?: IMediaItem
  mediaQueue: IMediaItem[]
  messages: IMessage[]
  playback: PlaybackState
  users: IUsersState
  sessionName?: string
  updateAvailable: boolean
}

type PrivateProps = IProps & IConnectedProps & DispatchProp<IAppState>

const enum LobbyModal {
  Browser = 'browser',
  Invite = 'invite',
  MediaInfo = 'media-info'
}

const NO_MEDIA: IMediaItem = {
  type: MediaType.Item,
  title: 'No media playing',
  url: '',
  requestUrl: ''
}

class _GameLobby extends React.Component<PrivateProps, IState> {
  private player: VideoPlayer | null

  private get isInactive() {
    return this.state.inactive && this.props.playback === PlaybackState.Playing
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

  render(): JSX.Element {
    const { currentMedia: media } = this.props
    const userIds = Object.keys(this.props.users)
    return (
      <div
        className={cx(styles.container, {
          lobbyInactive: this.isInactive,
          modalVisible: !!this.state.modal
        })}
      >
        <ActivityMonitor onChange={active => this.setState({ inactive: !active })} />

        <VideoPlayer
          theRef={el => {
            this.player = el
          }}
          className={styles.video}
        />

        <TitleBar className={styles.titlebar} title={media && media.title} />

        <section className={styles.controls}>
          {this.renderPlaybackControls()}
          <ListOverlay
            className={styles.users}
            title="Users"
            tagline={`${userIds.length} online`}
            action={
              <HighlightButton icon="mail" onClick={() => this.openModal(LobbyModal.Invite)}>
                Invite
              </HighlightButton>
            }
          >
            {userIds.map((userId: string) => {
              const user = this.props.users[userId]!
              return <UserItem key={userId} user={user} />
            })}
          </ListOverlay>
          <ListOverlay
            className={styles.queue}
            title="Next up"
            tagline={`${this.props.mediaQueue.length} items`}
            action={
              <HighlightButton icon="plus" onClick={this.openBrowser}>
                Add
              </HighlightButton>
            }
          >
            {media && media.hasMore && <MediaItem key="current" media={media} />}
            {this.props.mediaQueue.map((media, idx) => {
              return <MediaItem key={idx} media={media} />
            })}
          </ListOverlay>

          <Chat
            className={styles.chat}
            messages={this.props.messages}
            sendMessage={this.sendChat}
            disabled={!!this.state.modal}
          />
        </section>

        {this.isInactive && <div className={styles.inactiveOverlay} />}
        {this.state.modal && this.renderModal()}
      </div>
    )
  }

  private renderModal() {
    switch (this.state.modal!) {
      case LobbyModal.Browser:
        return <WebBrowser className={styles.modal} onClose={this.closeModal} />
      case LobbyModal.Invite:
        return (
          <Modal className={styles.modal} onClose={this.closeModal}>
            <Invite />
          </Modal>
        )
      case LobbyModal.MediaInfo:
        return (
          <Modal className={styles.modal} onClose={this.closeModal}>
            <MediaInfo media={this.props.currentMedia} onClose={this.closeModal} />
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
      this.props.dispatch!(server_requestMedia(text))
    } else {
      this.props.dispatch!(server_addChat(text))
    }
  }

  private openBrowser = () => {
    this.setState({ modal: LobbyModal.Browser })
  }

  private showInfo = () => {
    this.setState({ modal: LobbyModal.MediaInfo })
  }

  private openModal = (modal: LobbyModal) => {
    this.setState({ modal })
  }

  private closeModal = () => {
    this.setState({ modal: undefined })
  }
}

export const GameLobby = connect((state: IAppState): IConnectedProps => {
  return {
    currentMedia: getCurrentMedia(state),
    mediaQueue: getMediaQueue(state),
    messages: state.chat.messages,
    playback: getPlaybackState(state),
    users: state.users,
    sessionName: getSessionName(state),
    updateAvailable: isUpdateAvailable(state)
  }
})(_GameLobby) as React.ComponentClass<IProps>
