import { WebPlatform } from 'platform/web'

export class PlatformService {
  private static platform: WebPlatform

  static get() {
    if (!this.platform) {
      this.platform = new WebPlatform()
    }
    return this.platform
  }
}
