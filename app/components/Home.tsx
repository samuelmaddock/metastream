import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';
import { TitleBar } from 'components/TitleBar';
import LayoutMain from 'components/layout/Main';

interface IProps {}

export default class Home extends Component<IProps> {
  render() {
    return (
      <LayoutMain className={styles.container}>
        <h1>Home</h1>
        <ul>
          <li>
            <Link to="/servers">Server browser</Link>
          </li>
        </ul>
      </LayoutMain>
    );
  }
}
