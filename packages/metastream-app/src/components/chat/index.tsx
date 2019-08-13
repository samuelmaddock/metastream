import React, { PureComponent } from 'react'
import cx from 'classnames'

import { IMessage } from 'lobby/reducers/chat'

import { Messages } from './Messages'
import { ChatForm } from './ChatForm'

import styles from './Chat.css'
import { IconButton } from '../common/button'
import { t } from 'locale'
import { connect } from 'react-redux'
import { IAppState } from 'reducers/index'
import { sendChat, server_notifyTyping } from 'lobby/actions/chat'
import { setSetting } from 'actions/settings'
import { ChatLocation } from './Location'
import { UserTyping } from './UserTyping'
import { throttle } from 'lodash-es'
import { TYPING_DURATION } from '../../lobby/reducers/chat.helpers'
import { Cancelable } from 'lodash'

const CSS_PROP_CHAT_FADE_DELAY = '--chat-fade-delay'

interface Props {
  theRef?: (c: ChatComponent | null) => void
  className?: string
  disabled?: boolean
  showHint?: boolean

  /** Whether to fade chat while inactive. */
  fade?: boolean

  messageFadeDelay?: number
}

interface ConnectedProps {
  messages: IMessage[]
}

interface DispatchProps {
  sendMessage(text: string): void
  toggleChatLayout(): void
  notifyTyping: () => void & Cancelable
}

interface State {
  focused?: boolean
  filteredMessages: IMessage[]
}

type PrivateProps = Props & ConnectedProps & DispatchProps

export class ChatComponent extends PureComponent<PrivateProps, State> {
  private form: ChatForm | null = null
  private containerElement: HTMLElement | null = null
  private messagesRef: Messages | null = null

  static defaultProps = {
    messageFadeDelay: 10000
  }

  state: State = {
    filteredMessages: []
  }

  componentDidMount(): void {
    this.filterMessages(this.props.messages)
    this.setupListeners(!this.props.disabled)
    this.scrollToBottom()

    if (this.containerElement) {
      this.containerElement.style.setProperty(
        CSS_PROP_CHAT_FADE_DELAY,
        `${this.props.messageFadeDelay}ms`
      )
    }

    if (this.props.theRef) {
      this.props.theRef(this)
    }
  }

  componentWillUnmount(): void {
    if (this.props.theRef) {
      this.props.theRef(null)
    }

    this.setupListeners(false)
  }

  componentWillReceiveProps(nextProps: PrivateProps) {
    if (this.props.messages !== nextProps.messages) {
      this.filterMessages(nextProps.messages)
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.disabled !== prevProps.disabled) {
      this.setupListeners(!this.props.disabled)

      if (this.state.focused && this.props.disabled) {
        this.onBlur()
      }
    }
  }

  private filterMessages(messages: IMessage[]) {
    // Minimize number of chat messages to render while chat isn't focused.
    const numMessages = messages.length
    const minMessages = 10
    const cutoff = numMessages - minMessages - 1
    const chatFadeDelay = this.props.messageFadeDelay!

    const filteredMessages =
      this.state.focused || !this.props.fade
        ? messages
        : messages.filter((msg, idx) => {
            if (idx > cutoff) return true
            const dt = Date.now() - msg.timestamp
            return dt <= chatFadeDelay
          })

    this.setState({ filteredMessages })
  }

  private setupListeners(enabled: boolean) {
    if (enabled) {
      document.addEventListener('keypress', this.onKeyPress, true)
      document.addEventListener('keydown', this.onKeyDown, true)
    } else {
      document.removeEventListener('keypress', this.onKeyPress, true)
      document.removeEventListener('keydown', this.onKeyDown, true)
    }
  }

  render(): JSX.Element | null {
    const fade = !!this.props.fade

    return (
      <div
        ref={e => (this.containerElement = e)}
        className={cx(this.props.className, styles.container, {
          [styles.focused]: this.state.focused,
          [styles.fade]: fade
        })}
      >
        <div className={styles.wrapper}>
          <div className={fade ? styles.fadeBackground : styles.staticBackground} />
          <div className={styles.foreground}>
            <Messages
              ref={e => {
                this.messagesRef = e
              }}
              messages={this.state.filteredMessages}
            />
            <ChatForm
              ref={e => {
                this.form = e
              }}
              send={this.onSend}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              onTyping={this.props.notifyTyping}
              showHint={!!this.props.showHint}
              blurOnSubmit={!!this.props.fade}
            >
              <UserTyping />
            </ChatForm>
            <IconButton
              icon={this.props.fade ? 'dock-right' : 'undock-float'}
              className={styles.btnLayout}
              onClick={this.props.toggleChatLayout}
              title={t(this.props.fade ? 'chatDockToRight' : 'chatUndock')}
            />
          </div>
        </div>
      </div>
    )
  }

  private scrollToBottom() {
    if (this.messagesRef) {
      this.messagesRef.scrollToBottom()
    }
  }

  private onFocus = (): void => {
    this.setState({ focused: true }, () => {
      this.filterMessages(this.props.messages)
    })
  }

  private onBlur = (): void => {
    this.setState({ focused: false }, () => {
      this.filterMessages(this.props.messages)
      this.scrollToBottom()
    })
  }

  private onSend = (message: string) => {
    this.props.sendMessage(message)
    this.scrollToBottom()

    // allow immediately sending typing notification after sending
    const notify = (this.props.notifyTyping as any) as Cancelable
    notify.cancel()
  }

  private onKeyPress = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'Enter':
        if (!this.state.focused && this.form) {
          event.preventDefault()
          this.form.focus()
        }
        break
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.state.focused) {
      // Prevent activity monitor from revealing UI
      event.stopImmediatePropagation()
    }

    switch (event.key) {
      case 'Enter':
        if (!this.state.focused) {
          // Prevent activity monitor from revealing UI
          event.stopImmediatePropagation()
        }
        break
      case 'Escape':
        if (this.state.focused && this.form) {
          event.preventDefault()
          this.form.dismiss()
        }
        break
    }
  }

  toggle() {
    if (!this.form) return

    if (this.state.focused) {
      this.form.dismiss()
    } else {
      this.form.focus()
    }
  }
}

export const Chat = connect(
  (state: IAppState): ConnectedProps => {
    return {
      messages: state.chat.messages
    }
  },
  (dispatch: Function): DispatchProps => ({
    sendMessage: (text: string) => dispatch(sendChat(text)),
    toggleChatLayout() {
      dispatch(
        setSetting('chatLocation', location =>
          location === ChatLocation.DockRight ? ChatLocation.FloatLeft : ChatLocation.DockRight
        )
      )
    },
    notifyTyping: throttle(() => dispatch(server_notifyTyping()), TYPING_DURATION - 500, {
      trailing: false
    })
  })
)(ChatComponent)
