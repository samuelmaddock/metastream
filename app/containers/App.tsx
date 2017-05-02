import React, { Component, Children } from 'react';

interface IProps {
  children?: React.ReactNode;
}

export default class App extends Component<IProps,{}> {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
