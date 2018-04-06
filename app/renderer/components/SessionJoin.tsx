import React, { Component } from 'react'
import cx from 'classnames'
import { Link } from 'react-router-dom'
import styles from './SessionJoin.css'
import { NetworkState } from 'types/network'
import { ILobbySession } from 'renderer/platform/types'
import LayoutMain from 'renderer/components/layout/Main'
import { Icon } from 'renderer/components/Icon'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { TextInput, InputGroup } from './common/input'

interface IProps {
  connect: (sessionId: string) => void
}

export class SessionJoin extends Component<IProps> {
  private sessionInput: HTMLInputElement | null = null

  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <Link to="/" className={cx('link', styles.goBack)}>
          <Icon name="arrow-left" />
          Go back
        </Link>
        <section>
          <header className={styles.header}>
            <div className={styles.left}>
              <h1>Join Session</h1>
            </div>
          </header>
          <form>
            <p>Enter a 64-character friend code.</p>
            <InputGroup>
              <TextInput
                theRef={el => (this.sessionInput = el)}
                className={styles.peerId}
                placeholder="Friend code"
                defaultValue={localStorage.getItem('prevFriendCode') || undefined}
                spellCheck={false}
                autoFocus
                required
              />
              <MenuButton
                icon="globe"
                size="medium"
                onClick={() => {
                  const valid = this.sessionInput!.checkValidity()
                  if (valid) {
                    const value = this.sessionInput!.value
                    localStorage.setItem('prevFriendCode', value)
                    this.props.connect(value)
                  } else {
                    this.sessionInput!.classList.add('invalid')
                  }
                }}
              >
                Join
              </MenuButton>
            </InputGroup>
          </form>
        </section>
      </LayoutMain>
    )
  }
}
