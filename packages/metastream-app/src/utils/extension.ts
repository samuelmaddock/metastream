import { openInBrowser } from './url'

interface Chrome {
  app: {
    isInstalled: boolean
  }
  webstore: {
    install(success: Function, failure: Function): void
  }
}

interface InstallTrigger {
  install(info: { [key: string]: { URL: string } }): void
}

const chrome = (window as any).chrome as Chrome
const InstallTrigger = (window as any).InstallTrigger as InstallTrigger

export const getIsInstalled = (): boolean =>
  typeof document.documentElement.dataset.extensionInstalled !== 'undefined'

export const install = (): Promise<void> => {
  // Chrome
  if (typeof chrome === 'object' && typeof chrome.webstore === 'object') {
    return new Promise((resolve, reject) => chrome.webstore.install(resolve, reject))
  }

  // Firefox
  else if (typeof InstallTrigger === 'object') {
    const urlNode = document.querySelector<HTMLLinkElement>('link[rel=firefox-addon]')
    const url = urlNode && urlNode.href
    if (url) {
      openInBrowser(url)
      return Promise.resolve()
    }

    // TODO: figure out how to use InstallTrigger
    // InstallTrigger.install({
    //   MetastreamRemote: { URL: }
    // })
  } else {
    alert(
      [
        'Metastream is currently only supported on Chrome and Firefox.',
        'Please get in touch if you think your favorite browser should be supported.',
        'hello@getmetastream.com'
      ].join('\n\n')
    )
  }

  return Promise.reject('Unsupported browser')
}
