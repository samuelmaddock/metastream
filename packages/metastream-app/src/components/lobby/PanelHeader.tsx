import * as React from 'react'
import styles from './PanelHeader.css'

interface Props {
  title?: string
  tagline?: string
  action?: React.ReactNode
  onTitleClick?: React.MouseEventHandler<HTMLButtonElement>
}

export const PanelHeader: React.SFC<Props> = ({ title, tagline, action, onTitleClick }) => {
  const clickable = typeof onTitleClick === 'function'
  const titleContainer = React.createElement(
    clickable ? 'button' : 'div',
    clickable
      ? { className: styles.titleContainer, type: 'button', onClick: onTitleClick }
      : { className: styles.titleContainer },
    <>
      <h2 className={styles.title}>{title}</h2>
      {tagline && <span className={styles.tagline}>{tagline}</span>}
    </>
  )

  return (
    <header className={styles.header}>
      {titleContainer}
      <div className={styles.actions}>{action}</div>
    </header>
  )
}
