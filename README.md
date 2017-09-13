# Media Player

https://trello.com/b/eNsQaaiA/media-player

### Install

1. [Setup Greenworks dependencies](https://github.com/samuelmaddock/greenworks#general-usage-requirements)
2. Install node dependencies
```bash
yarn
```

### App
```bash
# Run in development
npm run build-preload
npm run dev

# Run multiple windows of the app; doesn't work with Steam
NUM_WINDOWS=2 npm run dev

# Run with Steam; Steam must be running
WITH_STEAM=1 npm run dev
```
