import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { IReactReduxProps } from 'types/redux'

import { SessionJoin } from '../components/SessionJoin'
import { push } from 'react-router-redux'

interface IProps extends RouteComponentProps<void> {}

type PrivateProps = IProps & IReactReduxProps

class _SessionJoinPage extends Component<PrivateProps> {
  render() {
    return <SessionJoin connect={this.connect} />
  }

  private connect = (sessionId: string) => {
    console.debug(`Connecting to ${sessionId}`)
    this.props.dispatch!(push(`/lobby/${sessionId}`))
  }
}

export const SessionJoinPage = connect()(_SessionJoinPage) as React.ComponentClass<IProps>
