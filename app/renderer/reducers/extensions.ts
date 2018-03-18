import { Reducer } from 'redux'
import { isType } from 'utils/redux'
import { IAppState } from 'renderer/reducers'
import { setSessionData } from 'renderer/lobby/middleware/session'
import { setUpdateState } from 'renderer/actions/ui'
import { updateExtensions, showExtensionPopup } from 'renderer/actions/extensions'
import { chromeUrl } from 'utils/appUrl'

export interface IExtension {
  excluded?: boolean // true if extension was excluded by the user
  base_path: string
  browser_action?: {
    default_icon: string | { [resolution: string]: string }
    default_popup: string
    default_title: string
  }
  contextMenus?: {
    extensionId: string
    menuItemId: string
    properties: object
  }
  name?: string
  description?: string
  version?: string
  enabled: boolean
  id: string
  manifest?: object
  tabs?: {
    [tabId: string]: {
      browserAction: object // tab specific browser action properties
    }
  }
}

export interface IPopupState {
  src: string
  left: number
  top: number
  width?: number
  height?: number
}

export type IExtensionsState = {
  byId: {
    [extensionId: string]: IExtension
  }
  popup?: IPopupState
}

const initialState: IExtensionsState = {
  byId: {}
}

export const extensions: Reducer<IExtensionsState> = (
  state: IExtensionsState = initialState,
  action: any
) => {
  if (isType(action, updateExtensions)) {
    const extMap = action.payload.reduce((acc, ext) => {
      acc[ext.id] = ext
      return acc
    }, {})

    return {
      ...state,
      byId: extMap
    }
  } else if (isType(action, showExtensionPopup)) {
    return {
      ...state,
      popup: action.payload || undefined
    }
  }

  return state
}

const getExtensionById = (state: IAppState, extensionId: string) =>
  state.extensions.byId[extensionId]

export const getBrowserActionBackgroundImage = (extension: IExtension, tabId: number = -1) => {
  const browserAction = extension && extension.browser_action
  if (!extension || !browserAction) return ''

  let icon = browserAction.default_icon
  let basePath = chromeUrl(extension.base_path)

  if (icon && basePath) {
    // Older extensions may provide a string path
    if (typeof icon === 'string') {
      return `-webkit-image-set(
                url(${basePath}/${icon}) 1x`
    }
    let basePath19 = icon['19']
    let basePath38 = icon['38']
    if (basePath19 && basePath38) {
      return `-webkit-image-set(
                url(${basePath}/${basePath19}) 1x,
                url(${basePath}/${basePath38}) 2x`
    }
  }
  return ''
}
