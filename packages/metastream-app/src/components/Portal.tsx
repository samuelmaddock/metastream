import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  container: HTMLElement
  children: React.ReactNode
}

export const Portal = ({ children, container }: Props) => {
  const [isReady, setIsReady] = useState(false)

  const copyStyleSheets = () => {
    const remoteDocument = container.ownerDocument
    if (remoteDocument) {
      // remove existing stylesheets
      Array.from(remoteDocument.styleSheets).forEach(stylesheet => {
        if (stylesheet.ownerNode) stylesheet.ownerNode.remove()
      })

      // add all stylesheets from main document
      Array.from(document.styleSheets).forEach(stylesheet => {
        if (stylesheet.ownerNode) {
          remoteDocument.head.appendChild(stylesheet.ownerNode.cloneNode(true))
        }
      })
    }
  }

  useEffect(function componentDidMount() {
    const stylesheetObserver = new MutationObserver(list => {
      const shouldCopyStyles = list.some(record => record.type === 'childList')
      if (shouldCopyStyles) {
        copyStyleSheets()
      }
    })

    stylesheetObserver.observe(document.head, { childList: true })

    copyStyleSheets()

    // Need to wait a bit for stylesheets to load to prevent flashing content.
    let timeoutId = setTimeout(() => {
      setIsReady(true)
    }, 60)

    return function componentWillUnmount() {
      stylesheetObserver.disconnect()

      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  return createPortal(isReady ? children : <></>, container)
}
