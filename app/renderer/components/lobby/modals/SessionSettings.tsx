import React, { Component, ChangeEvent } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'

import styles from './SessionSettings.css'
import { IAppState } from 'renderer/reducers'
import { getHostId, isHost, getHost, getNumUsers } from 'renderer/lobby/reducers/users.helpers'
import { USERS_MAX } from 'constants/settings'
import { t } from 'locale'
import { HighlightButton } from '../../common/button'
import { ISettingsState, SessionMode } from '../../../reducers/settings'
import { setSetting } from '../../../actions/settings'

import Button from 'material-ui/Button'
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from 'material-ui/Dialog'
import { IReactReduxProps } from 'types/redux-thunk'
import { Dropdown } from 'renderer/components/settings/controls';
import { setSessionData } from 'renderer/lobby/actions/session';
import { getMaxUsers } from 'renderer/lobby/reducers/session';

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
        {this.renderUserOpts()}
        {this.renderSessionMode()}
        {this.renderSessionModeDialog()}
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
      <div className={styles.sessionMode}>
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
        {selectedMode && <p>{selectedMode.desc}</p>}
      </div>
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
    if (this.props.settings.sessionMode === SessionMode.Offline) {
      return false
    }

    const dispatch = this.props.dispatch!
    const userOpts: JSX.Element[] = []

    const updateMaxUsers = (ev: ChangeEvent<{ children: React.ReactNode }>) => {
      const newValue = (ev.currentTarget as HTMLSelectElement).value
      dispatch(setSessionData({ maxUsers: parseInt(newValue) }))
    }

    const addOption = (opt: number, customLbl: string | null) => {
      const element = <option key={opt} value={opt} selected={opt === this.props.maxUsers}>
        {customLbl || `${opt} ${t('users')}`}
      </option>

      userOpts.push(element)
    }

    for (let i = 2; i <= USERS_MAX; i = i << 1) {
      addOption(i, null)
    }
    addOption(Infinity, t('unlimitedUsers'))

    return (
      <>
        <h4>{t('maxUsers')}</h4>
        <Dropdown className={styles.maxUsers} onChange={updateMaxUsers}>
          {userOpts}
        </Dropdown>
      </>
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
      maxUsers: getMaxUsers(state),
      settings: state.settings
    }
  }
)(SessionSettings) as React.ComponentClass<IProps>
