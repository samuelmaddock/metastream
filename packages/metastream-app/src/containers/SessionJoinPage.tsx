import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'

import { SessionJoin } from '../components/SessionJoin'
import { push } from 'react-router-redux'
import { IReactReduxProps } from 'types/redux-thunk'
import { formatSessionPath } from 'utils/network';

interface IProps extends RouteComponentProps<void> {}

type PrivateProps = IProps & IReactReduxProps

class _SessionJoinPage extends Component<PrivateProps> {
  render() {
    return <SessionJoin connect={this.connect} />
  }

  private connect = (uri: string) => {
    const path = formatSessionPath(uri)
    console.debug(`Connecting to ${path}`)
    this.props.dispatch(push(`/join/${path}`))
  }
}

export const SessionJoinPage = connect()(_SessionJoinPage) as React.ComponentClass<IProps>
