import React from 'react'
import cx from 'classnames'
import styles from './button.css'
import { Icon } from 'components/Icon'
import Tooltip, { TooltipProps } from '@material-ui/core/Tooltip'

export interface IIconButtonProps {
  id?: string
  icon: string
  iconSize?: 'small'
  highlight?: boolean

  title?: React.ReactNode
  tooltipProps?: TooltipProps

  /** Disable button interaction */
  disabled?: boolean

  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>
}

const nbsp = '\u00A0'

export const IconButton: React.SFC<IIconButtonProps> = ({
  icon,
  iconSize,
  title,
  tooltipProps,
  children,
  highlight,
  ...props
}) => {
  return (
    <button
      type="button"
      className={cx(styles.iconButton, props.className, {
        [styles.iconHighlight]: highlight
      })}
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
        <Tooltip {...tooltipProps} title={title}>
          <div className={styles.tooltip} />
        </Tooltip>
      ) : null}
      <Icon name={icon} size={iconSize} pointerEvents="none" />
      {!!children && nbsp}
      {children ? <span className={styles.iconChildren}>{children}</span> : undefined}
    </button>
  )
}

interface IHighlightButtonProps extends IIconButtonProps {
  highlight?: boolean
  glass?: boolean
  blend?: boolean
  size?: 'medium' | 'large'
}

export const HighlightButton: React.SFC<IHighlightButtonProps> = ({
  highlight,
  glass,
  blend,
  size,
  ...props
}) => {
  const className = cx(props.className, styles.highlightBtn, styles[size || 'small'], {
    [styles.highlight]: highlight,
    [styles.outline]: !highlight,
    [styles.glass]: glass,
    [styles.blend]: blend
  })
  return <IconButton {...props} className={className} />
}
