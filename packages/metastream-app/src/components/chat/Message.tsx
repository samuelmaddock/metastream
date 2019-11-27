import React, { PureComponent } from 'react'
import cx from 'classnames'
import { IMessage } from 'lobby/reducers/chat'
import { ChatUsername } from './Username'
import styles from './Chat.css'
import * as html from 'html-parse-stringify2'
import { formatShortTimestamp } from '../../utils/time'
import { MonospaceText } from '../common/typography'

const entityMap: { [key: string]: string | undefined } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x2F;': '/'
}

/**
 * https://github.com/i18next/i18next/blob/8c6f2e7fdec327f041d788c008e8191cc3158e53/src/utils.js#L82
 */
export function unescapehtml(data: string) {
  return data.replace(/&.*?;/g, s => entityMap[s] || s)
}

/**
 * Renders React nodes for parsed chat message.
 * Inspired by https://github.com/i18next/react-i18next/blob/60658921f659a8b56da9b4e1d8a5bd7a906096b6/src/Trans.js#L57
 */
function renderHTMLMessage(message: string): React.ReactNode {
  const ast: any[] = html.parse(`<0>${message}</0>`)
  const astNodes: any[] = ast[0].children

  const result = astNodes.reduce((mem: React.ReactNode[], node, idx) => {
    if (node.type === 'tag') {
      if (node.name === 'Username') {
        const userId = node.attrs.id || ''
        const username = unescapehtml(node.children[0].content || '')
        mem.push(
          <ChatUsername key={idx} userId={userId}>
            {username}
          </ChatUsername>
        )
      } else if (node.name === 'Media') {
        const title = unescapehtml(node.children[0].content || '')
        mem.push(<em key={idx} className={styles.mediaTitle}>{`“${title}”`}</em>)
      }
    } else if (node.type === 'text') {
      mem.push(node.content)
    }
    return mem
  }, [])

  return result
}

interface IProps {
  message: IMessage
  showTimestamp: boolean
}

export class Message extends PureComponent<IProps> {
  render(): JSX.Element | null {
    const { message, showTimestamp } = this.props
    const { author } = message

    const broadcast = !author
    const timestamp = showTimestamp ? formatShortTimestamp(message.timestamp) : undefined

    return (
      <li className={styles.message}>
        {timestamp && (
          <MonospaceText component="time" className={styles.timestamp} dateTime={timestamp}>
            {timestamp}
          </MonospaceText>
        )}
        {author && (
          <ChatUsername userId={author.id} className={styles.textPrefix}>
            {author.username}
          </ChatUsername>
        )}
        <span
          className={cx({
            [styles.broadcast]: broadcast
          })}
        >
          {message.html ? renderHTMLMessage(message.content) : message.content}
        </span>
      </li>
    )
  }
}
