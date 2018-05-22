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

const SocialLink = (props: { href: string; image: string; title: string }) => (
  <ExternalLink href={props.href}>
    <Tooltip title={props.title}>
      <img src={props.image} />
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
        <section className={styles.nav}>
          <MenuHeader text={packageJson.productName}>
            <h3>
              Alpha {packageJson.version}
              {DEV && ` (${gitv})`}
            </h3>
            {DEV && <h3>Development build</h3>}
          </MenuHeader>
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
            {!hasValidLicense() && (
              <li>
                <Link to="/license" className={styles.btn}>
                  <MenuButton icon="file-text">{t('enterLicense')}</MenuButton>
                </Link>
              </li>
            )}
          </ul>
        </section>
        <section className={styles.social}>
          <SocialLink
            href="https://twitter.com/GetMetastream"
            image="./assets/icons/social/twitter-color.svg"
            title="Twitter"
          />

          <SocialLink
            href="https://discord.gg/nfwPRb9"
            image="./assets/icons/social/discord-color.svg"
            title="Join Discord group"
          />
        </section>
      </LayoutMain>
    )
  }
}
