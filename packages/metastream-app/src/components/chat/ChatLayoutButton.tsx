import * as React from 'react'
import styles from './PanelHeader.css'
import { useDispatch, useSelector } from 'react-redux'
import { setSetting } from 'actions/settings'
import { ChatLocation } from './Location'
import { IAppState } from 'reducers'
import { t } from 'locale'
import { IconButton } from 'components/common/button'

interface Props {
  className?: string
}

export const ChatLayoutButton: React.SFC<Props> = ({ className }) => {
  const dispatch = useDispatch()

  const chatLocation = useSelector<IAppState>(state => state.settings.chatLocation)
  const isFloating = chatLocation === ChatLocation.FloatLeft

  function toggleChatLayout() {
    dispatch(
      setSetting('chatLocation', location =>
        location === ChatLocation.DockRight ? ChatLocation.FloatLeft : ChatLocation.DockRight
      )
    )
  }

  return (
    <IconButton
      icon={isFloating ? 'dock-right' : 'undock-float'}
      iconSize="small"
      className={className}
      onClick={toggleChatLayout}
      title={t(isFloating ? 'uiDockToRight' : 'uiUndock')}
    />
  )
}
