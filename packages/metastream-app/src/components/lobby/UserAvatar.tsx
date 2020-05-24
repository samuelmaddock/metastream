import React, { SFC, useState, useEffect } from 'react'
import cx from 'classnames'
import { assetUrl } from 'utils/appUrl'
import styles from './UserAvatar.css'
import { useAppContext } from 'appContext'

interface Props {
  className?: string
  avatar?: string
  badge?: string

  selected?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export const UserAvatar: SFC<Props> = ({ className, avatar, badge, selected, onClick }) => {
  const { avatarRegistry } = useAppContext()
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>()

  function requestAvatar(avatarUri?: string) {
    let src: string | undefined
    try {
      src = avatarUri && avatarRegistry.resolve(avatarUri)
    } catch {}
    if (!src) return
    let img = new Image()
    img.onload = () => setAvatarSrc(src)
    img.src = src
  }

  useEffect(() => {
    if (avatar) {
      requestAvatar(avatar)
    }
  }, [avatar])

  const children = (
    <>
      <img className={styles.image} src={avatarSrc || assetUrl('avatars/default.svg')} alt="" />
      {badge && <img className={styles.badge} src={badge} alt="" />}
    </>
  )

  return React.createElement(
    onClick ? 'button' : 'div',
    {
      className: cx(className, styles.container, {
        [styles.selected]: selected
      }),
      onClick
    },
    children
  )
}
