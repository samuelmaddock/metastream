'use strict'

//
// The background script provides monitoring of tabs for an active Metastream
// webapp. When activated, web requests originating from the app are modified
// to allow bypassing browser security limitations. This script also provides
// message brokering between embedded websites and the app itself.
//

const HEADER_PREFIX = 'X-Metastream'
const isMetastreamUrl = url => url.includes('getmetastream.com') || url.includes('localhost')
const isTopFrame = details => details.frameId === 0
const isDirectChild = details => details.parentFrameId === 0

// Observed tabs on Metastream URL
const watchedTabs = new Set()

// Add Metastream header overwrites
const onBeforeSendHeaders = details => {
  const { tabId, requestHeaders: headers } = details
  if (watchedTabs.has(tabId) && isTopFrame(details)) {
    for (let i = headers.length - 1; i >= 0; --i) {
      const header = headers[i].name.toLowerCase()
      if (header.startsWith(HEADER_PREFIX)) {
        headers.splice(i, 1)
        const name = header.substr(HEADER_PREFIX.length + 1)
        headers.push({ name, value: header.value })
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

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    { tabId, urls: ['<all_urls>'] },
    [
      chrome.webRequest.OnBeforeSendHeadersOptions.BLOCKING,
      chrome.webRequest.OnBeforeSendHeadersOptions.REQUESTHEADERS, // firefox
      chrome.webRequest.OnBeforeSendHeadersOptions.REQUEST_HEADERS, // chromium
      chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS // chromium
    ].filter(Boolean)
  )
  chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
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
  chrome.webNavigation.onCommitted.addListener(onCommitted)
  chrome.tabs.onRemoved.addListener(onTabRemove)
}

const stopWatchingTab = tabId => {
  watchedTabs.delete(tabId)
  if (watchedTabs.size === 0) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders)
    chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceived)
    chrome.webNavigation.onCommitted.removeListener(onCommitted)
    chrome.tabs.onRemoved.removeListener(onTabRemove)
  }
  console.log(`Metastream stopped watching tabId=${tabId}`)
}

const serializeResponse = async (response) => {
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
    response = await fetch(url, options)
  } catch (e) {
    err = e.message
  }

  const message = {
    type: `metastream-fetch-response${requestId}`,
    payload: {
      err,
      resp: response ? await serializeResponse(response) : null
    }
  }
  chrome.tabs.sendMessage(tabId, message, { frameId: 0 })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { id: tabId } = sender.tab

  // Only listen for messages on Metastream app tab
  if (!isMetastreamUrl(sender.tab.url)) return

  // Listen for Metastream app initialization signal
  if (message === 'initMetastream') {
    startWatchingTab(sender.tab)
    sendResponse(true)
    return
  }

  // Filter out messages from non-Metastream app tabs
  if (!watchedTabs.has(tabId)) return
  if (typeof message !== 'object') return

  switch (message.type) {
    case 'metastream-receiver-event':
      // Forward receiver event to metastream app
      // TODO: include frameId in message payload?
      chrome.tabs.sendMessage(tabId, message, { frameId: 0 })
      break
    case 'metastream-host-event':
      // Forward host event to all subframes
      // TODO: exclude sending to top frame? allow sending to specific frame?
      chrome.tabs.sendMessage(tabId, message)
      break
    case 'metastream-fetch':
      const { requestId, url, options } = message.payload
      request(tabId, requestId, url, options)
      break
  }
})
