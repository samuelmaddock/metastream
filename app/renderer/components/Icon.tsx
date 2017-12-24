import React from 'React';

interface IProps {
  className?: string;

  /**
   * Name of SVG file to use in 'assets/icons/'
   *
   * IMPORTANT READ THIS:
   * Each svg file needs a unique ID, this component assumes the ID is the
   * same name as the file. Make sure to add an 'id' attribute to the file's
   * <svg> root element.
   */
  name: string;
}

// too lazy to move into css
const DEFAULT_STYLE = {
  display: 'inline-block'
};

/** SVG icon component */
export const Icon = ({ name, ...rest }: IProps) => {
  return (
    <svg width="24" height="24" style={DEFAULT_STYLE} {...rest}>
      <use xlinkHref={`asset://icons/${name}.svg#${name}`} />
    </svg>
  );
};
