'use strict'

//
// The background script provides monitoring of tabs for an active Metastream
// webapp. When activated, web requests originating from the app are modified
// to allow bypassing browser security limitations. This script also provides
// message brokering between embedded websites and the app itself.
//

//=============================================================================
// Helpers
//=============================================================================

const TOP_FRAME = 0
const HEADER_PREFIX = 'x-metastream'
const isMetastreamUrl = url =>
  url.startsWith('https://app.getmetastream.com') ||
  url.startsWith('http://localhost:8080') ||
  url.startsWith('https://localhost:8080')
const isTopFrame = details => details.frameId === TOP_FRAME
const isDirectChild = details => details.parentFrameId === TOP_FRAME
const isValidAction = action => typeof action === 'object' && typeof action.type === 'string'
const isFirefox = () => navigator.userAgent.toLowerCase().includes('firefox')

const escapePattern = pattern => pattern.replace(/[\\^$+?.()|[\]{}]/g, '\\$&')

// Check whether pattern matches.
// https://developer.chrome.com/extensions/match_patterns
const matchesPattern = function(url, pattern) {
  if (pattern === '<all_urls>') return true
  const regexp = new RegExp(
    `^${pattern
      .split('*')
      .map(escapePattern)
      .join('.*')}$`
  )
  return url.match(regexp)
}

// Memoized frame paths
const framePaths = {}

// Get path from top level frame to subframe.
const getFramePath = async (tabId, frameId) => {
  if (framePaths[frameId]) return framePaths[frameId]
  let path = [frameId]
  let currentFrameId = frameId
  while (currentFrameId > 0) {
    const result = await new Promise(resolve => {
      const details = { tabId, frameId: currentFrameId }
      chrome.webNavigation.getFrame(details, details => {
        if (chrome.runtime.lastError) {
          console.error(`Error in getFramePath: ${chrome.runtime.lastError}`)
          resolve()
          return
        }
        resolve(details)
      })
    })
    if (!result) return []
    const { parentFrameId } = result
    path.push(parentFrameId)
    currentFrameId = parentFrameId
  }
  path = path.reverse()
  framePaths[frameId] = path
  return path
}

const sendToFrame = (tabId, frameId, message) =>
  chrome.tabs.sendMessage(tabId, message, { frameId })

const sendToHost = (tabId, message) => sendToFrame(tabId, TOP_FRAME, message)

const sendWebviewEventToHost = async (tabId, frameId, message) => {
  const framePath = await getFramePath(tabId, frameId)
  sendToHost(
    tabId,
    { type: 'metastream-webview-event', payload: message, framePath },
    { frameId: TOP_FRAME }
  )
}

//=============================================================================
// Locals
//=============================================================================

// Observed tabs on Metastream URL
const watchedTabs = new Set()

// Store for active tabs state
const tabStore = {}

//=============================================================================
// Content scripts
//=============================================================================

const CONTENT_SCRIPTS = [
  {
    matches: ['https://*.netflix.com/*'],
    file: '/scripts/netflix.js'
  },
  {
    matches: ['https://*.soundcloud.com/*'],
    file: '/scripts/soundcloud.js'
  },
  {
    matches: ['https://*.hulu.com/*'],
    file: '/scripts/hulu.js'
  },
  {
    matches: ['https://www.dcuniverse.com/*'],
    file: '/scripts/dcuniverse.js'
  }
]

//=============================================================================
// Event listeners
//=============================================================================

// Add Metastream header overwrites
const onBeforeSendHeaders = details => {
  const { tabId, requestHeaders: headers } = details
  const shouldModify = (watchedTabs.has(tabId) && isTopFrame(details)) || tabId === -1
  if (shouldModify) {
    for (let i = headers.length - 1; i >= 0; --i) {
      const header = headers[i].name.toLowerCase()
      if (header.startsWith(HEADER_PREFIX)) {
        const name = header.substr(HEADER_PREFIX.length + 1)
        const value = headers[i].value
        headers.push({ name, value })
        headers.splice(i, 1)
      }
    }
  }
  return { requestHeaders: headers }
}

// Allow embedding any website in Metastream iframe
const onHeadersReceived = details => {
  const { tabId, frameId, responseHeaders: headers } = details
  let permitted = false

  const isMetastreamTab = watchedTabs.has(tabId) && isDirectChild(details)
  const isServiceWorkerRequest = watchedTabs.size > 0 && tabId === -1 && frameId === -1
  const shouldModify = isMetastreamTab || isServiceWorkerRequest

  // TODO: HTTP 301 redirects don't get captured. Try https://reddit.com/

  if (shouldModify) {
    for (let i = headers.length - 1; i >= 0; --i) {
      const header = headers[i].name.toLowerCase()
      const value = headers[i].value
      if (header === 'x-frame-options' || header === 'frame-options') {
        headers.splice(i, 1)
        permitted = true
      } else if (header === 'content-security-policy' && value.includes('frame-ancestors')) {
        const policies = value.split(';').filter(value => !value.includes('frame-ancestors'))
        headers[i].value = policies.join(';')
        permitted = true
      }
    }
  }

  if (permitted) {
    console.log(`Permitting iframe embedded in tabId=${tabId}, url=${details.url}`)
  }

  return { responseHeaders: headers }
}

const onTabRemove = (tabId, removeInfo) => {
  if (watchedTabs.has(tabId)) {
    stopWatchingTab(tabId)
  }
}

const onBeforeNavigate = details => {
  const { tabId, frameId, url } = details
  if (!watchedTabs.has(tabId)) return
  if (isTopFrame(frameId)) return
  ;(async () => {
    const framePath = await getFramePath(tabId, frameId)
    const isWebviewFrame = framePath[1] === frameId
    if (isWebviewFrame) {
      sendWebviewEventToHost(tabId, frameId, { type: 'will-navigate', payload: { url } })
    }
  })()
}

// Programmatically inject content scripts into Metastream subframes
const initScripts = details => {
  const { tabId, frameId, url } = details
  if (!watchedTabs.has(tabId)) return

  if (url.startsWith('about:blank?webview')) {
    initializeWebview(details)
    return
  }

  if (isTopFrame(details)) {
    // Listen for top frame navigating away from Metastream
    if (!isMetastreamUrl(details.url)) {
      stopWatchingTab(tabId)
    }
  } else {
    injectContentScripts(details)
  }
}

const onCompleted = details => {
  const { tabId, frameId, url } = details
  if (!watchedTabs.has(tabId)) return
  if (isTopFrame(frameId)) return
  ;(async () => {
    const framePath = await getFramePath(tabId, frameId)
    const isWebviewFrame = framePath[1] === frameId
    if (isWebviewFrame) {
      sendWebviewEventToHost(tabId, frameId, { type: 'did-navigate', payload: { url } })
    }
  })()
}

const onHistoryStateUpdated = details => {
  const { tabId, frameId, url } = details
  if (!watchedTabs.has(tabId)) return
  if (isTopFrame(frameId)) return
  ;(async () => {
    const framePath = await getFramePath(tabId, frameId)
    const isWebviewFrame = framePath[1] === frameId
    if (isWebviewFrame) {
      sendWebviewEventToHost(tabId, frameId, { type: 'did-navigate-in-page', payload: { url } })
    }
  })()
}

const initializeWebview = details => {
  console.log('Initialize webview', details)
  const { tabId, frameId, url } = details

  const { searchParams } = new URL(url)

  const webviewId = searchParams.get('webview')
  sendToHost(tabId, { type: `metastream-webview-init${webviewId}`, payload: { frameId } })

  const tabState = tabStore[tabId]
  const allowScripts = searchParams.get('allowScripts') === 'true'
  if (allowScripts && tabState) {
    tabState.scriptableFrames.add(frameId)
  }
}

const executeScript = (opts, attempt = 0) => {
  chrome.tabs.executeScript(
    opts.tabId,
    {
      file: opts.file,
      runAt: opts.runAt || 'document_start',
      frameId: opts.frameId
    },
    result => {
      if (chrome.runtime.lastError) {
        console.log(`executeScript error [${opts.file}]: ${chrome.runtime.lastError}`)
        if (opts.retry !== false) {
          if (attempt < 20) {
            setTimeout(() => executeScript(opts, attempt + 1), 5)
          } else {
            console.error('Reached max attempts while injecting content script.', opts)
          }
        } else {
          console.error('Failed to inject content script', chrome.runtime.lastError, opts)
        }
      } else {
        console.log(`executeScript ${opts.file}`)
      }
    }
  )
}

const injectContentScripts = async details => {
  const { tabId, frameId, url } = details
  if (url === 'about:blank') return

  // Inject common webview script
  executeScript({ tabId, frameId, file: '/webview.js' })

  const framePath = await getFramePath(tabId, frameId)
  const topIFrameId = framePath[1]
  const tabState = tabStore[tabId]
  const scriptable = tabState && tabState.scriptableFrames.has(topIFrameId)
  if (scriptable) {
    console.log(`Injecting player script tabId=${tabId}, frameId=${frameId}, url=${url}`)
    executeScript({ tabId, frameId, file: '/player.js' })

    CONTENT_SCRIPTS.forEach(script => {
      if (!script.matches.some(matchesPattern.bind(null, url))) return
      executeScript({ tabId, frameId, file: script.file })
    })
  }
}

//=============================================================================
// Metastream tab management
//=============================================================================

const startWatchingTab = tab => {
  const { id: tabId } = tab
  console.log(`Metastream watching tabId=${tabId}`)
  watchedTabs.add(tabId)

  const state = {
    // Webview frames which allow scripts to be injected
    scriptableFrames: new Set(),

    // Event handlers
    onHeadersReceived: onHeadersReceived.bind(null)
  }

  tabStore[tabId] = state

  chrome.webRequest.onHeadersReceived.addListener(
    state.onHeadersReceived,
    {
      tabId,
      urls: ['<all_urls>'],
      types: ['sub_frame', 'xmlhttprequest', 'script']
    },
    [
      chrome.webRequest.OnHeadersReceivedOptions.BLOCKING,
      chrome.webRequest.OnHeadersReceivedOptions.RESPONSEHEADERS, // firefox
      chrome.webRequest.OnHeadersReceivedOptions.RESPONSE_HEADERS // chromium
    ].filter(Boolean)
  )

  const shouldAddGlobalListeners = watchedTabs.size === 1
  if (shouldAddGlobalListeners) {
    chrome.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate)
    if (isFirefox()) {
      chrome.webNavigation.onDOMContentLoaded.addListener(initScripts)
    } else {
      chrome.webNavigation.onCommitted.addListener(initScripts)
    }
    chrome.webNavigation.onCompleted.addListener(onCompleted)
    chrome.webNavigation.onHistoryStateUpdated.addListener(onHistoryStateUpdated)
    chrome.tabs.onRemoved.addListener(onTabRemove)

    // Listen for requests from background script
    chrome.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSendHeaders,
      { tabId: -1, urls: ['<all_urls>'] },
      [
        chrome.webRequest.OnBeforeSendHeadersOptions.BLOCKING,
        chrome.webRequest.OnBeforeSendHeadersOptions.REQUESTHEADERS, // firefox
        chrome.webRequest.OnBeforeSendHeadersOptions.REQUEST_HEADERS, // chromium
        chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS // chromium
      ].filter(Boolean)
    )
  }
}

const stopWatchingTab = tabId => {
  watchedTabs.delete(tabId)

  const state = tabStore[tabId]
  if (state) {
    chrome.webRequest.onHeadersReceived.removeListener(state.onHeadersReceived)
    delete tabStore[tabId]
  }

  const shouldRemoveGlobalListeners = watchedTabs.size === 0
  if (shouldRemoveGlobalListeners) {
    chrome.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate)
    if (isFirefox()) {
      chrome.webNavigation.onDOMContentLoaded.removeListener(initScripts)
    } else {
      chrome.webNavigation.onCommitted.removeListener(initScripts)
    }
    chrome.webNavigation.onCompleted.removeListener(onCompleted)
    chrome.webNavigation.onHistoryStateUpdated.removeListener(onHistoryStateUpdated)
    chrome.tabs.onRemoved.removeListener(onTabRemove)
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders)
  }

  console.log(`Metastream stopped watching tabId=${tabId}`)
}

//=============================================================================
// Background fetch proxy
//=============================================================================

const serializeResponse = async response => {
  let body
  let headers = {}

  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  if (contentType && contentType.indexOf('application/json') !== -1) {
    try {
      body = await response.json()
    } catch (e) {}
  } else {
    body = await response.text()
  }

  for (let pair of response.headers.entries()) {
    headers[pair[0]] = pair[1]
  }

  return {
    ...response,
    headers,
    body
  }
}

// Fetch on behalf of Metastream app, skips cross-domain security restrictions
const request = async (tabId, requestId, url, options) => {
  let response, err

  try {
    console.debug(`Requesting ${url}`)
    response = await fetch(url, options)
  } catch (e) {
    err = e.message
  }

  const action = {
    type: `metastream-fetch-response${requestId}`,
    payload: {
      err,
      resp: response ? await serializeResponse(response) : null
    }
  }
  sendToHost(tabId, action)
}

//=============================================================================
// Message passing interface
//=============================================================================

const handleWebviewEvent = async (sender, action) => {
  const { frameId } = sender
  const { id: tabId } = sender.tab
  if (isTopFrame(sender)) {
    sendToFrame(tabId, action.frameId, action.payload)
  } else {
    sendWebviewEventToHost(tabId, frameId, action.payload)
  }
}

chrome.runtime.onMessage.addListener((action, sender, sendResponse) => {
  const { id: tabId } = sender.tab
  if (!isValidAction(action)) return

  // Listen for Metastream app initialization signal
  if (action.type === 'metastream-init' && isMetastreamUrl(sender.tab.url)) {
    startWatchingTab(sender.tab)
    sendResponse(true)
    return
  }

  // Filter out messages from non-Metastream app tabs
  if (!watchedTabs.has(tabId)) return

  switch (action.type) {
    case 'metastream-webview-event':
      handleWebviewEvent(sender, action)
      break
    case 'metastream-host-event':
      // Forward host event to all subframes
      // TODO: exclude sending to top frame? allow sending to specific frame?
      chrome.tabs.sendMessage(tabId, action)
      break
    case 'metastream-fetch':
      const { requestId, url, options } = action.payload
      request(tabId, requestId, url, options)
      break
  }
})

//=============================================================================
// Inject content scripts into existing tabs on startup
//=============================================================================

const { content_scripts: contentScripts = [] } = chrome.runtime.getManifest()
const appContentScript = contentScripts.find(
  script => script.js && script.js.some(file => file.endsWith('app.js'))
)

if (appContentScript) {
  chrome.tabs.query({ url: appContentScript.matches }, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.executeScript(tab.id, { file: appContentScript.js[0] })
    })
  })
}
