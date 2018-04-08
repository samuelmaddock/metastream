import { IMediaItem } from 'renderer/lobby/reducers/mediaPlayer'
import { parseTimestampPairs, timestampToMilliseconds } from 'utils/cuepoints'

// TODO: don't import from component
import { CuePointItem } from 'renderer/components/media/CuePoint'

const cuePointMap = new WeakMap<IMediaItem, CuePointItem[]>()

export const parseCuePoints = (media: IMediaItem) => {
  if (cuePointMap.has(media)) {
    return cuePointMap.get(media)
  }

  let result

  if (media.description) {
    result = parseTimestampPairs(media.description).map((pair, idx) => {
      const cue = {
        label: pair[1],
        value: timestampToMilliseconds(pair[0])
      }
      return cue
    })

    cuePointMap.set(media, result)
  }

  return result
}

const getLongerString = (a?: string, b?: string): string | undefined => {
  if (a && b) {
    return a.length > b.length ? a : b
  } else {
    return a || b
  }
}

export const mergeMetadata = (base: any, ...objs: any[]): void => {
  for (let i = 0; i < objs.length; i++) {
    const obj = objs[i]
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        switch (k) {
          case 'description':
            base[k] = getLongerString(base[k], obj[k])
            break
          default:
            base[k] = typeof obj[k] !== 'undefined' ? obj[k] : base[k]
        }
      }
    }
  }
}

/** Mimic Node.innerText */
function cheerioElementToText(this: CheerioElement): string {
  if (this.type === 'text') {
    return (this as any).data
  }

  switch (this.tagName) {
    case 'br':
      return '\n'
    default:
      return this.children.map(el => cheerioElementToText.call(el)).join('')
  }
}

export const parseHtmlDescription = (node: Cheerio): string => {
  if (node.length === 1) {
    return cheerioElementToText.call(node.get(0))
  }
  const texts = node
    .children()
    .toArray()
    .map((i, el) => cheerioElementToText.call(el))
    .join('')
  return texts
}
