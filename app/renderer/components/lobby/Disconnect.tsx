import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'
import styles from './Disconnect.css'
import { TitleBar } from '../TitleBar'
import { IAppState } from '../../reducers/index'
import { MenuButton } from '../menu/MenuButton'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon'

interface IProps {
  message: string
}

export class Disconnect extends Component<IProps> {
  render(): JSX.Element {
    return (
      <div className={styles.container}>
        <TitleBar className={styles.titlebar} />

        <h1 className={styles.header}>Disconnected</h1>
        <p className={styles.info}>
          <Icon name="info" />
          {this.props.message}
        </p>
        <Link to="/">
          <MenuButton size="medium">OK</MenuButton>
        </Link>
      </div>
    )
  }
}
