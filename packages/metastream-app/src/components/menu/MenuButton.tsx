import React, { ReactNode } from 'react'
import cx from 'classnames'

import { Icon } from 'components/Icon'
import styles from './MenuButton.css'

interface IProps {
  children?: ReactNode
  className?: string
  icon?: string
  onClick?: () => void
  size?: 'medium' | 'large'
}

export const MenuButton: React.SFC<IProps> = (props: IProps) => {
  return (
    <button
      type="button"
      className={cx(props.className, styles[props.size || 'large'])}
      onClick={props.onClick}
    >
      {props.icon && <Icon name={props.icon} />}
      <span>{props.children}</span>
    </button>
  )
}
