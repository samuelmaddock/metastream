import React from 'react';

import { Icon } from 'components/Icon';

export interface IIconButtonProps {
  icon: string;
  title?: string;

  /** Highlight button as turned on */
  enabled?: boolean;

  /** Disable button interaction */
  disabled?: boolean;

  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const IconButton: React.SFC<IIconButtonProps> = props => {
  return (
    <button
      type="button"
      disabled={props.disabled}
      className={props.className}
      title={props.title}
      onClick={props.onClick}
    >
      <Icon name={props.icon} /> {props.children}
    </button>
  );
};
