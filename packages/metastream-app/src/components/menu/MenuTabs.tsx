import React, { ReactNode, Component } from 'react'
import cx from 'classnames'
import { ExternalLink } from '../common/link'
import { Changelog } from './Changelog'
import { HOME_WEBSITE } from 'constants/http'

import styles from './MenuTabs.css'
import { t } from 'locale'
import { Fetch } from '../common/Fetch'

interface IProps {
  className?: string
}

interface IState {
  value: number
}

export class MenuTabs extends Component<IProps, IState> {
  state: IState = { value: 0 }

  render() {
    const tabs = [
      { label: t('welcome'), render: () => <WelcomeMessage /> },
      { label: t('changelog'), render: () => <Changelog /> },
      { label: t('donators'), render: () => <Donators /> }
    ]
    const selected = tabs[this.state.value]

    return (
      <div className={styles.container}>
        <ul className={styles.tabList}>
          {tabs.map((t, idx) => (
            <li
              key={idx}
              className={cx(styles.tabItem, {
                [styles.selected]: selected === t
              })}
            >
              <button className={styles.tabButton} onClick={() => this.setState({ value: idx })}>
                <span className={styles.tabLabel}>{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.content}>{selected && selected.render()}</div>
      </div>
    )
  }
}

const WelcomeMessage: React.SFC = () => (
  // TODO: l10n?
  <>
    <p>{t('welcomeMessage1')}</p>
    <p>
      {t('welcomeMessage2')}{' '}
      <ExternalLink href="https://github.com/samuelmaddock/metastream/issues">
      {t('welcomeMessage3')}
      </ExternalLink>
    </p>
    <p>
      {t('welcomeMessage4')}
    </p>
    <p>
    {t('welcomeMessage5')}{' '}
      <ExternalLink href="https://github.com/samuelmaddock/metastream/wiki/FAQ">
      {t('welcomeMessage6')}
      </ExternalLink>{' '}
      {t('welcomeMessage7')}
    </p>
    <p>💖 Sam</p>
  </>
)

const Donators: React.SFC = () => (
  <Fetch cacheKey="donators" href={`${HOME_WEBSITE}/app/donators.txt`}>
    {data => <p style={{ whiteSpace: 'pre-wrap' }}>{typeof data === 'string' ? data : ''}</p>}
  </Fetch>
)
