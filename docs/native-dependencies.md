# Native Dependencies

- App native dependencies are stored in `app/package.json`.
- They're excluded from the webpack build as externals.
- Requires VS2015.

## sodium-native

1. Open `app\node_modules\sodium-native\libsodium\libsodium.sln` in Visual Studio 2015.
1. Compile target=ReleaseDLL arch=x64
1. Rebuild node module
```bash
cd app/node_modules/sodium-native
GYP_MSVS_VERSION=2015 node-gyp rebuild --runtime=electron --target=4.8.1 --disturl=https://brave-laptop-binaries.s3.amazonaws.com/atom-shell/dist/ --abi=55
```
4. Copy `libsodium\Build\ReleaseDLL\x64\libsodium.dll` to `build\Release`

## utp-native

```bash
cd app/node_modules/sodium-native
GYP_MSVS_VERSION=2015 node-gyp rebuild --runtime=electron --target=4.8.1 --disturl=https://brave-laptop-binaries.s3.amazonaws.com/atom-shell/dist/ --abi=55
```
