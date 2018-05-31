import React, { Component } from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import { Link } from 'react-router-dom'

import styles from './WelcomePage.css'

import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { t } from '../../locale/index'
import Input from 'material-ui/Input/Input';

const { productName, version } = require('package.json')

interface IProps extends RouteComponentProps<any> {
}

export class WelcomePage extends Component<IProps> {
  state = { redirectToReferrer: false }

  private licenseInput: HTMLTextAreaElement | null = null

  // Design: https://venturebeat.com/wp-content/uploads/2015/03/Slack-test-start.png
  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <section className={styles.column}>
          <h1>Welcome to {productName}</h1>
          <Input className={styles.name} defaultValue="Sam" />
          <Link to="/" className={styles.btn}>
            <MenuButton>{t('continue')}</MenuButton>
          </Link>
        </section>
      </LayoutMain>
    )
  }
}
