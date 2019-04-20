/**
 * Base webpack config used across other specific configs
 */

const path = require('path')
const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const childProcess = require('child_process')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const GIT_BRANCH = childProcess
  .execSync('git rev-parse --abbrev-ref HEAD')
  .toString()
  .trim()
const GIT_COMMIT = childProcess
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim()

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  target: 'web',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'awesome-typescript-loader',
          options: {
            silent: true,
            useBabel: false,
            useCache: process.env.NODE_ENV === 'development'
          }
        }
      },
      // WOFF Font
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      // WOFF2 Font
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/font-woff'
          }
        }
      },
      // TTF Font
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            mimetype: 'application/octet-stream'
          }
        }
      },
      // EOT Font
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        use: 'file-loader'
      },
      // Common Image Formats
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
        use: 'url-loader'
      }
    ]
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.dev.js',
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'],
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    alias: {
      styles: path.join(__dirname, 'src/styles')
    }
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      GIT_BRANCH,
      GIT_COMMIT
    }),
    new Dotenv({ silent: true }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src/index.html')
    }),
    new CopyWebpackPlugin([
      { from: path.join(__dirname, 'src/assets'), to: path.join(__dirname, 'dist/assets') },
      {
        from: '*.global.css',
        to: path.join(__dirname, 'dist/styles'),
        context: path.join(__dirname, 'src/styles')
      },
      {
        from: path.join(__dirname, 'src/styles/common'),
        to: path.join(__dirname, 'dist/styles/common')
      },
      {
        from: path.join(__dirname, 'public'),
        to: path.join(__dirname, 'dist')
      }
    ])
  ]
}
