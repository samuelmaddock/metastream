import React, { Component, ReactNode } from 'react'

interface IProps {
  cacheKey: string
  href: string
  children: (data: any) => ReactNode
}

interface IState {
  data?: any
}

export class Fetch extends Component<IProps, IState> {
  state: IState = {
    data: this.getCachedData()
  }

  private getCachedData() {
    const data = sessionStorage.getItem(this.props.cacheKey)
    if (!data) return
    let res
    try {
      res = JSON.parse(data)
    } catch {}
    return res
  }

  private async fetchData() {
    let data = null
    try {
      const resp = await fetch(this.props.href)
      const contentType = resp.headers.get('Content-Type') || ''
      const content = await (contentType.indexOf('application/json') > -1
        ? resp.json()
        : resp.text())
      if (resp.ok) {
        data = content
        sessionStorage.setItem(this.props.cacheKey, JSON.stringify(content))
      }
    } catch {}
    this.setState({ data })
  }

  componentDidMount() {
    if (!this.state.data) {
      this.fetchData()
    }
  }

  render() {
    const { children } = this.props
    const { data } = this.state

    if (typeof children === 'function') {
      return children(data)
    }

    return null
  }
}
