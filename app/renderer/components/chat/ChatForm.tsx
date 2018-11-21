import React, { PureComponent } from 'react'
import { IMessage } from 'renderer/lobby/reducers/chat'

import styles from './Chat.css'
import { CHAT_MAX_MESSAGE_LENGTH } from 'constants/chat'
import { t } from '../../../locale/index'
import { Key } from './Key'

interface IProps {
  showHint: boolean
  send: (text: string) => void
  onFocus?: () => void
  onBlur?: () => void
}

interface IState {
  spellcheck?: boolean
  hasOpened: boolean
}

export class ChatForm extends PureComponent<IProps, IState> {
  state: IState = {
    hasOpened: Boolean(localStorage.getItem('hasOpenedChat'))
  }

  private input: HTMLInputElement | null = null
  private dismissed?: boolean

  private get inputText() {
    return this.input ? this.input.value : null
  }

  private submitText = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    const target = event.currentTarget

    switch (event.key) {
      case 'Enter':
        event.nativeEvent.stopImmediatePropagation()
        event.preventDefault()

        const text = target.value
        if (text.length > 0) {
          this.props.send(text)
          target.value = ''
        }

        this.dismiss()
        break
    }
  }

  render(): JSX.Element | null {
    // TODO: l10n
    return (
      <div className={styles.form}>
        <input
          ref={e => {
            this.input = e
          }}
          type="text"
          className={styles.messageInput}
          placeholder={t('chatPlaceholder')}
          spellCheck={this.state.spellcheck}
          onKeyPress={this.submitText}
          maxLength={CHAT_MAX_MESSAGE_LENGTH}
          onChange={this.onInputChange}
          onFocus={this.props.onFocus}
          onBlur={this.onBlur}
        />
        {this.props.showHint && !this.state.hasOpened && (
          <div className={styles.hint}>
            Press <Key /> to reveal chat.
          </div>
        )}
      </div>
    )
  }

  focus(): void {
    if (this.input) {
      this.input.focus()
    }

    if (!this.state.hasOpened) {
      localStorage.setItem('hasOpenedChat', '1')
      this.setState({ hasOpened: true })
    }
  }

  dismiss(): void {
    this.dismissed = true
    if (this.input) {
      this.input.blur()

      // In case input wasn't focused, invoke blur callback manually
      if (this.dismissed) {
        this.onBlur()
      }
    }
  }

  private onBlur = () => {
    if (this.props.onBlur && this.dismissed) {
      this.dismissed = undefined
      this.props.onBlur()
    }
  }

  private onInputChange = () => {
    const text = this.inputText
    const spellcheck = !(text && text.startsWith('http'))

    if (this.state.spellcheck !== spellcheck) {
      this.setState({ spellcheck })
    }
  }
}
