import React, { Component } from 'react'
import { DispatchProp, connect } from 'react-redux'
import cx from 'classnames'
import styles from './Connect.css'
import { TitleBar } from '../TitleBar'
import { IAppState } from '../../reducers/index'
import { MenuButton } from '../menu/MenuButton'
import { Icon } from '../Icon'
import { Spinner } from '../common/spinner'
import { t } from '../../../locale/index'

interface IProps {
  className?: string
  onCancel: () => void
}

type PrivateProps = IProps & DispatchProp<IAppState>

class _Connect extends Component<PrivateProps> {
  render(): JSX.Element {
    return (
      <div className={styles.container}>
        <TitleBar className={styles.titlebar} />

        <p className={styles.info}>
          <Spinner />
          {t('connecting')}&hellip;
        </p>
        <MenuButton icon="x" size="medium" onClick={() => this.props.onCancel()}>
          {t('cancel')}
        </MenuButton>
      </div>
    )
  }
}

export const Connect = connect()(_Connect) as React.ComponentClass<IProps>
