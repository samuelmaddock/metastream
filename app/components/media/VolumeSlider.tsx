import React, { Component } from 'react';
import { clamp } from 'utils/math';
import { Slider } from 'components/media/Slider';

import styles from './VolumeSlider.css';
import { Icon } from 'components/Icon';
import { Ticker } from 'components/Ticker';

const enum VolumeLevel {
  Mute = -1,
  None,
  Low,
  High
}

interface IProps {
  volume: number;
  onChange?: (volume: number) => void;
}

interface IState {
  level: VolumeLevel;
  dragging?: boolean;
}

export class VolumeSlider extends Component<IProps> {
  state: IState = { level: this.calcLevel() };

  private slider: Slider | null;

  private calcLevel(): VolumeLevel {
    let volume;

    if (this.slider) {
      const { dragProgress } = this.slider.state;
      volume = dragProgress!;
    } else {
      volume = this.props.volume;
    }

    return Math.ceil(volume * VolumeLevel.High);
  }

  private tick = () => {
    this.setState({ level: this.calcLevel() });
  };

  render(): JSX.Element | null {
    const { level } = this.state;
    const icon = level === VolumeLevel.Mute ? 'volume-x' : `volume-${level}`;

    return (
      <div className={styles.container}>
        <Icon name={icon} />
        <Slider
          ref={el => {
            this.slider = el;
          }}
          className={styles.slider}
          value={this.props.volume}
          onChange={this.props.onChange}
          onDragStart={() => {
            this.setState({ dragging: true });
          }}
          onDragEnd={() => {
            this.setState({ dragging: false });
          }}
        />
        <Ticker onTick={this.tick} disabled={!this.state.dragging} />
      </div>
    );
  }
}
