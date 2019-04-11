import React, { Component } from 'react'
import { IMessage } from 'lobby/reducers/chat'
import { Message } from './Message'
import styles from './Chat.css'
import { t } from 'locale'

interface IProps {
  messages: IMessage[]
}

interface IState {
  hasNewMessage: boolean
}

export class Messages extends Component<IProps, IState> {
  private list: HTMLElement | null = null

  private wasAtBottom: boolean = true
  state: IState = { hasNewMessage: false }

  private get scrollBottom() {
    return this.list ? Math.trunc(this.list.scrollHeight - this.list.clientHeight) : 0
  }

  componentDidMount(): void {
    if (this.list) {
      this.list.addEventListener('scroll', this.handleScroll)
    }
  }

  componentWillUnmount() {
    if (this.list) {
      this.list.removeEventListener('scroll', this.handleScroll)
    }
  }

  componentDidUpdate(prevProps: IProps): void {
    if (this.props.messages !== prevProps.messages) {
      if (this.wasAtBottom) {
        this.scrollToBottom()
      } else {
        this.setState({ hasNewMessage: true })
      }
    }
  }

  private isScrolledToBottom(): boolean {
    return !!(this.list && Math.round(this.list.scrollTop) === Math.round(this.scrollBottom))
  }

  scrollToBottom(): void {
    if (this.list) {
      this.list.scrollTop = this.scrollBottom
      this.wasAtBottom = true
    }
  }

  private handleScroll = (): void => {
    this.wasAtBottom = this.isScrolledToBottom()
    if (this.state.hasNewMessage && this.isScrolledToBottom()) {
      this.setState({ hasNewMessage: false })
    }
  }

  render(): JSX.Element | null {
    const messages = this.props.messages.map(message => (
      <Message key={message.id} message={message} />
    ))

    return (
      <div className={styles.chatWrapper}>
        <ul ref={el => (this.list = el)} className={styles.messages}>
          {messages}
        </ul>
        {this.state.hasNewMessage && (
          <div className={styles.newMessages} onClick={this.scrollToBottom.bind(this)}>
            {t('chatNewMessage')}
          </div>
        )}
      </div>
    )
  }
}
