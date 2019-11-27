import React, { Component } from 'react'
import { VERSION } from 'constants/app'
import marked from 'marked'

import styles from './Changelog.css'
import { ExternalLink } from '../common/link'
import { Fetch } from '../common/Fetch'
import { t } from 'locale'

export class Changelog extends Component {
  render() {
    const version = process.env.NODE_ENV === 'production' ? VERSION : '0.1.3'
    return (
      <Fetch
        cacheKey="releaseInfo"
        href={`https://api.github.com/repos/samuelmaddock/metastream/releases/tags/v${version}`}
      >
        {data => (
          <>
            <p>
              <ExternalLink
                href={`https://github.com/samuelmaddock/metastream/releases/tag/v${VERSION}`}
              >
                {t('viewOnGitHub')}
              </ExternalLink>
            </p>
            {data !== null &&
              typeof data === 'object' &&
              data.body &&
              this.renderMarkdown(data.body)}
          </>
        )}
      </Fetch>
    )
  }

  private renderMarkdown(str: string) {
    const html = marked(str, { gfm: true })
    return <div className={styles['markdown-body']} dangerouslySetInnerHTML={{ __html: html }} />
  }
}
