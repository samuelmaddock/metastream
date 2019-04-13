import { Platform } from 'platform/types'
import { WebPlatform } from 'platform/web'

class _PlatformService {
  private static platform: Platform

  static get(): Platform {
    if (!this.platform) {
      this.platform = new WebPlatform()
    }

    return this.platform
  }
}

export const PlatformService = _PlatformService.get()
