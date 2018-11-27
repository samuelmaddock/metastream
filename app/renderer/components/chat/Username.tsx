import React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'
import { IAppState } from 'renderer/reducers/index'

import styles from './Chat.css'
import { getUserColor } from '../../lobby/reducers/users.helpers'

interface IProps {
  className?: string
  userId: string

  /** Username */
  children: string
}

interface IConnectedProps {
  color: string
}

type Props = IProps & IConnectedProps

const _ChatUsername: React.SFC<Props> = props => {
  const style = {
    color: props.color
  }

  return (
    <span className={cx(props.className, styles.username)} title={props.userId} style={style}>
      {props.children}
    </span>
  )
}

export const ChatUsername = connect<IConnectedProps, IAppState, IProps, IAppState>(
  (state, props) => ({
    color: getUserColor(state, props.userId)
  })
)(_ChatUsername)
