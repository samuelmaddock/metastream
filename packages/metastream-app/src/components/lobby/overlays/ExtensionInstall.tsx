import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import styles from './ExtensionInstall.css'
import { IReactReduxProps } from 'types/redux-thunk'
import { checkExtensionInstall } from 'actions/ui'

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

  render(): JSX.Element | null {
    return (
      <div className={cx(styles.container, this.props.className)}>
        <p>A browser extension is required for playback.</p>
        <div className={styles.badgeList}>
          <a
            href="https://chrome.google.com/webstore/detail/fakegmdomhmegokfomgmkbopjibonfcp"
            target="_blank"
          >
            <img
              src="/images/badge-chrome-webstore.png"
              alt="View extension in the Chrome Web Store"
            />
          </a>
          <a
            href="https://addons.mozilla.org/en-US/firefox/addon/metastream-remote/"
            target="_blank"
          >
            <img
              src="/images/badge-firefox-addon.png"
              alt="View extension in the Firefox Addon store"
            />
          </a>
        </div>
      </div>
    )
  }
}

export const ExtensionInstall = connect()(_ExtensionInstall)
