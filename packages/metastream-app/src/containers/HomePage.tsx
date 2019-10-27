import React, { Component } from 'react'
import Home from 'components/Home'
import { RouteComponentProps } from 'react-router'
import { connect } from 'react-redux'
import { IAppState } from '../reducers/index'
import { IReactReduxProps } from '../types/redux-thunk'
import { SHOW_INSTALL_PROMPT } from '../middleware/pwa'
import { Dispatch } from 'redux'
import { replace } from 'react-router-redux'
import { localUserId } from 'network'
import { setPendingMedia } from 'lobby/actions/mediaPlayer'

interface IProps extends RouteComponentProps<any> {}

interface IConnectedProps {
  pwaInstallReady?: boolean
  search?: string
}

interface DispatchProps {
  showInstallPrompt(): void
  setPendingMedia(url: string, time?: number): void
}

function mapStateToProps(state: IAppState): IConnectedProps {
  const { location } = state.router
  return {
    pwaInstallReady: state.ui.pwaInstallReady,
    search: location ? location.search : ''
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  showInstallPrompt() {
    dispatch({ type: SHOW_INSTALL_PROMPT })
  },
  setPendingMedia(url, time) {
    dispatch(setPendingMedia({ url, time }))
    dispatch(replace({ pathname: `/join/${localUserId()}`, search: '' }))
  }
})

type PrivateProps = IProps & IConnectedProps & DispatchProps & IReactReduxProps

class _HomePage extends Component<PrivateProps> {
  componentDidMount() {
    const params = new URLSearchParams(this.props.search)
    if (!params) return

    const url = params.get('url')
    const time = parseInt(params.get('t') || '', 10) || undefined

    if (url) {
      this.props.setPendingMedia(url, time)
    }
  }

  render() {
    return (
      <Home installable={!!this.props.pwaInstallReady} install={this.props.showInstallPrompt} />
    )
  }
}

export const HomePage = connect(
  mapStateToProps,
  mapDispatchToProps
)(_HomePage)
