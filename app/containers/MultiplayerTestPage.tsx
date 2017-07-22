import React, { Component } from 'react';
import Home from '../components/Home';
import { RouteComponentProps } from "react-router";
import { IReactReduxProps } from "types/redux";
import { connect } from "react-redux";
import { createLobby } from "actions/lobby";

interface IProps extends RouteComponentProps<any> {
}

type PrivateProps = IProps & IReactReduxProps;

class _MultiplayerTestPage extends Component<PrivateProps> {
  render() {
    return (
      <div>
        <webview src="file:///D:/tv/app/app.html#/"
          style={{position: 'fixed', top: 0, bottom: '50%', left: 0, right: 0}} />
        <webview src="https://www.google.com/"
          style={{position: 'fixed', top: '50%', bottom: 0, left: 0, right: 0}} />
      </div>
    );
  }
}

export const MultiplayerTestPage = connect()(_MultiplayerTestPage);
