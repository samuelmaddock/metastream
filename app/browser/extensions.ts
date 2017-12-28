import fs from 'fs';
import path from 'path';
import { session } from 'electron';

const extVerRegex = /^[\d._]+$/;
const isExtVersion = (dirName: string) => !!extVerRegex.exec(dirName);

const extensionIds = [
  'cjpalhdlnbpafiamejdnhcphjbkeiagm', // ublock origin
  'gcbommkclmclpchllfjekcdonpmejbdp'  // https everywhere
];

export function loadMediaExtensions() {
  const ses = session.fromPartition('persist:mediaplayer', { cache: true });
  const { extensions } = ses as any;

  const extRoot = path.normalize(path.join(__dirname, '/extensions/'));

  extensionIds.forEach(extId => {
    const extPath = path.join(extRoot, `${extId}`);

    if (fs.statSync(extPath)) {
      const dirs = fs.readdirSync(extPath);
      const extVersion = dirs.find(isExtVersion);
      const fullPath = extVersion && path.join(extPath, extVersion);

      if (fullPath && fs.statSync(fullPath)) {
        console.log(`Loading extension ${extId}`);
        extensions.load(fullPath, {}, 'unpacked');
      }
    }
  });
}
