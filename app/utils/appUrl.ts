import { normalize, dirname } from 'path'

export const assetUrl = (relativePath: string) => {
  let path = normalize(relativePath);
  return `./assets/${path}`;
}

export const absoluteUrl = (relativePath: string) => {
  const { protocol, host, pathname } = location;
  const basepath = dirname(pathname);
  return `${protocol}//${host}${basepath}/${normalize(relativePath)}`;
}
