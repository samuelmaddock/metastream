import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import * as packageJson from 'package.json'

import styles from './Home.css'
import { TitleBar } from 'renderer/components/TitleBar'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { MenuHeader } from './menu/MenuHeader'
import { ExternalLink } from './common/link'
import { hasValidLicense } from '../license'
import { t } from '../../locale/index'
import { IconButton } from './common/button'
import Tooltip from 'material-ui/Tooltip'

const SocialLink = (props: { href: string; title: string; image?: string; icon?: string }) => (
  <ExternalLink href={props.href} className={styles.socialLink}>
    <Tooltip title={props.title}>
      {props.image ? (
        <img src={props.image} className={styles.socialIcon} />
      ) : (
        <Icon name={props.icon!} className={styles.socialIcon} />
      )}
    </Tooltip>
  </ExternalLink>
)

interface IProps {}

export default class Home extends Component<IProps> {
  render() {
    const DEV = process.env.NODE_ENV === 'development'
    const gitv = `${process.env.GIT_BRANCH}@${process.env.GIT_COMMIT}`
    return (
      <LayoutMain className={styles.container}>
        <header className={styles.header}>
          <MenuHeader text={packageJson.productName}>
            <h3>
              Alpha {packageJson.version}
              {DEV && ` (${gitv})`}
            </h3>
            {DEV && <h3>Development build</h3>}
          </MenuHeader>
        </header>
        <section className={styles.nav}>
          <ul>
            <li>
              <Link to="/lobby/create" className={styles.btn}>
                <MenuButton icon="play">{t('startSession')}</MenuButton>
              </Link>
            </li>
            {/* <li>
              <Link to="/servers" className={styles.btn}>
                <MenuButton icon="search">Find Session</MenuButton>
              </Link>
            </li> */}
            <li>
              <Link to="/join" className={styles.btn}>
                <MenuButton icon="globe">{t('joinSession')}</MenuButton>
              </Link>
            </li>
            <li>
              <Link to="/settings" className={styles.btn}>
                <MenuButton icon="settings">{t('settings')}</MenuButton>
              </Link>
            </li>
            <li>
              <ExternalLink href="https://www.patreon.com/metastream" className={styles.btn}>
                <MenuButton icon="heart">Donate</MenuButton>
              </ExternalLink>
            </li>
            {!hasValidLicense() && (
              <li>
                <Link to="/license" className={styles.btn}>
                  <MenuButton icon="file-text">{t('enterLicense')}</MenuButton>
                </Link>
              </li>
            )}
          </ul>
        </section>

        <section className={styles.intro}>
          <p>Hi, thanks for trying out Metastream!</p>
          <p>
            This release is still in beta, so expect there to be some issues. If you come across
            any, please{' '}
            <ExternalLink href="https://github.com/samuelmaddock/metastream/issues/new/choose">
              submit a GitHub issue.
            </ExternalLink>
          </p>
          <p>
            If you'd like to join in on the discussion, feel free to join the Discord community
            using the link at the bottom of the screen.
          </p>
          <p>💖 Sam</p>
        </section>

        <footer className={styles.social}>
          <div>
            {/* <SocialLink
            href="https://getmetastream.com/"
            image="./assets/icons/globe.svg"
            title="Website"
          /> */}

            <SocialLink
              href="https://www.patreon.com/metastream"
              image="./assets/icons/social/patreon-wordmark.svg"
              title="Becoma a patron"
            />

            <SocialLink
              href="https://twitter.com/GetMetastream"
              image="./assets/icons/social/twitter-color.svg"
              title="Twitter"
            />

            <SocialLink
              href="https://discord.gg/nfwPRb9"
              image="./assets/icons/social/discord-color.svg"
              title="Join Discord community"
            />
          </div>

          <div className={styles.socialRight}>
            <span className={styles.credits}>
              Created by <ExternalLink href="http://samuelmaddock.com">Sam Maddock</ExternalLink>
            </span>
          </div>
        </footer>
      </LayoutMain>
    )
  }
}
