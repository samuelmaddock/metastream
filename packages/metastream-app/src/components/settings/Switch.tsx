import React from 'react'
import cx from 'classnames'
import styles from './Switch.css'

interface ISwitchProps {
  id: string
  className?: string
  defaultChecked?: boolean
  onChange: (val: boolean) => void
}

export const Switch: React.SFC<ISwitchProps> = props => (
  <div className={props.className}>
    <input
      id={props.id}
      type="checkbox"
      className={cx(styles.tgl, styles['tgl-light'])}
      defaultChecked={props.defaultChecked}
      onChange={e => {
        if (e.target instanceof HTMLInputElement) {
          props.onChange(e.target.checked)
        }
      }}
    />
    <label className={styles['tgl-btn']} htmlFor={props.id} />
  </div>
)
