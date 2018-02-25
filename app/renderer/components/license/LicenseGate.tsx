import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import styles from './LicenseGate.css'
import { NetworkState } from 'types/network'
import { ILobbySession } from 'renderer/platform/types'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { TextAreaInput } from 'renderer/components/common/input'
import { registerLicense } from 'renderer/license'
import { Redirect, RouteComponentProps } from 'react-router'

const { productName, version } = require('package.json')

interface IProps extends RouteComponentProps<any> {}

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

    return (
      <LayoutMain className={styles.container}>
        <section className={styles.column}>
          <h1>
            {productName} Alpha {version}
          </h1>
          <TextAreaInput theRef={e => (this.licenseInput = e)} className={styles.input} autoFocus />
          <MenuButton
            icon="unlock"
            size="medium"
            onClick={() => {
              const license = this.licenseInput!.value
              const valid = registerLicense(license)
              this.setState({ redirectToReferrer: valid })
            }}
          >
            Enter License
          </MenuButton>
        </section>
      </LayoutMain>
    )
  }
}
