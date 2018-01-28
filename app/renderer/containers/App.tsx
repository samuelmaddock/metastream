import React, { Component, Children } from 'react'
import { connect, DispatchProp } from 'react-redux'
import { IAppState } from 'renderer/reducers'
import { listenForUiEvents } from 'renderer/actions/ui'

interface IProps {
  children?: React.ReactNode
}

class App extends Component<IProps & DispatchProp<IAppState>> {
  componentDidMount() {
    this.props.dispatch!(listenForUiEvents())
  }

  render() {
    return <div className="app">{this.props.children}</div>
  }
}

export default connect()(App)
