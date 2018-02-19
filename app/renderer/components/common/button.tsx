import React from 'react'
import * as cx from 'classnames'
import styles from './button.css'
import { Icon } from 'renderer/components/Icon'

export interface IIconButtonProps {
  icon: string
  title?: string

  /** Disable button interaction */
  disabled?: boolean

  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const nbsp = '\u00A0'

export const IconButton: React.SFC<IIconButtonProps> = props => {
  return (
    <button
      type="button"
      disabled={props.disabled}
      className={props.className}
      title={props.title}
      onClick={props.onClick}
    >
      <Icon name={props.icon} />
      {!!props.children && nbsp}
      {props.children}
    </button>
  )
}

export const HighlightButton: React.SFC<IIconButtonProps> = props => {
  return <IconButton {...props} className={cx(props.className, styles.highlightBtn)} />
}
