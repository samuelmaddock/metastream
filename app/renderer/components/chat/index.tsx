import React, { Component } from 'react'
import cx from 'classnames'

import { IMessage } from 'renderer/lobby/reducers/chat'

import { Messages } from './Messages'
import { ChatForm } from './ChatForm'

import styles from './Chat.css'

interface IProps {
  className?: string
  messages: IMessage[]
  sendMessage: (text: string) => void
  disabled?: boolean
  showHint: boolean
}

interface IState {
  focused?: boolean
}

export class Chat extends Component<IProps, IState> {
  private form: ChatForm | null = null
  private messages: Messages | null = null

  state: IState = {}

  componentDidMount(): void {
    this.setupListeners(!this.props.disabled)
    this.scrollToBottom()
  }

  componentWillUnmount(): void {
    this.setupListeners(false)
  }

  componentDidUpdate(prevProps: IProps) {
    if (this.props.disabled !== prevProps.disabled) {
      this.setupListeners(!this.props.disabled)

      if (this.state.focused && this.props.disabled) {
        this.onBlur()
      }
    }
  }

  private setupListeners(enabled: boolean) {
    if (enabled) {
      document.addEventListener('keypress', this.onKeyPress, false)
      document.addEventListener('keydown', this.onKeyDown, false)
    } else {
      document.removeEventListener('keypress', this.onKeyPress, false)
      document.removeEventListener('keydown', this.onKeyDown, false)
    }
  }

  render(): JSX.Element | null {
    return (
      <div
        className={cx(this.props.className, styles.container, {
          [styles.focused]: this.state.focused
        })}
      >
        <div className={styles.wrapper}>
          <div className={styles.background} />
          <div className={styles.foreground}>
            <Messages
              ref={e => {
                this.messages = e
              }}
              messages={this.props.messages}
            />
            <ChatForm
              ref={e => {
                this.form = e
              }}
              send={this.onSend}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              showHint={this.props.showHint}
            />
          </div>
        </div>
      </div>
    )
  }

  private scrollToBottom() {
    if (this.messages) {
      this.messages.scrollToBottom()
    }
  }

  private onFocus = (): void => {
    this.setState({ focused: true })
  }

  private onBlur = (): void => {
    this.setState({ focused: false })
    this.scrollToBottom()
  }

  private onSend = (message: string) => {
    this.props.sendMessage(message)
    this.scrollToBottom()
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
    switch (event.key) {
      case 'Escape':
        if (this.state.focused && this.form) {
          event.preventDefault()
          this.form.dismiss()
        }
    }
  }
}
