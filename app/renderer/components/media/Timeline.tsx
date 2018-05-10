import React, { PureComponent } from 'react'
import cx from 'classnames'
import styles from './Timeline.css'
import { formatMs } from 'utils/time'
import { Ticker } from 'renderer/components/Ticker'
import { Time } from 'renderer/components/media/Time'
import { clamp } from 'utils/math'
import { Slider } from 'renderer/components/media/Slider'
import { CuePointItem } from 'renderer/components/media/CuePoint'

interface IProps {
  className?: string

  /** Unix start time. When paused this is the current time. */
  time: number

  paused?: boolean
  duration?: number

  /**
   * Cue points with the number of seconds as the value.
   * NOTE: Won't be used unless duration is also present.
   */
  cuePoints?: Readonly<CuePointItem>[]

  onSeek?: (time: number) => void
}

interface IState {
  time: number
  progress: number
  seeking?: boolean
}

const HOUR_MS = 3600 * 1000

export class Timeline extends PureComponent<IProps, IState> {
  static defaultProps: Partial<IProps> = {
    duration: 0
  }

  state: IState = { time: this.calcTime(), progress: this.calcProgress() }

  private slider: Slider | null = null

  componentDidUpdate(prevProps: IProps): void {
    if (this.props.time !== prevProps.time) {
      this.tick()
    }
  }

  private calcTime() {
    const { time, paused, duration } = this.props

    if (this.slider && this.slider.state.dragging) {
      const { dragProgress } = this.slider.state
      return (dragProgress || 0) * duration!
    }

    return paused ? time : Date.now() - time
  }

  private calcProgress() {
    const { time, paused, duration } = this.props
    const curTime = paused ? time : Date.now() - time
    return clamp(curTime / (duration || 1), 0, 1)
  }

  private tick = () => {
    this.setState({ time: this.calcTime(), progress: this.calcProgress() })
  }

  private getCuePoints() {
    const { cuePoints, duration } = this.props

    if (cuePoints && duration) {
      // TODO: store in state since this will be invoked often while scrubbing
      return cuePoints.map(cue => ({
        ...cue,
        value: clamp(cue.value / duration, 0, 1)
      }))
    }
  }

  render(): JSX.Element {
    const { time, paused, duration, onSeek } = this.props
    const exceedsHour = duration ? duration >= HOUR_MS : false

    return (
      <span className={cx(this.props.className, styles.container)}>
        <Time className={styles.time} time={this.state.time} leading leadingHours={exceedsHour} />
        <Slider
          ref={el => {
            this.slider = el
          }}
          className={styles.progressSlider}
          value={this.state.progress}
          cuePoints={this.getCuePoints()}
          onChange={progress => {
            if (onSeek) {
              onSeek(progress * (duration || 0))
            }
          }}
          onDragStart={() => {
            this.setState({ seeking: true })
          }}
          onDragEnd={() => {
            this.setState({ seeking: false })
          }}
        />
        <Time className={styles.time} time={duration!} leading leadingHours={exceedsHour} />
        <Ticker onTick={this.tick} disabled={paused && !this.state.seeking} />
      </span>
    )
  }
}
