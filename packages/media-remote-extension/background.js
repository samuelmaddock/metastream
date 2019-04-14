'use strict'

//
// The background script provides monitoring of tabs for an active Metastream
// webapp. When activated, web requests originating from the app are modified
// to allow bypassing browser security limitations. This script also provides
// message brokering between embedded websites and the app itself.
//

const HEADER_PREFIX = 'x-metastream'
const isMetastreamUrl = url => url.includes('getmetastream.com') || url.includes('localhost')
const isTopFrame = details => details.frameId === 0
const isDirectChild = details => details.parentFrameId === 0
const isValidAction = action => typeof action === 'object' && typeof action.type === 'string'

// Observed tabs on Metastream URL
const watchedTabs = new Set()

// Local state for active tabs
const tabState = {}

// Add Metastream header overwrites
const onBeforeSendHeaders = details => {
  const { tabId, requestHeaders: headers } = details
  const shouldModify = (watchedTabs.has(tabId) && isTopFrame(details)) || tabId === -1
  if (shouldModify) {
    for (let i = headers.length - 1; i >= 0; --i) {
      const header = headers[i].name.toLowerCase()
      if (header.startsWith(HEADER_PREFIX)) {
        const name = header.substr(HEADER_PREFIX.length + 1)
        headers.push({ name, value: headers[i].value })
        headers.splice(i, 1)
      }
    }
  }
  return { requestHeaders: headers }
}

// Allow embedding any website in Metastream iframe
const onHeadersReceived = details => {
  const { tabId, responseHeaders: headers } = details
  if (watchedTabs.has(tabId) && isDirectChild(details)) {
    for (let i = headers.length - 1; i >= 0; --i) {
      const header = headers[i].name.toLowerCase()
      if (header === 'x-frame-options' || header === 'frame-options') {
        console.log(`Permitting iframe embedded in tabId=${tabId}, url=${details.url}`)
        headers.splice(i, 1)
      }
    }
  }
  return { responseHeaders: headers }
}

const onTabRemove = (tabId, removeInfo) => {
  if (watchedTabs.has(tabId)) {
    stopWatchingTab(tabId)
  }
}

// Programmatically inject content scripts into Metastream subframes
const onCommitted = details => {
  const { tabId, frameId, url } = details
  if (!watchedTabs.has(tabId)) return

  if (isTopFrame(details)) {
    // Listen for top frame navigating away from Metastream
    if (!isMetastreamUrl(details.url)) {
      stopWatchingTab(tabId)
    }
  } else {
    injectContentScripts(details)
  }
}

const injectContentScripts = (details, attempt = 0) => {
  if (attempt > 20) {
    console.warn('Reached max attempts while injecting content scripts.', details)
    return
  }

  const { tabId, frameId, url } = details
  if (url === 'about:blank') return

  console.log(`Injecting player script tabId=${tabId}, frameId=${frameId}`)
  chrome.tabs.executeScript(
    tabId,
    {
      file: '/player.js',
      runAt: 'document_start',
      frameId
    },
    result => {
      if (chrome.runtime.lastError) {
        // TODO: can we inject this any sooner in Firefox?
        setTimeout(() => injectContentScripts(details, attempt + 1), 10)
      }
    }
  )
}

const startWatchingTab = tab => {
  const { id: tabId } = tab
  console.log(`Metastream watching tabId=${tabId}`)
  watchedTabs.add(tabId)

  const state = {
    onBeforeSendHeaders: onBeforeSendHeaders.bind(null),
    onHeadersReceived: onHeadersReceived.bind(null)
  }

  tabState[tabId] = state

  chrome.webRequest.onBeforeSendHeaders.addListener(
    state.onBeforeSendHeaders,
    { tabId, urls: ['<all_urls>'] },
    [
      chrome.webRequest.OnBeforeSendHeadersOptions.BLOCKING,
      chrome.webRequest.OnBeforeSendHeadersOptions.REQUESTHEADERS, // firefox
      chrome.webRequest.OnBeforeSendHeadersOptions.REQUEST_HEADERS, // chromium
      chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS // chromium
    ].filter(Boolean)
  )
  chrome.webRequest.onHeadersReceived.addListener(
    state.onHeadersReceived,
    {
      tabId,
      urls: ['<all_urls>'],
      types: ['sub_frame']
    },
    [
      chrome.webRequest.OnHeadersReceivedOptions.BLOCKING,
      chrome.webRequest.OnHeadersReceivedOptions.RESPONSEHEADERS, // firefox
      chrome.webRequest.OnHeadersReceivedOptions.RESPONSE_HEADERS // chromium
    ].filter(Boolean)
  )

  const shouldAddGlobalListeners = watchedTabs.size === 1
  if (shouldAddGlobalListeners) {
    chrome.webNavigation.onCommitted.addListener(onCommitted)
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

  const state = tabState[tabId]
  if (state) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(state.onBeforeSendHeaders)
    chrome.webRequest.onHeadersReceived.removeListener(state.onHeadersReceived)
    delete tabState[tabId]
  }

  const shouldRemoveGlobalListeners = watchedTabs.size === 0
  if (shouldRemoveGlobalListeners) {
    chrome.webNavigation.onCommitted.removeListener(onCommitted)
    chrome.tabs.onRemoved.removeListener(onTabRemove)
  }

  console.log(`Metastream stopped watching tabId=${tabId}`)
}

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
  chrome.tabs.sendMessage(tabId, action, { frameId: 0 })
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
    case 'metastream-receiver-event':
      // Forward receiver event to metastream app
      // TODO: include frameId in message payload?
      chrome.tabs.sendMessage(tabId, action, { frameId: 0 })
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
