import { Platform } from 'renderer/platform/types'
import { SwarmPlatform } from 'renderer/platform/swarm'

class _PlatformService {
  private static platform: Platform

  static get(): Platform {
    if (!this.platform) {
      this.platform = new SwarmPlatform()
    }

    return this.platform
  }
}

export const PlatformService = _PlatformService.get()
