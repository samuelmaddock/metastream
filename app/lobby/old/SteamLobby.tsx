import * as React from 'react';
import { steamworks } from "steam";
import { LobbyComponent, ILobbyProps } from "lobby/types";

interface IProps {
  host: boolean;
  steamId: string;
  protocolLobby?: React.ComponentClass<ILobbyProps>;
}

interface IState {
  connected: boolean;
}

export class SteamMatchmakingLobby extends React.Component<IProps, IState> {
  private subLobby: LobbyComponent | null;

  get steamId() { return this.props.steamId; }
  get host() { return this.props.host; }
  get connected() { return this.state.connected; }

  constructor() {
    super();

    this.state = {
      connected: false
    }
  }

  componentDidMount(): void {
    if (this.host) {
      this.lobbyDidJoin();
    } else {
      steamworks.joinLobby(this.steamId, this.lobbyDidJoin.bind(this));
    }
    window.addEventListener('beforeunload', this.beforeUnload, false);
  }

  componentWillUnmount(): void {
    window.removeEventListener('beforeunload', this.beforeUnload, false);
    this.lobbyWillClose();
  }

  private beforeUnload = (e: BeforeUnloadEvent) => {
    this.lobbyWillClose();
  }

  render(): JSX.Element {
    const ProtocolLobby = this.props.protocolLobby;

    const owner = steamworks.getLobbyOwner(this.steamId);
    const ownerSteamId = owner ? owner.getRawSteamID() : '-1';

    const local = steamworks.getSteamId();

    return (
      <div>
        steam lobby: {this.props.steamId}
        {ProtocolLobby && (
          <ProtocolLobby
            ref={e => {
              if (e) {
                this.setLobby(e as LobbyComponent);
              } else {
                this.unsetLobby();
              }
            }}
            host={this.host}
            hostId={ownerSteamId}
            localId={local.getRawSteamID()}
            lobbySend={this.lobbySend} />
        )}
      </div>
    );
  }

  private setLobby(lobby: LobbyComponent): void {
    this.subLobby = lobby;
  }

  private unsetLobby(): void {
    if (this.subLobby) {
      this.subLobby = null;
    }
  }

  private lobbyWillClose(): void {
    if (this.connected) {
      this.lobbyWillLeave();
      steamworks.leaveLobby(this.steamId);
      this.setState({ connected: false });
    }
  }

  private lobbyDidJoin(): void {
    this.setState({ connected: true });

    steamworks.on('lobby-chat-message', this.lobbyDidReceive);

    if (this.subLobby) {
      this.subLobby.lobbyConnect();
    }
  }

  private lobbyWillLeave(): void {
    steamworks.removeListener('lobby-chat-message', this.lobbyDidReceive);
  }

  private lobbyDidReceive = (lobbySteamId: Steamworks.SteamID, userSteamId: Steamworks.SteamID, type: any, chatId: number) => {
    // Ignore messages from self
    const localSteamId = steamworks.getSteamId();
    if (userSteamId.getRawSteamID() === localSteamId.getRawSteamID()) {
      return;
    }

    if (this.subLobby) {
      const msg = steamworks.getLobbyChatEntry(this.steamId, chatId);
      this.subLobby.lobbyReceive({
        userId: userSteamId.getRawSteamID(),
        data: msg.message
      });
    }
  }

  private lobbySend = (data: Buffer) => {
    steamworks.sendLobbyChatMsg(this.steamId, data);
  }
}
