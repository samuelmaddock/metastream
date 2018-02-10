import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import styles from './ServerBrowser.css'
import { NetworkState } from 'types/network'
import { ILobbySession } from 'renderer/platform/types'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'

interface IProps {
  connect: (sessionId: string) => void
}

export class SessionJoin extends Component<IProps> {
  private sessionInput: HTMLInputElement | null = null

  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <Link to="/" className={styles.goBack}>
          <Icon name="arrow-left" />
          Go back
        </Link>
        <section>
          <header className={styles.header}>
            <div className={styles.left}>
              <h1>Join Session</h1>
            </div>
          </header>
          <div>
            <input ref={el => this.sessionInput = el} type="text" pattern="[a-zA-Z0-9]{64}" required />
            <MenuButton
              icon="globe"
              size="medium"
              onClick={() => {
                if (this.sessionInput!.checkValidity()) {
                  this.props.connect(this.sessionInput!.value)
                }
              }}
            >
              Connect
            </MenuButton>
          </div>
        </section>
      </LayoutMain>
    )
  }
}
