import React from 'react'
import { Link } from 'react-router-dom'

import { Icon } from 'renderer/components/Icon'
import styles from './MenuHeader.css'

interface IProps {
  text: string
}

export const MenuHeader: React.SFC<IProps> = props => {
  return (
    <header className={styles.header}>
      <h1>{props.text}</h1>
      <div>{props.children}</div>
    </header>
  )
}
