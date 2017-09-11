import { NetUniqueId } from 'lobby/types';

export class SteamUniqueId extends NetUniqueId<Steamworks.SteamID> {
  toString(): string {
    return this.id.getRawSteamID();
  }
}
