import { normalize, isAbsolute, resolve } from 'path'

export const ASSETS_PATH = '/assets'

export const assetUrl = (relativePath: string) => {
  let path = normalize(relativePath)
  return `${ASSETS_PATH}/${path}`
}

export const absoluteUrl = (relativePath: string) => {
  return new URL(relativePath, location.origin).href
}

export const fileUrl = (filePath: string) => {
  // It's preferrable to call path.resolve but it's not available
  // because process.cwd doesn't exist in renderers like in file URL
  // drops in the URL bar.
  if (!isAbsolute(filePath) && process.cwd) {
    filePath = resolve(filePath)
  }
  let fileUrlPath = filePath.replace(/\\/g, '/')

  // Windows drive letter must be prefixed with a slash
  if (fileUrlPath[0] !== '/') {
    fileUrlPath = '/' + fileUrlPath
  }

  return encodeURI('file://' + fileUrlPath)
}
