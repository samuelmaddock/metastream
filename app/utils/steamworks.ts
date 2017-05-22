export const getLobbyData = (steamworks: Steamworks.API, lobbyId: Steamworks.SteamID): {[key: string]: string} => {
  let data: any = {};
  const numData = steamworks.getLobbyDataCount(lobbyId.getRawSteamID());
  for (let i = 0; i < numData; i++) {
    const [key, value] = steamworks.getLobbyDataByIndex(lobbyId.getRawSteamID(), i);
    data[key] = value;
  }
  return data;
};
