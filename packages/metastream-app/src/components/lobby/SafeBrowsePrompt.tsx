import React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import styles from './SafeBrowsePrompt.css'
import { IReactReduxProps } from 'types/redux-thunk'
import { checkExtensionInstall } from 'actions/ui'
import { HighlightButton } from '../common/button'
import { getHost } from '../../utils/url'
import { safeBrowse } from '../../services/safeBrowse'
import { DimLink } from '../common/typography'
import { Trans } from 'react-i18next'
import { t } from 'locale'

interface IProps {
  url: string
  onChange: Function
  onPermitOnce: Function
}

type PrivateProps = IProps & IReactReduxProps

class _SafeBrowsePrompt extends React.Component<PrivateProps> {
  render(): JSX.Element | null {
    const { url, onChange } = this.props
    const host = getHost(url)

    return (
      <div className={cx(styles.container)}>
        <p className={styles.emoji}>🤔</p>
        <p>
          <Trans i18nKey="safeBrowseLoadContent" values={{ host }}>
            Load content from <strong>{host}</strong>?
          </Trans>
        </p>
        <p className={styles.fullUrl}>{url}</p>
        <div>
          <HighlightButton
            size="medium"
            icon="check"
            highlight
            onClick={() => this.props.onPermitOnce()}
          >
            {t('once')}
          </HighlightButton>
          <HighlightButton
            size="medium"
            icon="check"
            onClick={() => {
              safeBrowse.permitURL(url)
              onChange()
            }}
          >
            {t('always')}
          </HighlightButton>
        </div>
        <p>
          <DimLink
            href="#"
            className={styles.disableLink}
            onClick={event => {
              event.preventDefault()
              safeBrowse.disable()
              onChange()
            }}
          >
            {t('safeBrowseDisableForSession')}
          </DimLink>
        </p>
      </div>
    )
  }
}

export const SafeBrowsePrompt = connect()(_SafeBrowsePrompt)
