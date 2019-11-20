const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const chalk = require('chalk')
const merge = require('webpack-merge')
const { spawn, execSync } = require('child_process')

const baseConfig = require('./webpack.config.base')

const port = process.env.PORT || 8080
const protocol = process.env.USE_HTTPS ? 'https' : 'http'
const publicPath = `${protocol}://localhost:${port}/`

module.exports = merge.smart(baseConfig, {
  devtool: 'inline-source-map',

  entry: [
    'react-hot-loader/patch',
    `webpack-dev-server/client?${publicPath}`,
    'webpack/hot/only-dev-server',
    path.join(__dirname, 'src/index.tsx')
  ],

  output: {
    publicPath,
    libraryTarget: 'var'
  },

  module: {
    rules: [
      {
        test: /\.global\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          },
          'postcss-loader',
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]__[hash:base64:5]'
            }
          },
          'postcss-loader',
        ]
      }
    ]
  },

  plugins: [
    /**
     * https://webpack.js.org/concepts/hot-module-replacement/
     */
    new webpack.HotModuleReplacementPlugin(),

    new webpack.NoEmitOnErrorsPlugin(),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.DefinePlugin({
      FEATURE_SESSION_BROWSER: JSON.stringify(false),
      FEATURE_POPUP_PLAYER: JSON.stringify(true)
    })

    // new webpack.LoaderOptionsPlugin({
    //   debug: true
    // }),
  ],

  devServer: {
    port,
    publicPath,
    // compress: true,
    // noInfo: true,
    // stats: 'errors-only',
    // inline: true,
    // lazy: false,
    // hot: true,
    disableHostCheck: true,
    // headers: { 'Access-Control-Allow-Origin': '*' },
    watchOptions: {
      aggregateTimeout: 300,
      ignored: /node_modules/,
      poll: 100
    },
    https: process.env.USE_HTTPS ? {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    } : undefined
    // historyApiFallback: {
    //   verbose: true,
    //   disableDotRule: false
    // }
  }
})
