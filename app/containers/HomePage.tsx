import React, { Component } from 'react';
import Home from '../components/Home';
import { RouteComponentProps } from "react-router";
import { IReactReduxProps } from "types/redux";
import { connect } from "react-redux";

interface IProps extends RouteComponentProps<any> {
}

type PrivateProps = IProps & IReactReduxProps;

class _HomePage extends Component<PrivateProps> {
  render() {
    return (
      <Home />
    );
  }
}

export const HomePage = connect()(_HomePage);
