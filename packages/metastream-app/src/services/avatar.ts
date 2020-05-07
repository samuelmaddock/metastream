import { assetUrl } from 'utils/appUrl'

interface AvatarType {
  name: string
  order: number
  resolver: (...args: string[]) => string | undefined
}

/** Unprocessed avatar entry. */
interface RawAvatarEntry {
  type: string
  params: string[]

  /** Artist */
  artist?: string

  /** Link to artist. */
  href?: string

  /** Whether avatar uri may contain Personally identifiable information */
  pii?: boolean
}

export interface AvatarEntry extends RawAvatarEntry {
  /** Unresolved avatar URI. */
  uri: string

  /** Resolved URL for avatar. */
  src: string
}

let avatarRegistry: AvatarRegistry | undefined

/** Avatar registry with support for multiple sources and URL resolution. */
export class AvatarRegistry implements ArrayLike<AvatarEntry> {
  static getInstance() {
    if (!avatarRegistry) {
      avatarRegistry = new AvatarRegistry()
      initAppAvatars()
    }
    return avatarRegistry
  }

  private types: Map<AvatarType['name'], AvatarType> = new Map()
  private avatars: AvatarEntry[] = []

  readonly [n: number]: AvatarEntry
  get length() {
    return this.avatars.length
  }

  private constructor() {}

  /** Register avatar type. */
  registerType(
    name: AvatarType['name'],
    resolver: AvatarType['resolver'],
    order: AvatarType['order'] = 0
  ): void {
    this.types.set(name, { name, resolver, order })
  }

  /** Register avatar. */
  register(avatar: RawAvatarEntry): AvatarEntry {
    const avatarType = this.types.get(avatar.type)

    if (!avatarType) {
      throw new Error(`Attempt to register avatar with unknown type '${avatar.type}'`)
    }

    const src = avatarType.resolver(...avatar.params)
    if (!src) {
      throw new Error(`Attempt to register avatar with invalid params '${avatar.params.join(',')}'`)
    }

    const uri = `${avatar.type}:${avatar.params.join(',')}`
    const entry = { ...avatar, uri, src }
    this.avatars.push(entry)
    this.sort()
    return entry
  }

  /** Resolve avatar URI. */
  resolve(uri: string): string | undefined {
    const [typeName, _params] = uri.split(':')
    const params = _params.split(',')

    const avatarType = this.types.get(typeName)
    if (!avatarType) {
      throw new Error(`Attempt to resolve avatar with unknown type '${typeName}'`)
    }

    return avatarType.resolver(...params)
  }

  getAll(): AvatarEntry[] {
    return this.avatars
  }

  getByURI(uri: string) {
    return this.avatars.find(avatar => avatar.uri === uri)
  }

  deleteByURI(uri: string) {
    this.avatars = this.avatars.filter(avatar => avatar.uri !== uri)
  }

  private sort() {
    this.avatars.sort((a, b) => {
      const typeA = this.types.get(a.type)!
      const typeB = this.types.get(b.type)!
      if (typeA.order > typeB.order) return 1
      if (typeA.order < typeB.order) return -1
      return 0
    })
  }
}

const pastelColors = [
  ['beebe9', 'f4dada', 'ffb6b9', 'f6eec7'], // https://colorhunt.co/palette/172665
  ['721b65', 'b80d57', 'f8615a', 'ffd868'], // https://colorhunt.co/palette/175336
  ['b590ca', 'a8d3da', 'f5cab3', 'f3ecb8'], // https://colorhunt.co/palette/175341
  ['2a1a5e', 'f45905', 'fb9224', 'fbe555'] // https://colorhunt.co/palette/158955
]

/** Procedurally generate an SVG gradient given a hex string. */
function generateGradientSvg(hex: string) {
  const buf = Buffer.from(hex.substr(0, 8), 'hex')
  const palette = pastelColors[buf.readUInt8(0) % pastelColors.length]
  const paletteLen = palette.length
  const startIndex = buf.readUInt8(1) % paletteLen
  const startColor = palette[startIndex]
  let endIndex = buf.readUInt8(2) % paletteLen
  endIndex =
    startIndex === endIndex ? (endIndex + Math.floor(paletteLen / 2)) % paletteLen : endIndex
  const endColor = palette[endIndex]
  const rotateDeg = buf.readUInt8(3) % 360
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'>
<linearGradient id='g' gradientTransform='rotate(${rotateDeg} 0.5 0.5)'>
  <stop offset='0%' stop-color='%23${startColor}'></stop>
  <stop offset='100%' stop-color='%23${endColor}'></stop>
</linearGradient>
<circle cx='50%' cy='50%' r='50%' fill='url(%23g)' />
</svg>`
}

function initAppAvatars() {
  const reg = AvatarRegistry.getInstance()

  reg.registerType(
    'uid',
    (hash: string) => {
      if (typeof hash !== 'string') return
      const svg = generateGradientSvg(hash)
      const uri = 'data:image/svg+xml;utf8,' + svg
      return uri
    },
    -1
  )

  reg.registerType('asset', (fileName: string) => {
    if (fileName && fileName.indexOf('..') > -1) return
    return assetUrl(`avatars/${fileName}`)
  })

  const artistAvatars = [
    {
      name: '@Alisa_Aydin',
      href: 'https://twitter.com/Alisa_Aydin',
      fileNames: [
        'alisa-aydin_luna.png',
        'alisa-aydin_sailor-moon.png',
        'alisa-aydin_luna-zoom.png'
      ]
    }
  ]

  artistAvatars.forEach(artist => {
    artist.fileNames.forEach(fileName => {
      reg.register({
        type: 'asset',
        artist: artist.name,
        href: artist.href,
        params: [fileName]
      })
    })
  })
}
