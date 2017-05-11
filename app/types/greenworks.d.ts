declare module Steamworks {
  interface Steamworks {
    _version: string;

    FriendFlags: typeof FriendFlags;
    FriendRelationship: typeof FriendRelationship;
    PersonaChange: typeof PersonaChange;
    AccountType: typeof AccountType;
    ChatEntryType: typeof ChatEntryType;

    initAPI(): boolean;

    getFriendCount(friend_flag: FriendFlags): number;
    getFriends(friend_flag: FriendFlags): SteamID[];
    requestUserInformation(raw_steam_id: SteamID64, require_name_only: boolean): void;
  }

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
}

interface NodeRequireFunction {
	(moduleName: 'greenworks'): Steamworks.Steamworks;
}
