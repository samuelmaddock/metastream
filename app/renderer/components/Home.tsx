import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import * as packageJson from 'package.json'

import styles from './Home.css'
import { TitleBar } from 'renderer/components/TitleBar'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { MenuHeader } from './menu/MenuHeader';

interface IProps {}

export default class Home extends Component<IProps> {
  render() {
    const gitv = `${process.env.GIT_BRANCH}@${process.env.GIT_COMMIT}`
    return (
      <LayoutMain className={styles.container}>
        <section>
          <MenuHeader text={packageJson.productName}>
            <h3>
              Alpha {packageJson.version} ({gitv})
            </h3>
            <h3>{process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} build</h3>
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
          </ul>
        </section>
      </LayoutMain>
    )
  }
}
