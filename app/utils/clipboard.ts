import { clipboard } from 'electron';

export const copyToClipboard = (data: any, type?: string): void => {
  switch (type || typeof data) {
    case 'string':
      clipboard.writeText(data);
      break;
    default:
      clipboard.writeText(data + '');
  }
};
