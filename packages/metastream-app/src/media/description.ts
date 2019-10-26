export const TIMESTAMP_REGEX = /\b(\d{1,2})((?::\d{2})+)\b/m
export const LINK_REGEX = /\b(https?:\/\/\S+)\b/m
export const BOLD_REGEX = /(?:^|\s)(?:(?:\*{2}(.+?)\*{2})|(?:_{2}(.+?)_{2}))(?:$|\s)/m
export const ITALIC_REGEX = /(?:^|\s)(?:(?:\*(.+?)\*)|(?:_(.+?)_))(?:$|\s)/m

export const enum ParseToken {
  TEXT = 'text',
  TIMESTAMP = 'timestamp',
  LINK = 'link',
  BOLD = 'bold',
  ITALIC = 'italic'
}

export type DescriptionFragment = { type: ParseToken; content: string }

type TokenizeResult = {
  startIndex: number
  endIndex?: number
  value: string
}

type TokenConfig = {
  type: ParseToken
  tokenize: (text: string) => TokenizeResult | void
}

const tokenConfigs: TokenConfig[] = [
  {
    type: ParseToken.BOLD,
    tokenize: (text: string) => {
      let startIndex = text.search(BOLD_REGEX)
      if (startIndex === -1) return
      const match = text.match(BOLD_REGEX)!
      const full = match[0]
      const value = match[1] || match[2]
      const prefixChars = full.startsWith('_') ? 0 : 1
      const postfixChars = full.endsWith('_') ? 0 : 1
      const endIndex = startIndex + full.length - postfixChars
      startIndex += prefixChars
      return { startIndex, endIndex, value }
    }
  },
  {
    type: ParseToken.TIMESTAMP,
    tokenize: text => {
      let subtext = text
      let pos = 0
      do {
        const startIndex = subtext.search(TIMESTAMP_REGEX)
        if (startIndex === -1) return

        // validate HH:MM:SS
        const timestamp = subtext.match(TIMESTAMP_REGEX)![0]
        const numSegments = timestamp.split(':').length
        const isHHMMSS = numSegments <= 3
        if (!isHHMMSS) {
          const endIndex = startIndex + timestamp.length
          subtext = subtext.substring(endIndex, subtext.length)
          pos += endIndex
          continue
        }

        return { startIndex: pos + startIndex, value: timestamp }

        // continue search through remaining string
      } while (pos <= text.length)
    }
  },
  {
    type: ParseToken.LINK,
    tokenize: (text: string) => {
      const startIndex = text.search(LINK_REGEX)
      if (startIndex === -1) return
      const value = text.match(LINK_REGEX)![0]
      return { startIndex, value }
    }
  }
]

const lexParts = (parts: DescriptionFragment[], tokens: ParseToken[]) => {
  // take multiple tokenization passes given the number of tokens
  const configs = tokenConfigs.filter(cfg => tokens.includes(cfg.type))
  configs.forEach(config => {
    for (let i = 0; i < parts.length; i++) {
      const { type, content } = parts[i]
      if (type !== ParseToken.TEXT) continue

      const result = config.tokenize(content)
      if (!result) continue

      const { startIndex, value } = result
      const endIndex = result.endIndex ? result.endIndex : startIndex + value.length

      // overwrite current index with value
      parts[i] = { type: config.type, content: value }

      // insert remaining text after current index
      if (endIndex < content.length) {
        const remaining = content.substring(endIndex, content.length)
        parts.splice(i + 1, 0, { type: ParseToken.TEXT, content: remaining })
      }

      // insert starting text prior to current index
      if (startIndex > 0) {
        const start = content.substring(0, startIndex)
        parts.splice(i, 0, { type: ParseToken.TEXT, content: start })
        i++
      }
    }
  })
  return parts
}

export const parseText = (text: string, tokens: ParseToken[]) => {
  let parts = [{ type: ParseToken.TEXT, content: text }]
  parts = lexParts(parts, tokens)
  return parts
}

export const parseDescription = (text: string) =>
  parseText(text, [ParseToken.TIMESTAMP, ParseToken.LINK])

export const parseChatMessage = (text: string) =>
  parseText(text, [ParseToken.BOLD, ParseToken.TIMESTAMP, ParseToken.LINK])
