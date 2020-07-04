import * as React from 'react'
import styles from './PanelHeader.css'

interface Props {
  title?: string
  tagline?: string
  action?: React.ReactNode
}

export const PanelHeader: React.SFC<Props> = ({ title, tagline, action }) => {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {tagline && <span className={styles.tagline}>{tagline}</span>}
      <div className={styles.actions}>{action}</div>
    </header>
  )
}
