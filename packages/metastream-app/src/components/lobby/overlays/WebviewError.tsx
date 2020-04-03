import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { IReactReduxProps } from 'types/redux-thunk'
import styles from './WebviewError.css'

interface IProps {
  url: string
  className?: string
}

type PrivateProps = IProps & IReactReduxProps

class _WebviewError extends React.Component<PrivateProps> {
  render(): JSX.Element | null {
    const { url, className } = this.props

    // TODO: localize
    return (
      <div className={cx(className, styles.container)}>
        <p className={styles.emoji}>😞</p>
        <p>
          <strong>There was a problem loading the site.</strong>
        </p>
        <p className={styles.fullUrl}>{url}</p>
        <ol className={styles.list}>
          <li>
            Check that the Metastream Remote browser extension has{' '}
            <strong>access to all sites</strong>.
          </li>
          <li>
            Verify that the website uses <strong>https://</strong>
          </li>
          <li>Test the site outside of Metastream.</li>
          <li>Reload the site.</li>
          {FEATURE_POPUP_PLAYER && <li>Try opening the popup player.</li>}
        </ol>
      </div>
    )
  }
}

export const WebviewError = connect()(_WebviewError)
