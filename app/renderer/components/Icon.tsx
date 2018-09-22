import React from 'react'
import { assetUrl } from 'utils/appUrl'
import { CSSProperties } from 'jss/css'

interface IProps {
  className?: string

  /**
   * Name of SVG file to use in 'assets/icons/'
   *
   * IMPORTANT READ THIS:
   * Each svg file needs a unique ID, this component assumes the ID is the
   * same name as the file. Make sure to add an 'id' attribute to the file's
   * <svg> root element.
   */
  name: string

  size?: 'small' | 'default'
  pointerEvents?: 'none'
}

// too lazy to move into css
const DEFAULT_STYLE: React.CSSProperties = {
  display: 'inline-block'
}

const SIZE_SCALE = {
  small: 0.7,
  default: 1.0
}

/** SVG icon component */
export const Icon = ({ name, size, pointerEvents, ...rest }: IProps) => {
  const path = assetUrl(`icons/${name}.svg#${name}`)
  let style = DEFAULT_STYLE

  if (size) {
    style = { ...style, transform: `scale(${SIZE_SCALE[size]}` }
  }

  if (pointerEvents) {
    style = { ...style, pointerEvents }
  }

  return (
    <svg width="24" height="24" style={style} {...rest}>
      <use xlinkHref={path} />
    </svg>
  )
}
