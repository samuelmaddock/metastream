import React from 'react'
import styles from './Key.css'

export const Key: React.SFC<{}> = () => (
  <span className={styles.key}>
    <span className={styles.keyCap}>Enter</span>
  </span>
)
