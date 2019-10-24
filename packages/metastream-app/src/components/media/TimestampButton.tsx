import React from 'react'
import { connect } from 'react-redux'
import { TimestampLinkText } from '../common/typography'
import { server_requestSeek } from '../../lobby/actions/mediaPlayer'
import { timestampToMilliseconds } from '../../utils/cuepoints'

interface Props {
  timestamp: string
}

interface DispatchProps {
  requestSeek(time: number): void
}

type PrivateProps = Props & DispatchProps

const _TimestampButton: React.SFC<PrivateProps> = ({ timestamp, requestSeek }) => {
  const timeMs = timestampToMilliseconds(timestamp)
  return (
    <button onClick={() => requestSeek(timeMs)} aria-label={`Seek to ${timestamp}`}>
      <TimestampLinkText>{timestamp}</TimestampLinkText>
    </button>
  )
}

export const TimestampButton = (connect(
  null,
  (dispatch): DispatchProps => ({
    requestSeek(time) {
      dispatch(server_requestSeek(time) as any)
    }
  })
)(_TimestampButton as any) as any) as React.ComponentClass<Props>
