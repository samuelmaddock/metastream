import { NetUniqueId } from 'network';

export class SteamUniqueId extends NetUniqueId<Steamworks.SteamID> {
  toString(): string {
    return this.id.getRawSteamID();
  }
}
