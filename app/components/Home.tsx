import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';

interface IProps {}

export default class Home extends Component<IProps> {
  render() {
    return (
      <div className={styles.container} data-tid="container">
        <h1>Home</h1>
        <ul>
          <li>
            <Link to="/servers">Server browser</Link>
          </li>
        </ul>
      </div>
    );
  }
}
