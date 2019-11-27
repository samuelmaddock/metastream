import React, { ReactNode } from 'react'
import cx from 'classnames'

import styles from './MenuHeader.css'

interface IProps {
  className?: string
  text: ReactNode
}

export const MenuHeader: React.SFC<IProps> = props => {
  return (
    <header className={cx(props.className, styles.header)}>
      <h1>{props.text}</h1>
      {props.children && <div>{props.children}</div>}
    </header>
  )
}
