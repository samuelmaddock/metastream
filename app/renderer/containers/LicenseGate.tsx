import React, { Component } from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import { Link } from 'react-router-dom'

import styles from './LicenseGate.css'

import { NetworkState } from 'types/network'
import { ILobbySession } from 'renderer/platform/types'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { TextAreaInput } from 'renderer/components/common/input'
import { registerLicense } from 'renderer/license'
import { GoBackButton } from 'renderer/components/menu/GoBackButton'
import { MenuHeader } from 'renderer/components/menu/MenuHeader'
import { ExternalLink } from '../components/common/link'
import { LICENSE_PURCHASE_URL } from '../../constants/license'

const { productName, version } = require('package.json')

interface IProps extends RouteComponentProps<any> {
  gate?: boolean
}

interface IState {
  redirectToReferrer: boolean
}

export class LicenseGate extends Component<IProps, IState> {
  state = { redirectToReferrer: false }

  private licenseInput: HTMLTextAreaElement | null = null

  render(): JSX.Element | null {
    if (this.state.redirectToReferrer) {
      const { from } = this.props.location.state || { from: { pathname: '/' } }
      return <Redirect to={from} />
    }

    const title = this.props.gate ? `${productName} Alpha ${version}` : 'Enter license'

    return (
      <LayoutMain className={styles.container}>
        <section className={styles.column}>
          {this.props.gate ? null : <GoBackButton />}
          <MenuHeader text={title} />
          <TextAreaInput theRef={e => (this.licenseInput = e)} className={styles.input} autoFocus />
          <div className={styles.buttons}>
            <MenuButton
              icon="unlock"
              size="medium"
              onClick={() => {
                const license = this.licenseInput!.value
                const valid = registerLicense(license)
                this.setState({ redirectToReferrer: valid })
              }}
            >
              Use License
            </MenuButton>
            <ExternalLink href={LICENSE_PURCHASE_URL}>
              <MenuButton icon="credit-card" size="medium">
                Purchase License
              </MenuButton>
            </ExternalLink>
          </div>
        </section>
      </LayoutMain>
    )
  }
}
