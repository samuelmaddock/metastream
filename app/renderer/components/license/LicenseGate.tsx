import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import styles from './LicenseGate.css'
import { NetworkState } from 'types/network'
import { ILobbySession } from 'renderer/platform/types'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { TextAreaInput } from 'renderer/components/common/input'

const { productName, version } = require('package.json')

interface IProps {}

export class LicenseGate extends Component<IProps> {
  private sessionInput: HTMLInputElement | null = null

  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <section className={styles.column}>
          <h1>
            {productName} Alpha {version}
          </h1>
          <TextAreaInput className={styles.input} autoFocus />
          <MenuButton
            icon="unlock"
            size="medium"
            onClick={() => {
              // TODO
            }}
          >
            Enter License
          </MenuButton>
        </section>
      </LayoutMain>
    )
  }
}
