let EMOJI_REGEX: RegExp

try {
  // Need to use constructor to avoid syntax parsing error in Firefox
  EMOJI_REGEX = new RegExp('\\p{Emoji}', 'gu')
} catch {
  // Fallback for browsers not supporting Unicode Property Escapes.
  EMOJI_REGEX = /([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D])/g
}

export const stripEmoji = (str: string) => str.replace(EMOJI_REGEX, '')
