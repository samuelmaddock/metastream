import React, { ReactNode, Component } from 'react'
import * as cx from 'classnames'
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
    <p>Hi, thanks for trying out Metastream!</p>
    <p>
      This release is still in beta, so expect there to be some issues. If you come across any,
      please{' '}
      <ExternalLink href="https://github.com/samuelmaddock/metastream/issues">
        submit a GitHub issue.
      </ExternalLink>
    </p>
    <p>
      If you&rsquo;d like to join in on the discussion, feel free to join the Discord community
      using the link at the bottom of the screen.
    </p>
    <p>
      And if you&rsquo;re coming from Rabbit,{' '}
      <ExternalLink href="https://github.com/samuelmaddock/metastream/wiki/FAQ">
        check out the FAQ
      </ExternalLink>{' '}
      to learn how Metastream differs.
    </p>
    <p>💖 Sam</p>
  </>
)

const Donators: React.SFC = () => (
  <Fetch cacheKey="donators" href={`${HOME_WEBSITE}/app/donators.txt`}>
    {data => <p style={{ whiteSpace: 'pre-wrap' }}>{typeof data === 'string' ? data : ''}</p>}
  </Fetch>
)
