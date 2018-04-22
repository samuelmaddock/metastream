import React from 'react'
import * as cx from 'classnames'
import styles from './input.css'
import { Icon } from 'renderer/components/Icon'
import { HighlightButton } from 'renderer/components/common/button'

interface ITextInputProps extends React.HTMLProps<HTMLInputElement> {
  theRef?: (e: HTMLInputElement | null) => void
  className?: string
  defaultValue?: string
}

export const TextInput: React.SFC<ITextInputProps> = props => {
  const { theRef, ...rest } = props
  return <input ref={theRef} type="text" {...rest} className={cx(styles.text, props.className)} />
}

interface ITextAreaProps extends React.HTMLProps<HTMLTextAreaElement> {
  theRef?: (e: HTMLTextAreaElement | null) => void
  className?: string
}

export const TextAreaInput: React.SFC<ITextAreaProps> = props => {
  const { theRef, ...rest } = props
  return <textarea ref={theRef} {...rest} className={cx(styles.text, props.className)} />
}

export const InputGroup: React.SFC<ITextInputProps> = props => {
  return <div className={styles.inputGroup}>{props.children}</div>
}

interface IClipboardTextInputProps extends ITextInputProps {
  inputClassName?: string
}

export class ClipboardTextInput extends React.Component<IClipboardTextInputProps> {
  private input: HTMLInputElement | null = null

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
        <HighlightButton icon="clipboard" onClick={this.copy} highlight>
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
