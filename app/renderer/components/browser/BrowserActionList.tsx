import React, { Component } from 'react'
import styles from './BrowserActionList.css'
import { connect } from 'react-redux'
import { IAppState } from '../../reducers/index'
import { IExtensionsState } from '../../reducers/extensions'
import { BrowserAction } from './BrowserAction'
import { showExtensionPopup } from '../../actions/extensions'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps {
  tabId: number
}

interface IConnectedProps {
  extensions: IExtensionsState
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class _BrowserActionList extends Component<PrivateProps> {
  render(): JSX.Element | null {
    const closePopup = () => {
      this.props.dispatch!(showExtensionPopup())
    }

    const browserActions = Object.keys(this.props.extensions.byId).reduce(
      (acc, extId) => {
        const ext = this.props.extensions.byId[extId]!
        if (!ext.enabled || !ext.browser_action) return acc

        const node = (
          <BrowserAction
            key={ext.id}
            extension={ext}
            popupOpen={!!this.props.extensions.popup}
            closePopup={closePopup}
            tabId={this.props.tabId}
          />
        )
        acc.push(node)
        return acc
      },
      [] as any[]
    )

    if (browserActions.length === 0) return null

    return (
      <div>
        <div className={styles.actionsContainer}>{browserActions}</div>
        {this.props.children}
      </div>
    )
  }
}

export const BrowserActionList = connect(
  (state: IAppState): IConnectedProps => {
    return {
      extensions: state.extensions
    }
  }
)(_BrowserActionList) as React.ComponentClass<IProps>
