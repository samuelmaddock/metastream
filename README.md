<h1 align="center">
  <br>
  <a href="https://getmetastream.com">
    <img src="./resources/icon.png" alt="Metastream" width="200">
  </a>
  <br>
  Metastream
  <br>
  <br>
</h1>

<h4 align="center">Watch streaming media with friends.</h4>

<p align="center">
  <a href="https://discord.gg/nfwPRb9"><img src="https://img.shields.io/badge/discord-chat-brightgreen.svg" alt="discord"></a>
  <a href="https://www.patreon.com/metastream"><img src="https://img.shields.io/badge/patreon-donate-brightgreen.svg" alt="patreon"></a>
</p>

## Features

- Supports Chromium and Firefox browsers.
- Synchronized playback of streaming media across various websites.
- Public, private, and offline sessions.
- Support for WebRTC peer-to-peer connections.
- Real-time chat with peers.
- Queue of media requested by peers in session.
- [Timestamp cue points](./resources/screenshots/screenshot2.png) parsed from media description.
- Auto-fullscreen of embedded media players on websites.
- Per-user playback permissions, managed by the host.
- Basic host administrative functionality (kicking peers).
- Localization—[see info on contributing](./app/locale).

## Roadmap

- [x] Add localization ([#5](https://github.com/samuelmaddock/metastream/issues/5))
- [x] Improve networking reliability ([#74](https://github.com/samuelmaddock/metastream/issues/74))
- [ ] Port Metastream from Electron to a web app ([#94](https://github.com/samuelmaddock/metastream/issues/94))
- [ ] Add favorites/bookmarks ([#21](https://github.com/samuelmaddock/metastream/issues/21))
- [ ] Add playlists
- [ ] Add audio mode ([#22](https://github.com/samuelmaddock/metastream/issues/22))

Have a feature in mind? Make a request by [creating a GitHub issue](https://github.com/samuelmaddock/metastream/issues).

## Screenshots

![Screenshot1](./resources/screenshots/screenshot1.png)

![Screenshot2](./resources/screenshots/screenshot2.png)

![Screenshot3](./resources/screenshots/screenshot3.png)

## How to Contribute

### Get the code

Requires [Yarn](https://yarnpkg.com) for monorepo workspaces.

```
git clone https://github.com/samuelmaddock/metastream.git
cd metastream
yarn
```

### Start the dev server

Creates a development web server accessible from [http://localhost:8080](http://localhost:8080)

```
cd packages/metastream-app
yarn start
```

### Build the web app

Produces the web app build which gets deployed to [https://app.getmetastream.com](https://app.getmetastream.com)

```
cd packages/metastream-app
yarn build
```

## Legacy desktop app

Metastream used to be an Electron desktop application. The latest version can be found on the [GitHub releases](https://github.com/samuelmaddock/metastream/releases) page. Please note that **the legacy app is insecure and not recommended.**
