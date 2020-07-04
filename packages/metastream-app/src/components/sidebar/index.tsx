import * as React from 'react'
import cx from 'classnames'
import { Chat } from 'components/chat'
import styles from './Sidebar.css'
import { UserList } from 'components/lobby/UserList'
import { dispatchExtensionMessage } from 'utils/extension'
import { useDispatch } from 'react-redux'
import { setLobbyModal } from 'actions/ui'
import { LobbyModal } from 'reducers/ui'
import { MediaList } from 'components/lobby/MediaList'
import { PanelHeader } from 'components/lobby/PanelHeader'
import { ChatLayoutButton } from 'components/chat/ChatLayoutButton'
import { t } from 'locale'

interface Props {
  className?: string
  popup?: boolean
}

export const Sidebar: React.SFC<Props> = ({ className, popup }) => {
  const dispatch = useDispatch()
  return (
    <div className={cx(className, styles.container)}>
      <UserList
        className={styles.list}
        onInvite={() => {
          dispatchExtensionMessage('metastream-focus')
          dispatch(setLobbyModal(LobbyModal.SessionSettings))
        }}
      />
      <MediaList
        className={styles.list}
        onOpenMediaBrowser={() => {
          dispatchExtensionMessage('metastream-focus')
          dispatch(setLobbyModal(LobbyModal.Browser))
        }}
        onShowInfo={() => {
          dispatchExtensionMessage('metastream-focus')
          dispatch(setLobbyModal(LobbyModal.MediaInfo))
        }}
      />
      <PanelHeader title={t('chat')} action={popup ? null : <ChatLayoutButton />} />
      <Chat className={styles.chat} showDockOption={false} />
    </div>
  )
}
