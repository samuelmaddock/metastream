# Native Dependencies

- App native dependencies are stored in `app/package.json`.
- They're excluded from the webpack build as externals.
- Requires VS2015.

## utp-native

```bash
cd app/node_modules/utp-native
GYP_MSVS_VERSION=2015 node-gyp rebuild --runtime=electron --target=4.8.1 --disturl=https://brave-laptop-binaries.s3.amazonaws.com/atom-shell/dist/ --abi=55
```
