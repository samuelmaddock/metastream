const { remote } = chrome;

export const copyToClipboard = (data: any, type?: string): void => {
  const { clipboard } = remote;
  switch (type || typeof data) {
    case 'string':
      clipboard.writeText(data);
      break;
    default:
      clipboard.writeText(data + '');
  }
};
