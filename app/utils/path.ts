const path = window.require('path');

export const getRootDir = () => {
  let dirpath;

  /*
    const app = window.require('electron').remote.app;
    alert([
        `env = ${process.env.NODE_ENV}`,
        process.execPath,
        process.resourcesPath,
        app.getPath('exe'),
        app.getPath('module'),
        __dirname,
        process.cwd(),
        require.main!.filename
    ].join('\n'));
    */

  if (process.env.NODE_ENV === 'production') {
    dirpath = path.dirname(process.execPath);
  } else {
    // dirpath = path.dirname(require!.main!.filename);
    dirpath = './';
  }

  return dirpath;
};
