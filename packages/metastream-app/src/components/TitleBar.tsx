import React, { Component } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import { PRODUCT_NAME } from 'constants/app'

import { IAppState } from 'reducers'
import { isUpdateAvailable } from 'reducers/ui'

import styles from './TitleBar.css'
import { IconButton } from 'components/common/button'
import { Icon } from './Icon'
import { push } from 'react-router-redux'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps {
  className?: string
  title?: string
}

interface IConnectedProps {
  updateAvailable?: boolean
  showBackButton: boolean
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class _TitleBar extends Component<PrivateProps> {
  render(): JSX.Element | null {
    // TODO: detect update to website
    const updateButton = this.props.updateAvailable && (
      <IconButton icon="download" className={styles.updateButton} onClick={() => {}}>
        Update
      </IconButton>
    )

    return (
      <div className={cx(this.props.className, styles.container)}>
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <h2 className={styles.title}>{this.props.title || PRODUCT_NAME}</h2>
            <div className={styles.drag} />
          </header>
          {updateButton}
          {this.props.showBackButton && this.renderBack()}
        </div>
      </div>
    )
  }

  private renderBack() {
    return (
      <div className={styles.leftActions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => this.props.dispatch!(push('/'))}
        >
          <Icon name="arrow-left" />
        </button>
      </div>
    )
  }
}

export const TitleBar = connect(
  (state: IAppState): IConnectedProps => {
    const { location } = state.router
    return {
      updateAvailable: isUpdateAvailable(state),
      showBackButton: location ? location.pathname !== '/' : true
    }
  }
)(_TitleBar) as React.ComponentClass<IProps>
