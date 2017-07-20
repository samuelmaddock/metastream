import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';

export default class Home extends Component<{},{}> {
  render() {
    return (
      <div className={styles.container} data-tid="container">
        <h1>Home</h1>
        <ul>
          <li><Link to="/servers">Server browser</Link></li>
          <li><Link to="/lobby/dev">Dev lobby</Link></li>
        </ul>
      </div>
    );
  }
}
