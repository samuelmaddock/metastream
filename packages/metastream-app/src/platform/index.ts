import { WebPlatform } from 'platform/web'

class _PlatformService {
  private static platform: WebPlatform

  static get() {
    if (!this.platform) {
      this.platform = new WebPlatform()
    }
    return this.platform
  }
}

export const PlatformService = _PlatformService.get()
