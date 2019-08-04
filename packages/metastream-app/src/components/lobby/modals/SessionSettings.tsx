import React, { Component, ChangeEvent } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './SessionSettings.css'
import { IAppState } from 'reducers'
import { getHostId, isHost, getHost, getNumUsers } from 'lobby/reducers/users.helpers'
import { USERS_MAX, MAX_USERS_INFINITE } from 'constants/settings'
import { t } from 'locale'
import { HighlightButton } from '../../common/button'
import { ISettingsState, SessionMode } from '../../../reducers/settings'
import { setSetting } from 'actions/settings'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { IReactReduxProps } from 'types/redux-thunk'
import { Dropdown } from 'components/settings/controls'
import { setSessionData } from 'lobby/actions/session'
import { getMaxUsers } from 'lobby/reducers/session'

interface IProps {
  className?: string
  onClose?: () => void
}

interface IState {
  dismissed?: boolean
  sessionDialogOpen?: boolean
  selectedMode?: SessionMode
  previewMode?: SessionMode
}

interface IConnectedProps {
  isHost: boolean
  hostId: string
  hostName: string
  numUsers: number
  maxUsers: number
  settings: ISettingsState
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class SessionSettings extends Component<PrivateProps, IState> {
  state: IState = {}

  render(): JSX.Element {
    /*
        TODO:
        - password?
        - allow chat
        - Allow Direct IP [on/off]
        - Allow P2P [on/off]
        - ban management
        */
    return (
      <div className={cx(styles.container, this.props.className)}>
        {this.renderSessionMode()}
        {this.renderSessionModeDialog()}
        {this.renderUserOpts()}
      </div>
    )
  }

  private renderSessionMode() {
    const modes = [
      {
        mode: SessionMode.Public,
        label: t('public'),
        desc: t('sessionModePublicDescription'),
        icon: 'users',
        onClick: (mode: SessionMode) => dispatch(setSetting('sessionMode', mode))
      },
      {
        mode: SessionMode.Private,
        label: t('private'),
        desc: t('sessionModePrivateDescription'),
        icon: 'user-check',
        onClick: (mode: SessionMode) => dispatch(setSetting('sessionMode', mode))
      },
      {
        mode: SessionMode.Offline,
        label: t('offline'),
        desc: t('sessionModeOfflineDescription'),
        icon: 'user',
        onClick: (mode: SessionMode) => {
          if (this.props.numUsers > 1) {
            this.setState({ sessionDialogOpen: true, selectedMode: mode })
          } else {
            dispatch(setSetting('sessionMode', mode))
          }
        }
      }
    ]

    const dispatch = this.props.dispatch!
    const { sessionMode } = this.props.settings

    const previewMode =
      typeof this.state.previewMode === 'number' ? this.state.previewMode : sessionMode
    const selectedMode = modes.find(mode => mode.mode === previewMode)

    return (
      <p className={styles.sessionMode}>
        <label className={styles.label}>{t('sessionMode')}</label>
        {modes.map(mode => (
          <HighlightButton
            key={mode.label}
            icon={mode.icon}
            size="large"
            highlight={sessionMode === mode.mode}
            onClick={() => mode.onClick(mode.mode)}
            onMouseEnter={() => this.setState({ previewMode: mode.mode })}
            onMouseLeave={() => this.setState({ previewMode: undefined })}
          >
            {mode.label}
          </HighlightButton>
        ))}
        {selectedMode && <label className={styles.descLabel}>{selectedMode.desc}</label>}
      </p>
    )
  }

  private renderSessionModeDialog() {
    const onClose = (accept?: boolean) => {
      if (accept) {
        this.props.dispatch!(setSetting('sessionMode', this.state.selectedMode!))
      }
      this.setState({ sessionDialogOpen: false, selectedMode: undefined })
    }

    return (
      <Dialog
        open={!!this.state.sessionDialogOpen}
        onClose={() => onClose()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle>{t('endSessionTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('endSessionDescription')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>{t('cancel')}</Button>
          <Button onClick={() => onClose(true)} color="primary" autoFocus>
            {t('ok')}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  private renderUserOpts() {
    const dispatch = this.props.dispatch!
    const userOpts: JSX.Element[] = []

    const updateMaxUsers = (event: ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(event.currentTarget.value, 10)
      dispatch(setSessionData({ maxUsers: value }))
      dispatch(setSetting('maxUsers', value))
    }

    const addOption = (value: number, label?: string) => {
      const opt = (
        <option key={value} value={value} selected={value === this.props.maxUsers}>
          {label || `${value}`}
        </option>
      )

      userOpts.push(opt)
    }

    for (let i = 2; i <= USERS_MAX; i = i << 1) {
      addOption(i)
    }
    addOption(MAX_USERS_INFINITE, t('unlimited'))

    return (
      <p>
        <label htmlFor="maxusers" className={styles.label}>
          {t('maxUsers')}
        </label>
        <Dropdown
          id="maxusers"
          theme="secondary"
          onChange={updateMaxUsers}
          disabled={this.props.settings.sessionMode === SessionMode.Offline}
        >
          {userOpts}
        </Dropdown>
      </p>
    )
  }
}

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      isHost: isHost(state),
      hostId: getHostId(state),
      hostName: getHost(state).name,
      numUsers: getNumUsers(state),
      maxUsers: state.session.maxUsers,
      settings: state.settings
    }
  }
)(SessionSettings) as React.ComponentClass<IProps>
