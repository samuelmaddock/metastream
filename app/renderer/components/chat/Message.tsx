import React, { Component } from 'react'
import * as cx from 'classnames'
import { IMessage } from 'renderer/lobby/reducers/chat'
import styles from './Chat.css'

interface IProps {
  message: IMessage
}

export class Message extends Component<IProps> {
  render(): JSX.Element | null {
    const { message } = this.props
    const { author } = message

    const broadcast = !author;

    return (
      <li className={styles.message}>
        {author && (
          <span className={styles.username} title={author.id}>
            {author.username}
          </span>
        )}
        <span className={cx({
          [styles.broadcast]: broadcast
        })}>{message.content}</span>
      </li>
    )
  }
}
