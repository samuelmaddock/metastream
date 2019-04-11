import React, { Component } from 'react'
import { connect } from 'react-redux'
import styles from './Connect.css'
import { TitleBar } from '../TitleBar'
import { MenuButton } from '../menu/MenuButton'
import { Spinner } from '../common/spinner'
import { t } from 'locale'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps {
  className?: string
  status?: string
  onCancel: () => void
}

type PrivateProps = IProps & IReactReduxProps

class _Connect extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={styles.container}>
        <TitleBar className={styles.titlebar} />

        <p className={styles.info}>
          <Spinner />
          {`${this.props.status || t('connecting')}…`}
        </p>
        <MenuButton icon="x" size="medium" onClick={() => this.props.onCancel()}>
          {t('cancel')}
        </MenuButton>
      </div>
    )
  }
}

export const Connect = connect()(_Connect) as React.ComponentClass<IProps>
