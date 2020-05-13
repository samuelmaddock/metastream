import React, { SFC, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import styles from '../SettingsMenu.css'
import { TextInput } from 'components/common/input'
import { IAppState } from 'reducers'
import { getLocalUsername, getLocalColor, getLocalAvatar } from 'reducers/settings'
import { USERNAME_MAX_LEN } from 'constants/settings'
import { setUsername, setColor } from 'actions/settings'
import { t } from 'locale'
import { AvatarRegistry } from '../../../services/avatar'
import { UserAvatar } from '../../lobby/UserAvatar'
import { ExternalLink } from 'components/common/link'
import { Trans } from 'react-i18next'
import { SettingsProps } from '../types'
import { server_updateUser } from '../../../lobby/actions/users'
import { IReactReduxProps } from '../../../types/redux-thunk'
import Tooltip from '@material-ui/core/Tooltip'
import { MetastreamUserTier, AccountService } from 'account/account'
import { usePatronTier } from 'account/hooks'
import { LogoutButton } from 'components/account/buttons'

interface IProps extends SettingsProps {}

interface IConnectedProps {
  avatar?: string
  username: string
  color: string
}

type Props = IProps & IConnectedProps & IReactReduxProps

const ProfileSettings: SFC<Props> = props => {
  const propsRef = useRef<Props>(props)
  const dirtyRef = useRef<boolean>(false)
  const usernameInputRef = useRef<HTMLInputElement | null>(null)

  const tier = usePatronTier()
  const tierRef = useRef<MetastreamUserTier>(tier)

  useEffect(
    function onTierChange() {
      if (tier !== tierRef.current) {
        // update color on exit
        dirtyRef.current = true

        tierRef.current = tier
      }
    },
    [tier]
  )

  useEffect(
    function saveProps() {
      propsRef.current = props
    },
    [props]
  )
  useEffect(() => {
    return function componentWillUnmount() {
      const { current: props } = propsRef
      if (dirtyRef.current) {
        props.dispatch(
          server_updateUser({
            name: props.username,
            color: props.color,
            avatar: props.avatar
          })
        )
      }
    }
  }, [])

  // TODO: debounce
  const onChangeUsername = () => {
    const username = usernameInputRef.current && usernameInputRef.current.value
    if (!username) return

    if (username !== props.username) {
      props.dispatch(setUsername(username))
      dirtyRef.current = true
    }
  }

  const selectedAvatar = props.avatar ? AvatarRegistry.getInstance().getByURI(props.avatar) : null
  const hasArtist = selectedAvatar ? !!selectedAvatar.artist : false
  const hasPledged = tier > MetastreamUserTier.None

  return (
    <section className={styles.section}>
      <label>{t('avatar')}</label>
      <div className={styles.avatarContainer}>
        <div className={styles.avatarList}>
          {AvatarRegistry.getInstance()
            .getAll()
            .map((avatar, idx) => (
              <UserAvatar
                key={idx}
                avatar={avatar.uri}
                selected={avatar.uri === props.avatar}
                onClick={() => {
                  props.setSetting('avatar', avatar.uri)
                  dirtyRef.current = true
                  ga('event', {
                    ec: 'settings',
                    ea: 'select_avatar',
                    el: avatar.pii ? avatar.type : avatar.uri
                  })
                }}
              />
            ))}
        </div>
        {hasArtist && (
          <div className={styles.small}>
            {/* prettier-ignore */}
            <Trans i18nKey="avatarCredit" values={{ artist: selectedAvatar!.artist }}>
              <span className={styles.blend}>Selected avatar art by</span>
              {selectedAvatar!.href ? (
                <ExternalLink href={selectedAvatar!.href!} className="link-alt">Unknown</ExternalLink>
              ) : (
                <span className={styles.blend}>Unknown</span>
              )}
            </Trans>
          </div>
        )}
      </div>

      <label htmlFor="profile_username">{t('displayName')}</label>
      <TextInput
        id="profile_username"
        theRef={e => (usernameInputRef.current = e)}
        defaultValue={props.username}
        maxLength={USERNAME_MAX_LEN}
        onChange={onChangeUsername}
        onBlur={e => {
          if (usernameInputRef.current) {
            usernameInputRef.current.value = props.username
          }
        }}
      />

      <label htmlFor="profile_color">{t('chatColor')}</label>
      <Tooltip
        title={t('patreonPledgeRequired')}
        placement="right"
        disableHoverListener={hasPledged}
        disableFocusListener={hasPledged}
        disableTouchListener={hasPledged}
      >
        <input
          disabled={!hasPledged}
          id="profile_color"
          type="color"
          className={styles.colorSwatch}
          defaultValue={props.color}
          onChange={e => {
            props.dispatch(setColor(e.target!.value))
            dirtyRef.current = true
          }}
        />
      </Tooltip>

      {hasPledged && (
        <div>
          <LogoutButton onClick={() => AccountService.get().logout()} />
        </div>
      )}
    </section>
  )
}

export default connect(
  (state: IAppState): IConnectedProps => {
    return {
      avatar: getLocalAvatar(state),
      username: getLocalUsername(state),
      color: getLocalColor(state)
    }
  }
)(ProfileSettings)
