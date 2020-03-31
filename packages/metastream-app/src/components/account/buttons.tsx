import React, { MouseEventHandler } from 'react'
import { HighlightButton } from 'components/common/button'
import { t } from 'locale'
import { assetUrl } from 'utils/appUrl'
import { openInBrowser } from 'utils/url'

interface Props {
  onClick?: MouseEventHandler
}

export const LoginButton = (props: Props) => (
  <HighlightButton size="medium" icon="log-in" {...props}>
    {t('patreonLogin')}
  </HighlightButton>
)

export const LogoutButton = (props: Props) => (
  <HighlightButton size="medium" icon="log-out" {...props}>
    {t('patreonLogout')}
  </HighlightButton>
)

export const SignupButton = () => (
  <button
    onClick={() => openInBrowser('https://www.patreon.com/metastream')}
    style={{ fontSize: 0 }}
    aria-label={t('patreonPledge')}
  >
    <img src={assetUrl('images/become_a_patron_button.png')} width="170px" height="40px" alt="" />
  </button>
)
