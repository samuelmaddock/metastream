import { Platform } from 'platform/types';
import { ElectronPlatform } from 'platform/electron';

class _PlatformService {
  private static platform: Platform;

  static get(): Platform {
    if (!this.platform) {
      this.platform = new ElectronPlatform();
    }

    return this.platform;
  }
}

export const PlatformService = _PlatformService.get();
