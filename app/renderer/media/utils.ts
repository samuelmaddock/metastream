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

export const parseISO8601 = (duration: string): number => {
  let a = duration.match(/\d+/g)
  if (!a) {
    return -1
  }

  let vector = a as (string | number)[]

  if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
    vector = [0, a[0], 0]
  }
  if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
    vector = [a[0], 0, a[1]]
  }
  if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
    vector = [a[0], 0, 0]
  }

  if (!vector) {
    return -1
  }

  let time = 0

  if (vector.length == 3) {
    time = time + parseInt(vector[0] as string, 10) * 3600
    time = time + parseInt(vector[1] as string, 10) * 60
    time = time + parseInt(vector[2] as string, 10)
  }

  if (vector.length == 2) {
    time = time + parseInt(vector[0] as string, 10) * 60
    time = time + parseInt(vector[1] as string, 10)
  }

  if (vector.length == 1) {
    time = time + parseInt(vector[0] as string, 10)
  }
  return time
}
