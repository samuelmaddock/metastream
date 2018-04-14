import React from 'react'
import { openInBrowser } from '../../../utils/url'

interface IExternalLinkProps {
  href: string
}

export const ExternalLink: React.SFC<IExternalLinkProps> = props => {
  return (
    <a
      href="#"
      onClick={e => {
        e.preventDefault()
        openInBrowser(props.href)
      }}
    >
      {props.children}
    </a>
  )
}
