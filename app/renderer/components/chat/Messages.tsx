import React, { Component } from 'react'
import { IMessage } from 'renderer/lobby/reducers/chat'
import { Message } from './Message'
import styles from './Chat.css'

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
    return this.list ? this.list.scrollHeight - this.list.clientHeight : 0
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

  componentWillReceiveProps(nextProps: IProps): void {
    this.wasAtBottom = this.isScrolledToBottom()
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
    return !!(this.list && this.list.scrollTop === this.scrollBottom)
  }

  scrollToBottom(): void {
    if (this.list) {
      this.list.scrollTop = this.scrollBottom
    }
  }

  private handleScroll = (): void => {
    if (this.isScrolledToBottom()) {
      this.setState({ hasNewMessage: false })
    }
  }

  render(): JSX.Element | null {
    const messages = this.props.messages.map((message, idx) => {
      return <Message key={idx} message={message} />
    })

    return (
      <div className={styles.chatWrapper}>
        <ul ref={el => (this.list = el)} className={styles.messages}>
          {messages}
        </ul>
        {this.state.hasNewMessage && (
          <div className={styles.newMessages} onClick={this.scrollToBottom.bind(this)}>
            You've got new MESSAGES!
          </div>
        )}
      </div>
    )
  }
}
