import React, { Component } from 'react'
import cx from 'classnames'

import styles from './BrowserActionList.css'
import { connect } from 'react-redux'
import { IAppState } from '../../reducers/index'
import { IExtensionsState } from '../../reducers/extensions'
import { BrowserAction } from './BrowserAction'

interface IProps {}

interface IConnectedProps {
  extensions: IExtensionsState
}

type PrivateProps = IProps & IConnectedProps

class _BrowserActionList extends Component<PrivateProps> {
  render(): JSX.Element | null {
    const browserActions = Object.keys(this.props.extensions.byId).reduce(
      (acc, extId) => {
        const ext = this.props.extensions.byId[extId]!
        if (!ext.enabled) return acc

        const node = <BrowserAction key={ext.id} extension={ext} />
        acc.push(node)
        return acc
      },
      [] as any[]
    )

    if (browserActions.length === 0) return null

    return <div className={styles.container}>{browserActions}</div>
  }
}

export const BrowserActionList = connect((state: IAppState): IConnectedProps => {
  return {
    extensions: state.extensions
  }
})(_BrowserActionList) as React.ComponentClass<IProps>
