/**
 * Build config for electron renderer process
 */

const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

module.exports = merge.smart(baseConfig, {
  devtool: 'source-map',

  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'app.prod.js',
    libraryTarget: 'var'
  },

  module: {
    rules: [
      // Extract all .global.css to style.css as is
      {
        test: /\.global\.css$/,
        use: ExtractTextPlugin.extract({
          use: 'css-loader',
          fallback: 'style-loader'
        })
      },
      // Pipe other styles through css modules and append to style.css
      {
        test: /^((?!\.global).)*\.css$/,
        use: ExtractTextPlugin.extract({
          use: {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]__[hash:base64:5]'
            }
          }
        })
      }
    ]
  },

  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.DefinePlugin({
      FEATURE_SESSION_BROWSER: JSON.stringify(false),
      FEATURE_DISCORD_RP: JSON.stringify(false),
      FEATURE_DISCORD_INVITE: JSON.stringify(false)
    }),

    new ExtractTextPlugin({
      filename: 'style.css',
      ignoreOrder: true
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
      openAnalyzer: process.env.OPEN_ANALYZER === 'true',
      generateStatsFile: process.env.OPEN_ANALYZER === 'true'
    })
  ]
})
