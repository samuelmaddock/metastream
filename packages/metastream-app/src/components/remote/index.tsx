import * as React from 'react'
import { Chat } from 'components/chat'
import styles from './Remote.css'
import { UserList } from 'components/lobby/UserList'
import { dispatchExtensionMessage } from 'utils/extension'
import { useDispatch } from 'react-redux'
import { setLobbyModal } from 'actions/ui'
import { LobbyModal } from 'reducers/ui'

export const Remote: React.SFC = () => {
  const dispatch = useDispatch()
  return (
    <div id="app" className={styles.remote}>
      <UserList
        className={styles.users}
        onInvite={() => {
          dispatchExtensionMessage('metastream-focus')
          dispatch(setLobbyModal(LobbyModal.SessionSettings))
        }}
      />
      <Chat className={styles.chat} showDockOption={false} />
    </div>
  )
}
