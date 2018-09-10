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
