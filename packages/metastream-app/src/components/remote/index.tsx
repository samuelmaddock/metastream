import * as React from 'react'
import styles from './Remote.css'
import { Sidebar } from 'components/sidebar'

export const Remote: React.SFC = () => {
  return (
    <div id="app" className={styles.remote}>
      <Sidebar popup />
    </div>
  )
}
