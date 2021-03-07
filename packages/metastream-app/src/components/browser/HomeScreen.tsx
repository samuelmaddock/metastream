import React, { useState, useRef } from 'react'
import cx from 'classnames'

import styles from './HomeScreen.css'
import { StorageKey } from 'constants/storage'

interface Props {
  onRequestUrl: (url: string) => void
}

export const HomeScreen = (props: Props) => {
  const [showTips, setShowTips] = useState(!localStorage.getItem(StorageKey.TipsDismissed))
  const urlInputRef = useRef<HTMLInputElement>(null)

  const externalHref = (href: string) => `./external.html?href=${encodeURIComponent(href)}`

  return (
    <div className={styles.container}>
      <header
        id="tips"
        className={cx(styles.tips, {
          [styles.tipsExpanded]: showTips
        })}
      >
        <button
          id="tipsbtn"
          className={styles.tipsButton}
          onClick={() => {
            setShowTips(!showTips)
            localStorage.setItem(StorageKey.TipsDismissed, '1')
          }}
        >
          <div className={styles.column}>
            <b>📝 Tips for getting started</b>
            <svg
              width="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 8 12 16 20 8" />
            </svg>
          </div>
        </button>
        <div className="tips-content">
          <p className={styles.column}>
            From here you can browse the web to find media to share in the session.
          </p>

          <ul className={cx(styles.column, styles.emojiList)}>
            <li>
              <span className={styles.emojiBullet}>🌐</span> Metastream supports many websites!
              Don't see one in the list? Try adding the link anyway!
            </li>
            <li>
              <span className={styles.emojiBullet}>👥</span> Everyone in the session will need an
              account or subscription if required by a website.
            </li>
            <li>
              <span className={styles.emojiBullet}>🐛</span> Is a website not working how you'd
              expect? Help us out by{' '}
              <a
                className="link"
                href="https://github.com/samuelmaddock/metastream/issues"
                target="_blank"
              >
                reporting the issue on GitHub.
              </a>
            </li>
          </ul>
        </div>
      </header>
      <main className={styles.main}>
        <section style={{ maxWidth: '100%' }}>
          <div className={cx(styles.column, styles.gridContainer)}>
            <a
              href="https://www.youtube.com/"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              YouTube
            </a>
            <a
              href="https://www.twitch.tv/"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              Twitch
            </a>
            <a
              href={externalHref('https://www.netflix.com')}
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
              target="_blank"
            >
              Netflix
            </a>
            <a
              href="https://www.hulu.com/"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              Hulu
            </a>
            <a
              href="https://www.disneyplus.com/"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              Disney+
            </a>
            <a
              href="https://www.crunchyroll.com/videos/anime"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              Crunchyroll
            </a>
            <a
              href="https://soundcloud.com/"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              SoundCloud
            </a>
            <a
              href="https://www.reddit.com/"
              className={cx(styles.button, styles.socialLink)}
              rel="noopener"
            >
              Reddit
            </a>
          </div>
          <div className={cx(styles.column, styles.inputContainer)}>
            <input
              ref={urlInputRef}
              id="urlinput"
              placeholder="Or paste any link (e.g. https://cool.website/video/123)"
              autoComplete="url"
              spellCheck={false}
            />
            <button
              id="addbtn"
              className={cx(styles.button, styles.uppercase)}
              onClick={() => {
                if (urlInputRef.current) {
                  props.onRequestUrl(urlInputRef.current.value)
                }
              }}
            >
              Add to Session
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
