import * as React from 'React';

interface IProps {
  className?: string;
  name: string;
}

// too lazy to move into css
const DEFAULT_STYLE = {
  display: 'block'
};

export const Icon = ({ name, ...rest }: IProps) => {
  return (
    <svg width="24" height="24" style={DEFAULT_STYLE} {...rest}>
      <use xlinkHref={`assets/icons/${name}.svg#${name}`} />
    </svg>
  );
};
