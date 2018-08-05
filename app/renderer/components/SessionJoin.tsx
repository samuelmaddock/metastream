import React, { Component } from 'react'
import styles from './SessionJoin.css'
import LayoutMain from 'renderer/components/layout/Main'
import { MenuButton } from 'renderer/components/menu/MenuButton'
import { TextInput, InputGroup } from './common/input'
import { MenuHeader } from './menu/MenuHeader'
import { t } from '../../locale/index'

interface IProps {
  connect: (sessionId: string) => void
}

export class SessionJoin extends Component<IProps> {
  private sessionInput: HTMLInputElement | null = null

  render(): JSX.Element | null {
    return (
      <LayoutMain className={styles.container}>
        <section>
          <MenuHeader text={t('joinSession')} />
          <form onSubmit={e => e.preventDefault()}>
            <p>{t('enterJoinDest')}</p>
            <InputGroup>
              <TextInput
                theRef={el => (this.sessionInput = el)}
                className={styles.peerId}
                placeholder={t('friendCode')}
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
                {t('join')}
              </MenuButton>
            </InputGroup>
          </form>
        </section>
      </LayoutMain>
    )
  }
}
