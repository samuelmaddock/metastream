/**
 * Greenworks
 * https://github.com/greenheartgames/greenworks/tree/master/docs
 */
declare module Steamworks {
  interface API {
    _version: string;

    // AUTHENTICATION
    // https://github.com/greenheartgames/greenworks/blob/master/docs/authentication.md
    getAuthSessionTicket(success: (ticket: IAuthSessionTicket) => void, error: ErrorCallback): void;
    cancelAuthTicket(ticket_handle: Handle): void;
    getEncryptedAppTicket(user_data: string, success: (encrypted_ticket: Buffer) => void, error: ErrorCallback): void;
    decryptAppTicket(encrypted_ticket: Buffer, decryption_key: Buffer): Buffer | null;
    isTicketForApp(decrypted_ticket: Buffer, app_id: number): boolean;
    getTicketIssueTime(decrypted_ticket: Buffer): number;
    getTicketSteamId(decrypted_ticket: Buffer): SteamID;
    getTicketAppId(decrypted_ticket: Buffer): number;

    // SETTING
    // https://github.com/greenheartgames/greenworks/blob/master/docs/setting.md
    initAPI(): boolean;
    init(): boolean;
    isSteamRunning(): boolean;
    restartAppIfNecessary(appId: number): boolean;
    getAppId(): number;
    getSteamId(): SteamID;
    getCurrentGameLanguage(): string;
    getCurrentUILanguage(): string;
    getCurrentGameInstallDir(): never;
    getNumberOfPlayers(success: (num_of_players: number) => void, error: ErrorCallback): void;
    activateGameOverlay(option: OverlayOption): void;
    isGameOverlayEnabled(): boolean;
    activateGameOverlayToWebPage(url: string): void;
    isSubscribedApp(appId: number): boolean;
    getImageSize(handle: number): { width: number; height: number; }; // TODO: verify return type
    getImageRGBA(handle: number): Buffer;

    // FRIENDS
    FriendFlags: typeof FriendFlags;
    FriendRelationship: typeof FriendRelationship;
    PersonaChange: typeof PersonaChange;
    AccountType: typeof AccountType;
    ChatEntryType: typeof ChatEntryType;
    getFriendCount(friend_flag: FriendFlags): number;
    getFriends(friend_flag: FriendFlags): SteamID[];
    requestUserInformation(raw_steam_id: SteamID64, require_name_only: boolean): void;
    getSmallFriendAvatar(raw_steam_id: SteamID64): Handle;
    getMediumFriendAvatar(raw_steam_id: SteamID64): Handle;
    getLargeFriendAvatar(raw_steam_id: SteamID64): Handle;
    setListenForFriendsMessage(intercept_enabled: boolean): boolean;
    replyToFriendMessage(raw_steam_id: SteamID64, message: string): boolean;
    getFriendMessage(raw_steam_id: SteamID64, message_id: number, maximum_message_size: number): string;

    // MATCHMAKING
    LobbyType: typeof LobbyType;
    LobbyComparison: typeof LobbyComparison;
    LobbyDistanceFilter: typeof LobbyDistanceFilter;
    requestLobbyList(options: ILobbyListRequest, success: (count: number) => void): void;
    getLobbyByIndex(lobby_idx: number): SteamID;
    createLobby(lobby_type: LobbyType, max_members: number, success: (lobby_id: SteamID64) => void): void;
    joinLobby(lobby_id: SteamID64, success: (lobby_id: SteamID64) => void): void;
    leaveLobby(lobby_id: SteamID64): void;
    inviteUserToLobby(lobby_id: SteamID64, user_id: SteamID64): boolean;
    getLobbyData(lobby_id: SteamID64, key: string): string;
    setLobbyData(lobby_id: SteamID64, key: string, value: string): boolean;
    getLobbyDataCount(lobby_id: SteamID64): number;
    getLobbyDataByIndex(lobby_id: SteamID64, data_idx: number): [string, string];
    sendLobbyChatMsg(lobby_id: SteamID64, msg: Buffer): boolean;
    getLobbyChatEntry(lobby_id: SteamID64, chat_id: number): { steamId: SteamID64; message: Buffer };
  }

  type Handle = number;
  type ErrorCallback = (err: string) => void;

  //
  // AUTHENTICATION
  //

  interface IAuthSessionTicket {
    ticket: Buffer;
    handle: Handle;
  }

  //
  // FRIENDS
  //

  /**
   * Represents Steam SDK `EFriendFlags`, for enumerating friends list, or
   * quickly checking a the relationship between users.
   */
  enum FriendFlags {
    None = 0,
    Blocked = 1 << 0,
    FriendshipRequested = 1 << 1,
    Immediate = 1 << 2,
    ClanMember = 1 << 3,
    OnGameServer = 1 << 4,
    RequestingFriendship = 1 << 7,
    RequestingInfo = 1 << 8,
    Ignored = 1 << 9,
    IgnoredFriend = 1 << 10,
    ChatMember = 1 << 12,
    All = 1 << 16
  }

  /**
   * Represents Steam SDK EFriendRelationship (set of relationships to other users).
   */
  enum FriendRelationship {
    None,
    Blocked,
    RequestRecipient,
    Friend,
    RequestInitiator,
    Ignored,
    IgnoredFriend
  }

  /**
   * Represents Steam SDK EPersonaChange, which is used in persona-state-change event.
   *
   * It describes what the client has learned has changed recently, so on startup you'll see a name, avatar & relationship change for every friend.
   */
  enum PersonaChange {
    Name,
    Status,
    ComeOnline,
    GoneOffline,
    GamePlayed,
    GameServer,
    Avator,
    JoinedSource,
    LeftSource,
    RelationshipChanged,
    NameFirstSet,
    FacebookInfo,
    NickName,
    SteamLevel
  }

  /**
   * Represents Steam SDK EAccountType (Steam account types).
   */
  enum AccountType {
    Invalid,
    Individual,
    Multiseat,
    GameServer,
    AnonymousGameServer,
    Pending,
    ContentServer,
    Clan,
    Chat,
    ConsoleUser,
    AnonymousUser
  }

  /**
   * Represents Steam SDK EChatEntryType (previously was only friend-to-friend message types).
   */
  enum ChatEntryType {
    Invalid,
    ChatMsg,
    Typing,
    InviteGame,
    Emote,
    LeftConversation,
    Entered,
    WasKicked,
    WasBanned,
    Disconnected,
    HistoricalChat,
    LinkBlocked
  }

  type SteamID64 = string;

  interface SteamID {
    isAnonymous(): boolean;
    isAnonymousGameServer(): boolean;
    isAnonymousGameServerLogin(): boolean;
    isAnonymousUser(): boolean;
    isChatAccount(): boolean;
    isClanAccount(): boolean;
    isConsoleUserAccount(): boolean;
    isContentServerAccount(): boolean;
    isGameServerAccount(): boolean;
    isIndividualAccount(): boolean;
    isPersistentGameServerAccount(): boolean;
    isLobby(): boolean;
    getAccountID(): number;
    getRawSteamID(): SteamID64;
    getAccountType(): AccountType;
    isValid(): boolean;
    getStaticAccountKey(): string;
    getPersonaName(): string;
    getNickname(): string;
    getRelationship(): FriendRelationship;
    getSteamLevel(): number;
  }

  //
  // SETTING
  //

  type OverlayOption = 'Friends' | 'Community' | 'Players' | 'Settings' | 'OfficialGameGroup' | 'Stats' | 'Achievements';

  //
  // MATCHMAKING
  //

  enum LobbyType {
    Private = 0,
    FriendsOnly = 1,
    Public = 2,
    Invisible = 3
  }

  enum LobbyComparison {
    EqualToOrLessThan = -2,
    LessThan = -1,
    Equal = 0,
    GreaterThan = 1,
    EqualToOrGreaterThan = 2,
    NotEqual = 3
  }

  enum LobbyDistanceFilter {
    Close,
    Default,
    Far,
    Worldwide
  }

  interface ILobbyListRequestFilter {
    key: string;
    value: string | number;
    comparator: LobbyComparison;
  }

  interface ILobbyListRequestNearFilter {
    key: string;
    value: number;
  }

  interface ILobbyListRequest {
    filters?: ILobbyListRequestFilter[];
    nearFilters?: ILobbyListRequestNearFilter[];
    slots?: number;
    distance?: LobbyDistanceFilter;
    count?: number;
    compatibleMembers?: SteamID64;
  }

  //
  // EVENTS
  // https://github.com/greenheartgames/greenworks/blob/master/docs/events.md
  //

  interface API {
    on(eventName: 'game-overlay-activated', callback: (is_active: boolean) => void): void;
    on(eventName: 'game-servers-connected', callback: Function): void;
    on(eventName: 'game-servers-disconnected', callback: Function): void;
    on(eventName: 'game-server-connect-failure', callback: Function): void;
    on(eventName: 'steam-shutdown', callback: Function): void;
    on(eventName: 'persona-state-change', callback: Function): void;
    on(eventName: 'avatar-image-loaded', callback: Function): void;
    on(eventName: 'game-connected-friend-chat-message', callback: (steam_id: SteamID, message_id: number) => void): void;
    on(eventName: 'dlc-installed', callback: (dlc_app_id: number) => void): void;
    on(eventName: 'lobby-chat-message', callback: (lobby_steam_id: SteamID, user_steam_id: SteamID, type: any, chat_id: number) => void): void;

    removeListener(eventName: string, callback: Function): void;
  }
}

interface NodeRequireFunction {
	(moduleName: 'greenworks'): Steamworks.API;
}
