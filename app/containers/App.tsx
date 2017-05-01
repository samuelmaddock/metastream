import React, { Component, Children } from 'react';

export default class App extends Component {
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
