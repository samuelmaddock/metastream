import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import * as packageJson from 'package.json'

import styles from './Home.css'
import { TitleBar } from 'renderer/components/TitleBar'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { MenuHeader } from './menu/MenuHeader'
import { ExternalLink } from './common/link';

interface IProps {}

export default class Home extends Component<IProps> {
  render() {
    const DEV = process.env.NODE_ENV === 'development'
    const gitv = `${process.env.GIT_BRANCH}@${process.env.GIT_COMMIT}`
    return (
      <LayoutMain className={styles.container}>
        <section>
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
                <MenuButton icon="play">Start Session</MenuButton>
              </Link>
            </li>
            {/* <li>
              <Link to="/servers" className={styles.btn}>
                <MenuButton icon="search">Find Session</MenuButton>
              </Link>
            </li> */}
            <li>
              <Link to="/join" className={styles.btn}>
                <MenuButton icon="globe">Join Session</MenuButton>
              </Link>
            </li>
            <li>
              <Link to="/settings" className={styles.btn}>
                <MenuButton icon="settings">Settings</MenuButton>
              </Link>
            </li>
            <li>
              <ExternalLink href="https://getmetastream.com/buy">
                <MenuButton icon="credit-card">Purchase</MenuButton>
              </ExternalLink>
            </li>
          </ul>
        </section>
      </LayoutMain>
    )
  }
}
