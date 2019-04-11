import React, { Component } from 'react'
import Home from 'components/Home'
import { RouteComponentProps } from 'react-router'

interface IProps extends RouteComponentProps<any> {}

type PrivateProps = IProps

export class HomePage extends Component<PrivateProps> {
  render() {
    return <Home />
  }
}
