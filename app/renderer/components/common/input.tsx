import React from 'react'
import * as cx from 'classnames'
import styles from './input.css'
import { Icon } from 'renderer/components/Icon'
import { HighlightButton } from 'renderer/components/common/button'

interface ITextInputProps {
  className?: string
  disabled?: boolean
  placeholder?: string
  defaultValue?: string
}

export const TextInput: React.SFC<ITextInputProps> = props => {
  return <input type="text" {...props} className={cx(styles.text, props.className)} />
}

interface IClipboardTextInputProps extends ITextInputProps {
  inputClassName?: string
}

export class ClipboardTextInput extends React.Component<IClipboardTextInputProps> {
  private input: HTMLInputElement | null

  render() {
    return (
      <div className={cx(styles.textContainer, this.props.className)}>
        <input
          ref={e => (this.input = e)}
          className={cx(this.props.inputClassName, styles.textInput)}
          type="text"
          defaultValue={this.props.defaultValue}
          disabled={this.props.disabled}
        />
        <HighlightButton icon="clipboard" onClick={this.copy}>
          Copy
        </HighlightButton>
      </div>
    )
  }

  private copy = () => {
    if (this.input) {
      const { value } = this.input
      chrome.remote.clipboard.writeText(value)
    }
  }
}
