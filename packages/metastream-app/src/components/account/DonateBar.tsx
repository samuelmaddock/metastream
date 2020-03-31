import React, { SFC, useState } from 'react'
import cx from 'classnames'
import { LoginButton, SignupButton } from './buttons'
import { MetastreamUserTier, AccountService } from 'account/account'
import { t } from 'locale'
import styles from './DonateBar.css'
import { MediumText } from 'components/common/typography'
import { usePatronTier } from 'account/hooks'

interface Props {
  className?: string
}

export const DonateBar: SFC<Props> = ({ className }) => {
  const [error, setError] = useState<string | null>(null)

  const tier = usePatronTier()
  if (tier !== MetastreamUserTier.None) return null

  return (
    <div className={className}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.container}>
        <MediumText>{t('supportMetastream')}&nbsp;🎉</MediumText>
        <div className={styles.buttons}>
          <SignupButton />
          <span className={styles.then}>THEN</span>
          <LoginButton
            onClick={async () => {
              if (error) setError(null)
              try {
                await AccountService.get().promptLogin()
              } catch (e) {
                console.log(e)
                ;(window as any).E = e
                setError(e.message)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
