import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { IAppState } from 'reducers'

import styles from './Chat.css'
import { Trans } from 'react-i18next'
import { t } from '../../locale/index'

interface Props {}

type TypeEntry = {
  name: string
}

interface IConnectedProps {
  typing: TypeEntry[]
}

type PrivateProps = Props & IConnectedProps

const User = ({ user }: { user: TypeEntry }) => <strong>{user.name}</strong>

const UserTypingComponent: React.SFC<PrivateProps> = props => {
  const { typing } = props
  const num = typing.length

  let children
  switch (num) {
    case 0:
      children = null
      break
    case 1:
      children = (
        <Trans i18nKey="chatTyping1">
          <User user={typing[0]} /> is typing…
        </Trans>
      )
      break
    case 2:
      children = (
        <Trans i18nKey="chatTyping2">
          <User user={typing[0]} /> and <User user={typing[1]} /> are typing…
        </Trans>
      )
      break
    case 3:
      children = (
        <Trans i18nKey="chatTyping3">
          <User user={typing[0]} /> <User user={typing[1]} /> and <User user={typing[2]} /> are
          typing…
        </Trans>
      )
      break
    default:
      children = t('chatTypingSeveral')
      break
  }
  return <div className={styles.typing}>{children}</div>
}

const TEST = [
  {
    name: 'Sam'
  },
  {
    name: 'Austin'
  },
  {
    name: 'Hunter'
  }
]

export const UserTyping = connect<IConnectedProps, IAppState, Props, IAppState>((state, props) => ({
  typing: TEST
}))(UserTypingComponent)
