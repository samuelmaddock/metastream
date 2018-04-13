import React from 'react'
import { connect } from 'react-redux';
import { IAppState } from 'renderer/reducers/index';

import styles from './Chat.css'
import { getUserColor } from '../../lobby/reducers/users';

interface IProps {
  userId: string
  name: string
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
    <span className={styles.username} title={props.userId} style={style}>
      {props.name}
    </span>
  )
}

export const ChatUsername = connect<IConnectedProps, IAppState, IProps>((state, props) => ({
  color: getUserColor(state, props.userId)
}))(_ChatUsername)
