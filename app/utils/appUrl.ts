import { normalize } from 'path'

export const assetUrl = (relativePath: string) => {
  let path = normalize(relativePath);
  return `./assets/${path}`;
}
