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

interface AvatarEntry extends RawAvatarEntry {
  /** Resolved URL for avatar. */
  url: string
}

/** Avatar registry with support for multiple sources and URL resolution. */
class AvatarRegistry {
  private types: Map<AvatarType['name'], AvatarType['resolver']> = new Map()
  private avatars: AvatarEntry[] = []

  /** Register avatar type. */
  registerType(name: AvatarType['name'], resolver: AvatarType['resolver']): void {
    this.types.set(name, resolver)
  }

  /** Register avatar. */
  register(avatar: RawAvatarEntry): void {
    const resolver = this.types.get(avatar.type)

    if (!resolver) {
      throw new Error(`Attempt to register avatar with unknown type '${avatar.type}'`)
    }

    const url = resolver(...avatar.params)
    if (!url) {
      throw new Error(`Attempt to register avatar with invalid params '${avatar.params.join(',')}'`)
    }

    this.avatars.push({ ...avatar, url })
  }

  /** Resolve avatar URI. */
  resolve(uri: string): string | undefined {
    const [typeName, ...params] = uri.split(',')

    const resolver = this.types.get(typeName)
    if (!resolver) {
      throw new Error(`Attempt to resolve avatar with unknown type '${typeName}'`)
    }

    return resolver(...params)
  }

  getAll(): AvatarEntry[] {
    return this.avatars
  }
}

export const avatarRegistry = new AvatarRegistry()

function initAppAvatars() {
  avatarRegistry.registerType('asset', (fileName: string) => {
    return assetUrl(`avatars/${fileName}`)
  })

  const localAvatars = ['default.svg']

  localAvatars.forEach(fileName => {
    avatarRegistry.register({ type: 'asset', params: [fileName] })
  })
}

initAppAvatars()
