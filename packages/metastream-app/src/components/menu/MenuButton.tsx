import React, { ReactNode } from 'react'
import cx from 'classnames'

import { Icon } from 'components/Icon'
import styles from './MenuButton.css'
import { Link } from 'react-router-dom'

interface IProps {
  id?: string
  children?: ReactNode
  className?: string
  icon?: string
  component?: React.ComponentClass<any, any> | React.FunctionComponent<any> | string
  onClick?: () => void
  size?: 'medium' | 'large'
  to?: string
  href?: string
}

export const MenuButton: React.SFC<IProps> = ({
  children,
  className,
  component,
  icon,
  size,
  to,
  ...rest
}: IProps) => {
  const isLink = Boolean(to)
  const componentType = component || (isLink && Link) || 'button'

  return React.createElement(
    componentType,
    {
      className: cx(className, styles[size || 'large']),
      type: isLink ? undefined : 'button',
      to,
      ...rest
    },
    <>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </>
  )
}
