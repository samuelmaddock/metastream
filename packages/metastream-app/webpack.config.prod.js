/**
 * Build config for electron renderer process
 */

const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

const LOCAL_SRC = path.join(__dirname, 'src')

module.exports = merge.smart(baseConfig, {
  devtool: 'source-map',

  entry: path.join(__dirname, 'src/index.tsx'),

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
        include: LOCAL_SRC,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      // Pipe other styles through css modules and append to style.css
      {
        test: /^((?!\.global).)*\.css$/,
        include: LOCAL_SRC,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]__[hash:base64:5]'
            }
          }
        ]
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

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
      openAnalyzer: process.env.OPEN_ANALYZER === 'true',
      generateStatsFile: process.env.OPEN_ANALYZER === 'true'
    }),

    new MiniCssExtractPlugin({
      filename: 'style.css'
    }),

    new GenerateSW({
      importWorkboxFrom: 'local',
      exclude: ['CNAME', '404.html', 'robots.txt']
    })
  ]
})
