import React from 'react'
import { Switch } from './Switch'
import styles from './options.css'
import cx from 'classnames'

interface ISwitchOptionProps {
  inputId: string
  title: string
  description?: string
  checked: boolean
  onChange: (val: boolean) => void
  className?: string
  divider?: boolean
}

export const SwitchOption: React.SFC<ISwitchOptionProps> = props => {
  return (
    <div
      className={cx(props.className, styles.option, {
        [styles.divider]: typeof props.divider === 'undefined' ? true : false
      })}
    >
      <div className={styles.title}>{props.title}</div>
      <Switch
        id={props.inputId}
        className={styles.switchContainer}
        checked={props.checked}
        onChange={props.onChange}
      />
      {props.description && <div className={styles.description}>{props.description}</div>}
    </div>
  )
}

export const Dropdown: React.SFC<
  React.SelectHTMLAttributes<{}> & { theme?: 'primary' | 'secondary' }
> = ({ children, className, theme = 'primary', ...props }) => {
  return (
    <select className={cx(className, styles.dropdown, styles[`dropdown-${theme}`])} {...props}>
      {children}
    </select>
  )
}
