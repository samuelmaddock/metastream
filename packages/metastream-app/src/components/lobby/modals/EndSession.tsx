import React, { Component } from 'react'

import styles from './EndSession.css'
import { HighlightButton } from '../../common/button'
import { withNamespaces, WithNamespaces, Trans } from 'react-i18next'
import { t } from 'locale'

interface IProps {
  className?: string
  onConfirm?: () => void
  onCancel: () => void
}

type PrivateProps = IProps & WithNamespaces

class EndSession extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>{t('endSessionTitle')}</h2>
        <p>{t('endSessionModalDescription')}</p>
        <div>
          <HighlightButton icon="check" size="large" onClick={this.props.onConfirm}>
            {t('endSessionButton')}
          </HighlightButton>
          <HighlightButton icon="x" size="large" highlight onClick={this.props.onCancel}>
            {t('cancel')}
          </HighlightButton>
        </div>
      </div>
    )
  }
}

export default withNamespaces()(EndSession)
