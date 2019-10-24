// timestamp pattern regex
export const TIMESTAMP_REGEX = /\b(\d{1,2})((?::\d{2})+)\b/m

// simple URL regex
export const LINK_REGEX = /\b(https?:\/\/\S+)\b/m

export const enum ParseToken {
  TEXT = 'text',
  TIMESTAMP = 'timestamp',
  LINK = 'link'
}

export type DescriptionFragment = { type: ParseToken; content: string }

type TokenConfig = {
  token: ParseToken
  tokenize: (text: string) => [number, string] | void
}

const tokenConfigs: TokenConfig[] = [
  {
    token: ParseToken.TIMESTAMP,
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

        return [pos + startIndex, timestamp]

        // continue search through remaining string
      } while (pos <= text.length)
    }
  },
  {
    token: ParseToken.LINK,
    tokenize: (text: string) => {
      const startIndex = text.search(LINK_REGEX)
      if (startIndex === -1) return
      const link = text.match(LINK_REGEX)![0]
      return [startIndex, link]
    }
  }
]

const lexParts = (parts: DescriptionFragment[]) => {
  // take multiple tokenization passes given the number of tokens
  tokenConfigs.forEach(config => {
    for (let i = 0; i < parts.length; i++) {
      const { type, content } = parts[i]
      if (type !== ParseToken.TEXT) continue

      const result = config.tokenize(content)
      if (!result) continue

      const [startIndex, value] = result
      const endIndex = startIndex + value.length

      // overwrite current index with value
      parts[i] = { type: config.token, content: value }

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

export const parseDescription = (text: string) => {
  let parts = [{ type: ParseToken.TEXT, content: text }]
  parts = lexParts(parts)
  return parts
}
