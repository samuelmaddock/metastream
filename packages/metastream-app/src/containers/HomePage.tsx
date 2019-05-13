import React, { Component } from 'react'
import Home from 'components/Home'
import { RouteComponentProps } from 'react-router'
import { connect } from 'react-redux'
import { IAppState } from '../reducers/index'
import { IReactReduxProps } from '../types/redux-thunk'
import { SHOW_INSTALL_PROMPT } from '../middleware/pwa'

interface IProps extends RouteComponentProps<any> {}

interface IConnectedProps {
  pwaInstallReady?: boolean
}

function mapStateToProps(state: IAppState): IConnectedProps {
  return {
    pwaInstallReady: state.ui.pwaInstallReady
  }
}

type PrivateProps = IProps & IConnectedProps & IReactReduxProps

class _HomePage extends Component<PrivateProps> {
  render() {
    return (
      <Home
        installable={!!this.props.pwaInstallReady}
        install={() => {
          this.props.dispatch({ type: SHOW_INSTALL_PROMPT })
        }}
      />
    )
  }
}

export const HomePage = connect(mapStateToProps)(_HomePage)
