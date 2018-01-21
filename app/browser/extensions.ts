import fs from 'fs';
import path from 'path';
import { session, dialog } from 'electron';

const extVerRegex = /^[\d._]+$/;
const isExtVersion = (dirName: string) => !!extVerRegex.exec(dirName);

const extensionIds = [
  'cjpalhdlnbpafiamejdnhcphjbkeiagm', // ublock origin
  'gcbommkclmclpchllfjekcdonpmejbdp',  // https everywhere
  'netflix-content-script',
  'enhanced-media-viewer',
  'media-remote',
];

export function loadMediaExtensions() {
  const ses = session.fromPartition('persist:mediaplayer', { cache: true });
  const { extensions } = ses as any;

  const extDir = process.env.NODE_ENV === 'production' ? '../../extensions' : '/extensions';
  const extRoot = path.normalize(path.join(__dirname, extDir));

  extensionIds.forEach(extId => {
    const extPath = path.join(extRoot, `${extId}`);

    let stat;
    let err;

    try {
      stat = fs.statSync(extPath);
    } catch (e) {
      err = e;
    } finally {
      // dialog.showMessageBox({
      //   title:'test',
      //   message: `${extPath}\n\n${JSON.stringify(stat)}\n\n${JSON.stringify(err)}`,
      //   buttons: ['ok']
      // })
    }

    if (stat) {
      const dirs = fs.readdirSync(extPath);
      const extVersion = dirs.find(isExtVersion);
      const fullPath = extVersion && path.join(extPath, extVersion);

      try {
        stat = fullPath && fs.statSync(fullPath);
      } catch (e) {}

      if (stat) {
        console.log(`Loading extension ${extId}`);
        extensions.load(fullPath, {}, 'unpacked');
      }
    }
  });
}
