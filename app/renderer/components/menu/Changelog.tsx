import React, { Component } from 'react'
import { VERSION } from 'constants/app'
import { Spinner } from '../common/spinner'

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

    // return JSON.stringify(data, null, '  ')
    return data.body
  }
}
