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

const injectContentScripts = details => {
  const { tabId, frameId, url } = details
  if (url === 'about:blank') return

  console.log(`Injecting player script tabId=${tabId}, frameId=${frameId}`)
  chrome.tabs.executeScript(tabId, {
    file: 'player.js',
    runAt: 'document_start',
    frameId
  })
}

const startWatchingTab = tab => {
  console.log(`Metastream watching tabId=${tab.id}`)
  watchedTabs.add(tab.id)
  chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, { urls: ['<all_urls>'] }, [
    'blocking',
    'requestHeaders',
    'extraHeaders'
  ])
  chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceived,
    {
      urls: ['*://*/*'],
      types: ['sub_frame']
    },
    ['blocking', 'responseHeaders']
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

// Lazy-initialize Metastream listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isMetastreamUrl(sender.tab.url)) return

  if (message === 'initMetastream') {
    startWatchingTab(sender.tab)
    sendResponse(true)
    return
  }

  const { id: tabId } = sender.tab

  if (!watchedTabs.has(sender.tab.id)) return

  // Forward receiver event to metastream app
  if (typeof message === 'object' && message.type === 'metastream-receiver-event') {
    // TODO: include frameId in message payload?
    chrome.tabs.sendMessage(tabId, message, { frameId: 0 })
  }
})
