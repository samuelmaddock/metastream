import React, { Component, ErrorInfo } from 'react'
import { ExternalLink } from './common/link'
import styles from './ErrorBoundary.css'
import { DISCORD_INVITE_URL, GITHUB_REPO_URL } from 'constants/social'
import { HighlightButton } from './common/button'
import { copyToClipboard } from 'utils/clipboard'
import { VERSION } from 'constants/app'

interface Props {}

interface State {
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {}

  private get errorText() {
    const { error, errorInfo } = this.state
    return `Version: ${VERSION}
URL: ${location.href}
User-Agent: ${navigator.userAgent}

Stack trace:
${error ? error.stack : ''}

Component stack:
${errorInfo ? errorInfo.componentStack : ''}
`
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    try {
      ga('send', 'exception', {
        exDescription: error.message,
        exFatal: true
      })
    } catch {}
  }

  render() {
    const { error } = this.state

    if (error) {
      return (
        <div className={styles.container}>
          <div>
            <p>😱 An error occured in Metastream.</p>
            <p>
              Please consider reporting this on Metastream&rsquo;s{' '}
              <ExternalLink className="link" href={`${GITHUB_REPO_URL}/issues`}>
                GitHub issue tracker
              </ExternalLink>{' '}
              and/or{' '}
              <ExternalLink className="link" href={DISCORD_INVITE_URL}>
                Discord community.
              </ExternalLink>
            </p>
            <pre>{this.errorText}</pre>
            <p>
              <br />
              To continue, you can try reloading the application. If the problem persists, refer to
              the{' '}
              <ExternalLink className="link" href={`${GITHUB_REPO_URL}/wiki/FAQ`}>
                Metastream FAQ
              </ExternalLink>{' '}
              for tips on troubleshooting.
            </p>
            <p>
              <HighlightButton
                icon="refresh-cw"
                size="medium"
                highlight
                onClick={() => location.reload(true)}
              >
                Reload
              </HighlightButton>
              &nbsp;
              <HighlightButton
                icon="clipboard"
                size="medium"
                onClick={() => {
                  copyToClipboard(this.errorText)
                }}
              >
                Copy error
              </HighlightButton>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
