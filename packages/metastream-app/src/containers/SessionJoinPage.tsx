import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'

import { SessionJoin } from '../components/SessionJoin'
import { push } from 'react-router-redux'
import { IReactReduxProps } from 'types/redux-thunk'

interface IProps extends RouteComponentProps<void> {}

type PrivateProps = IProps & IReactReduxProps

class _SessionJoinPage extends Component<PrivateProps> {
  render() {
    return <SessionJoin connect={this.connect} />
  }

  private connect = (sessionId: string) => {
    console.debug(`Connecting to ${sessionId}`)
    this.props.dispatch!(push(`/join/${sessionId}`))
  }
}

export const SessionJoinPage = connect()(_SessionJoinPage) as React.ComponentClass<IProps>
