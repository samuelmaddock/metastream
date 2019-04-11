import { Platform } from 'platform/types'

class _PlatformService {
  private static platform: Platform

  static get(): Platform {
    throw new Error('Not yet implemented')
  }
}

export const PlatformService = _PlatformService.get()
