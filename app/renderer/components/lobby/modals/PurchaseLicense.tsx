import React, { Component } from 'react'
import styles from './PurchaseLicense.css'
import packageJson from 'package.json'
import { LICENSE_PURCHASE_URL } from 'constants/license'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { ExternalLink } from 'renderer/components/common/link'
import { HighlightButton } from 'renderer/components/common/button'
import { t } from '../../../../locale/index'

interface IProps {}

export default class PurchaseLicense extends Component<IProps> {
  render(): JSX.Element | null {
    return (
      <div className={styles.container}>
        <p>Hello! Thanks for trying out {packageJson.productName}.</p>
        <p>
          This is an unregistered evaluation version, and although the trial is untimed, a license
          must be purchased for continued use.
        </p>
        <p>Would you like to purchase a license now?</p>
        <ExternalLink href={`${LICENSE_PURCHASE_URL}&utm_source=modal`}>
          <HighlightButton icon="credit-card" size="large" highlight>
            {t('purchase')}
          </HighlightButton>
        </ExternalLink>
      </div>
    )
  }
}
