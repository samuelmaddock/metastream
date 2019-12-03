import React, { Component } from 'react'
import { UpdateService } from '../services/updater'
import { connect } from 'react-redux'
import { IReactReduxProps } from '../types/redux-thunk'
import { setUpdateState } from '../actions/ui'

type Props = IReactReduxProps

class App extends Component<Props> {
  componentDidMount() {
    UpdateService.getInstance().on('update', this.onUpdate)
    UpdateService.getInstance().checkForUpdate(3000)
  }

  componentWillUnmount() {
    UpdateService.getInstance().removeListener('update', this.onUpdate)
  }

  private onUpdate = () => {
    this.props.dispatch(setUpdateState(true))
  }

  render() {
    return <div className="app">{this.props.children}</div>
  }
}

export default connect()(App)
