import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { IAppState } from 'reducers'

import styles from './Chat.css'
import { Trans } from 'react-i18next'
import { t } from '../../locale/index'
import { getTypingUsers } from '../../lobby/reducers/chat.helpers'
import { IUser } from '../../lobby/reducers/users'

interface Props {}

interface IConnectedProps {
  typingUsers: IUser[]
}

type PrivateProps = Props & IConnectedProps

const User = ({ user }: { user: IUser }) => <strong>{user.name}</strong>

const UserTypingComponent: React.SFC<PrivateProps> = props => {
  const { typingUsers: users } = props
  const num = users.length

  let children
  switch (num) {
    case 0:
      children = null
      break
    case 1:
      children = (
        <Trans i18nKey="chatTyping1">
          <User user={users[0]} /> is typing…
        </Trans>
      )
      break
    case 2:
      children = (
        <Trans i18nKey="chatTyping2">
          <User user={users[0]} /> and <User user={users[1]} /> are typing…
        </Trans>
      )
      break
    case 3:
      children = (
        <Trans i18nKey="chatTyping3">
          <User user={users[0]} /> <User user={users[1]} /> and <User user={users[2]} /> are typing…
        </Trans>
      )
      break
    default:
      children = t('chatTypingSeveral')
      break
  }
  return <div className={styles.typing}>{children}</div>
}

export const UserTyping = connect<IConnectedProps, IAppState, Props, IAppState>((state, props) => ({
  typingUsers: getTypingUsers(state)
}))(UserTypingComponent)
