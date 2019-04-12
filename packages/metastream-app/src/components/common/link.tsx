import React from 'react'

interface IExternalLinkProps {
  href: string
  className?: string
}

export const ExternalLink: React.SFC<IExternalLinkProps> = props => {
  return (
    <a href={props.href} className={props.className} target="_blank">
      {props.children}
    </a>
  )
}
