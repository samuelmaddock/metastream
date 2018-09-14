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
	<a href="https://github.com/samuelmaddock/metastream/releases"><img src="https://img.shields.io/github/release/samuelmaddock/metastream.svg" alt="github release version"></a>
</p>

## Features

- Runs on Windows and macOS.
- Synchronized playback of streaming media across various websites.
- Public, private, and offline sessions.
- Support for P2P (WebRTC) and Direct IP (WebSocket) connections.
	- P2P uses [swarm-peer-server](https://github.com/samuelmaddock/swarm-peer-server) with 64-character hex public keys, called "friend codes".
	- Both P2P and Direct IP use client-server architecture.
- Real-time chat with peers.
- Queue of media requested by peers in session.
- [Timestamp cue points](./resources/screenshots/screenshot2.png) parsed from media description.
- Per-user playback permissions, managed by the host.
- Basic host administrative functionality (kicking peers).
- Partial [support for Chrome Extensions](./docs/extensions.md).

## Install

### Recommended Install

Download the latest version of Metastream from
[the official website](https://getmetastream.com).

### Advanced Install

- Download specific installer files from the [GitHub releases](https://github.com/samuelmaddock/metastream/releases) page.

- Try the (unstable) development version by cloning the Git repository. See the
  ["How to Contribute"](#how-to-contribute) instructions.

## Screenshots

![Screenshot1](./resources/screenshots/screenshot1.png)

![Screenshot2](./resources/screenshots/screenshot2.png)

![Screenshot3](./resources/screenshots/screenshot3.png)

## How to Contribute

### Get the code

```
$ git clone https://github.com/samuelmaddock/metastream.git
$ cd metastream
$ yarn
```

### Run the app

```
$ yarn dev
```

### Package the app

Builds app binaries for the host architecture.

```
$ yarn package
```

### Build notes

The version of Electron used in the release app depends on a fork which is not yet automatically used in the current build process. It can be manually downloaded from [samuelmaddock/muon](https://github.com/samuelmaddock/muon/releases). Once downloaded, place the ZIP into `~/.electron`
