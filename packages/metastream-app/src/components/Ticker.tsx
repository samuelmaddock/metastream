import React, { Component } from 'react'
import { clamp } from 'utils/math'

interface IProps {
  fps?: number
  disabled?: boolean
  onTick: () => void
}

/**
 * Over-engineered ticker for high and low FPS animations.
 */
export class Ticker extends Component<IProps> {
  static defaultProps: Partial<IProps> = {
    fps: Infinity
  }

  private intervalId: number | null = null
  private rAFId: number | null = null

  private startTime: number | null = null

  private lastFrameTime?: number
  private frameRate?: number

  private get isRunning(): boolean {
    return this.startTime !== null
  }

  componentDidMount(): void {
    this.checkTimer()
  }

  componentWillUnmount(): void {
    this.stopTimer()
  }

  componentDidUpdate(prevProps: IProps): void {
    if (this.props.fps !== prevProps.fps) {
      this.stopTimer()
    }

    this.checkTimer()
  }

  /** Calculate target frame rate (ms) */
  private calcframeRate(): number {
    const fps = clamp(this.props.fps!, 1, 60)
    return 1000 / fps
  }

  private checkTimer() {
    const { disabled } = this.props
    if (this.isRunning) {
      if (disabled) {
        this.stopTimer()
      }
    } else {
      if (!disabled) {
        this.startTimer()
      }
    }
  }

  private startTimer() {
    this.startTime = this.lastFrameTime = performance.now()
    this.frameRate = this.calcframeRate()

    if (this.frameRate > 100) {
      this.slowTick()
      this.intervalId = setInterval(this.slowTick, this.frameRate) as any
    } else {
      this.rAFId = requestAnimationFrame(this.fastTick)
    }
  }

  private stopTimer() {
    this.startTime = null

    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }

    if (this.rAFId) {
      cancelAnimationFrame(this.rAFId)
      this.rAFId = null
    }
  }

  private slowTick = () => {
    this.rAFId = requestAnimationFrame(this.props.onTick)
  }

  /** High performance ticker */
  private fastTick = (now: number) => {
    let elapsed = now - this.lastFrameTime!
    if (elapsed > this.frameRate!) {
      this.props.onTick()
      this.lastFrameTime = now
    }
    this.rAFId = requestAnimationFrame(this.fastTick)
  }

  render(): JSX.Element | null {
    return null
  }
}
