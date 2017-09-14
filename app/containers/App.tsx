import React, { Component, Children } from 'react';

interface IProps {
  children?: React.ReactNode;
}

export default class App extends Component<IProps> {
  render() {
    return <div className="app">{this.props.children}</div>;
  }
}
