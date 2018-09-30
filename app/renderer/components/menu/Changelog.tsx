import React, { Component } from 'react'
import { VERSION } from 'constants/app'
import { Spinner } from '../common/spinner'
import * as marked from 'marked'

import styles from './Changelog.css'
import { ExternalLink } from '../common/link'

interface IProps {}

interface IState {
  data?: any
}

export class Changelog extends Component<IProps, IState> {
  state: IState = {
    data: this.getCachedReleaseInfo()
  }

  private getCachedReleaseInfo() {
    const data = sessionStorage.getItem('releaseInfo')
    if (!data) return
    let res
    try {
      res = JSON.parse(data)
    } catch {}
    return res
  }

  private async fetchReleaseInfo() {
    let data = null
    const url = `https://api.github.com/repos/samuelmaddock/metastream/releases/tags/v${VERSION}`
    try {
      const resp = await fetch(url)
      const json = await resp.json()
      if (resp.ok) {
        data = json
        sessionStorage.setItem('releaseInfo', JSON.stringify(json))
      } else {
        data = json.message || null
      }
    } catch {}
    this.setState({ data })
  }

  componentDidMount() {
    if (!this.state.data) {
      this.fetchReleaseInfo()
    }
  }

  render() {
    const { data } = this.state

    if (typeof data === 'undefined') {
      return <Spinner />
    } else if (typeof data === 'string') {
      return data
    }

    return (
      <div>
        {data.published_at && <div>{data.published_at}</div>}
        {data.html_url && (
          <p>
            <ExternalLink href={data.html_url}>View on GitHub</ExternalLink>
          </p>
        )}
        {data.body && this.renderMarkdown(data.body)}
      </div>
    )
  }

  private renderMarkdown(str: string) {
    const html = marked(str, { gfm: true })

    return <div className={styles['markdown-body']} dangerouslySetInnerHTML={{ __html: html }} />
  }
}
