import React from 'react'
import * as cx from 'classnames'
import styles from './button.css'
import { Icon } from 'renderer/components/Icon'
import Tooltip from 'material-ui/Tooltip'

export interface IIconButtonProps {
  icon: string
  title?: string
  size?: 'medium' | 'large'

  /** Disable button interaction */
  disabled?: boolean

  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>
}

const nbsp = '\u00A0'

export const IconButton: React.SFC<IIconButtonProps> = ({ title, icon, children, ...props }) => {
  return (
    <button
      type="button"
      style={
        title
          ? {
              position: 'relative'
            }
          : undefined
      }
      {...props}
    >
      {title ? (
        <Tooltip title={title}>
          <div className={styles.tooltip} />
        </Tooltip>
      ) : null}
      <Icon name={icon} />
      {!!children && nbsp}
      {children ? <span>{children}</span> : undefined}
    </button>
  )
}

interface IHighlightButtonProps extends IIconButtonProps {
  highlight?: boolean
  glass?: boolean
  blend?: boolean
}

export const HighlightButton: React.SFC<IHighlightButtonProps> = props => {
  const className = cx(props.className, styles.highlightBtn, styles[props.size || 'small'], {
    [styles.highlight]: props.highlight,
    [styles.outline]: !props.highlight,
    [styles.glass]: props.glass,
    [styles.blend]: props.blend
  })
  return <IconButton {...props} className={className} />
}
