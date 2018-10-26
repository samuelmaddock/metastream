import { assetUrl } from 'utils/appUrl'

interface AvatarType {
  name: string
  resolver: (...args: string[]) => string | undefined
}

/** Unprocessed avatar entry. */
interface RawAvatarEntry {
  type: string
  params: string[]
}

export interface AvatarEntry extends RawAvatarEntry {
  /** Unresolved avatar URI. */
  uri: string

  /** Resolved URL for avatar. */
  src: string
}

/** Avatar registry with support for multiple sources and URL resolution. */
class AvatarRegistry implements ArrayLike<AvatarEntry> {
  private types: Map<AvatarType['name'], AvatarType['resolver']> = new Map()
  private avatars: AvatarEntry[] = []

  readonly [n: number]: AvatarEntry
  get length() {
    return this.avatars.length
  }

  /** Register avatar type. */
  registerType(name: AvatarType['name'], resolver: AvatarType['resolver']): void {
    this.types.set(name, resolver)
  }

  /** Register avatar. */
  register(avatar: RawAvatarEntry): AvatarEntry {
    const resolver = this.types.get(avatar.type)

    if (!resolver) {
      throw new Error(`Attempt to register avatar with unknown type '${avatar.type}'`)
    }

    const src = resolver(...avatar.params)
    if (!src) {
      throw new Error(`Attempt to register avatar with invalid params '${avatar.params.join(',')}'`)
    }

    const uri = `${avatar.type}:${avatar.params.join(',')}`
    const entry = { ...avatar, uri, src }
    this.avatars.push(entry)
    return entry
  }

  /** Resolve avatar URI. */
  resolve(uri: string): string | undefined {
    const [typeName, _params] = uri.split(':')
    const params = _params.split(',')

    const resolver = this.types.get(typeName)
    if (!resolver) {
      throw new Error(`Attempt to resolve avatar with unknown type '${typeName}'`)
    }

    return resolver(...params)
  }

  getAll(): AvatarEntry[] {
    return this.avatars
  }

  deleteByURI(uri: string) {
    this.avatars = this.avatars.filter(avatar => avatar.uri !== uri)
  }
}

export const avatarRegistry = new AvatarRegistry()

function initAppAvatars() {
  avatarRegistry.registerType('asset', (fileName: string) => {
    if (fileName && fileName.indexOf('..') > -1) return
    return assetUrl(`avatars/${fileName}`)
  })

  const localAvatars = ['default.svg']

  localAvatars.forEach(fileName => {
    avatarRegistry.register({ type: 'asset', params: [fileName] })
  })
}

initAppAvatars()
