import { LicenseWebpackPlugin } from 'license-webpack-plugin'

/**
 * Base webpack prod config used across other specific configs
 */

export default {
  plugins: [
    new LicenseWebpackPlugin({
      pattern: /.*/,
      unacceptablePattern: /GPL/,
      abortOnUnacceptableLicense: true,
      additionalPackages: [
        'utp-native'
      ],
      modulesDirectories: [
        'node_modules',
        'app/node_modules'
      ]
    })
  ]
};
