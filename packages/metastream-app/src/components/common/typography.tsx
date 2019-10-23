import React from 'react'
import cx from 'classnames'
import styles from './typography.css'

interface TypographyProps {
  component?: React.ElementType
}

export const HighlightText = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} className={cx(props.className, styles.highlightText)}>
    {props.children}
  </span>
)

export const MediumText = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} className={cx(props.className, styles.mediumText)}>
    {props.children}
  </span>
)

export const DimLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} className={cx(props.className, styles.dimLink)}>
    {props.children}
  </a>
)

export const MonospaceText = ({ component, ...rest }: TypographyProps & any) =>
  React.createElement(
    component || 'span',
    { ...rest, className: cx(rest.className, styles.monospaceText) },
    rest.children
  )
