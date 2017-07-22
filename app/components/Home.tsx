import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';

interface IProps {
}

export default class Home extends Component<IProps> {
  render() {
    return (
      <div className={styles.container} data-tid="container">
        <h1>Home</h1>
        <ul>
          <li><Link to="/servers">Server browser</Link></li>
          <li><Link to="/lobby/dev">Join dev lobby</Link></li>
          <li><Link to="/lobby/dev?owner">Create dev lobby</Link></li>
          <li><Link to="/mptest">Multiplayer Test</Link></li>
        </ul>
      </div>
    );
  }
}
