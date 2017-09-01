import { Platform } from "platform/types";
import { SteamPlatform } from "platform/steam";
import { ElectronPlatform } from "platform/electron";

class _PlatformService {
  private static platform: Platform;

  static get(): Platform {
    if (!this.platform) {
      this.platform = process.env.NODE_ENV === 'production' || process.env.WITH_STEAM ?
        new SteamPlatform() :
        new ElectronPlatform();
    }

    return this.platform;
  }
}

export const PlatformService = _PlatformService.get();
