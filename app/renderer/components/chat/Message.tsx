import React, { PureComponent } from 'react'
import * as cx from 'classnames'
import { IMessage } from 'renderer/lobby/reducers/chat'
import { ChatUsername } from './Username'
import styles from './Chat.css'
import * as html from 'html-parse-stringify2'

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

  // TODO: memoize results?
  // TODO: unescape interpolated variables like 'mediaTitle'

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
}

export class Message extends PureComponent<IProps> {
  render(): JSX.Element | null {
    const { message } = this.props
    const { author } = message

    const broadcast = !author

    return (
      <li className={styles.message}>
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
