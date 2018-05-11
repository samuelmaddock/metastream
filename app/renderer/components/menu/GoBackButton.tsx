import React from 'react'
import { Link } from 'react-router-dom'

import { Icon } from 'renderer/components/Icon'
import styles from './GoBackButton.css'
import { t } from '../../../locale/index'

export const GoBackButton: React.SFC<{}> = props => {
  return (
    <Link to="/" className={styles.goBack}>
      <Icon name="arrow-left" />
      {t('goBack')}
    </Link>
  )
}
