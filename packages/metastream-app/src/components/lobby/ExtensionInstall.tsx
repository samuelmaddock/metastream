import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import styles from './ExtensionInstall.css'
import { IReactReduxProps } from 'types/redux-thunk'
import { install } from 'utils/extension'
import { checkExtensionInstall } from 'actions/ui'
import { HighlightButton } from '../common/button'

interface IProps {
  className?: string
}

type PrivateProps = IProps & IReactReduxProps

class _ExtensionInstall extends React.Component<PrivateProps> {
  componentDidMount() {
    document.addEventListener('visibilitychange', this.onVisibilityChange, false)
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange, false)
  }

  private onVisibilityChange = () => {
    // Check for extension installed if user switches browser tabs
    if (document.visibilityState === 'visible') {
      this.props.dispatch(checkExtensionInstall())
    }
  }

  private onInstallClick = () => {
    install()
      .then(() => {
        this.props.dispatch(checkExtensionInstall())
      })
      .catch(() => {})
  }

  render(): JSX.Element | null {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <p>A browser extension is required for playback.</p>
        <HighlightButton icon="download" size="large" highlight onClick={this.onInstallClick}>
          Install
        </HighlightButton>
      </div>
    )
  }
}

export const ExtensionInstall = connect()(_ExtensionInstall)
