import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import * as packageJson from 'package.json';

import styles from './Home.css';
import { TitleBar } from 'renderer/components/TitleBar';
import LayoutMain from 'renderer/components/layout/Main';
import { Icon } from 'renderer/components/Icon';
import { MenuButton } from 'renderer/components/menu/MenuButton';

interface IProps {}

export default class Home extends Component<IProps> {
  render() {
    const gitv = `${process.env.GIT_BRANCH}@${process.env.GIT_COMMIT}`;
    return (
      <LayoutMain className={styles.container}>
        <section>
          <header className={styles.header}>
            <h1>{packageJson.productName}</h1>
            <h3>
              Pre-alpha v{packageJson.version} ({gitv})
            </h3>
            <h3>{process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} build</h3>
          </header>
          <ul>
            <li>
              <Link to="/lobby/create" className={styles.btn}>
                <MenuButton icon="play">Start Session</MenuButton>
              </Link>
            </li>
            <li>
              <Link to="/servers" className={styles.btn}>
                <MenuButton icon="search">Find Session</MenuButton>
              </Link>
            </li>
          </ul>
        </section>
      </LayoutMain>
    );
  }
}
