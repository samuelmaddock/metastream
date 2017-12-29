import fs from 'fs';
import path from 'path';
import { session } from 'electron';

const extVerRegex = /^[\d._]+$/;
const isExtVersion = (dirName: string) => !!extVerRegex.exec(dirName);

const extensionIds = [
  'cjpalhdlnbpafiamejdnhcphjbkeiagm', // ublock origin
  'gcbommkclmclpchllfjekcdonpmejbdp',  // https everywhere
  'netflix-content-script',
  'enhanced-media-viewer',
];

export function loadMediaExtensions() {
  const ses = session.fromPartition('persist:mediaplayer', { cache: true });
  const { extensions } = ses as any;

  const extRoot = path.normalize(path.join(__dirname, '/extensions/'));

  extensionIds.forEach(extId => {
    const extPath = path.join(extRoot, `${extId}`);

    let stat;

    try {
      stat = fs.statSync(extPath);
    } catch (e) {}

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
