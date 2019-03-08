/**
 * Base webpack config used across other specific configs
 */

import path from 'path';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack'
import childProcess from 'child_process';
import { dependencies as externals } from './app/package.json';

const GIT_BRANCH = childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const GIT_COMMIT = childProcess.execSync('git rev-parse --short HEAD').toString().trim();

export default {
  mode: process.env.NODE_ENV || 'development',
  externals: Object.keys(externals || {}),

  module: {
    rules: [{
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'awesome-typescript-loader',
        options: {
          silent: true,
          useBabel: false,
          useCache: true
        }
      }
    }]
  },

  output: {
    path: path.join(__dirname, 'app'),
    filename: 'renderer.dev.js',
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },

  optimization: {
    minimize: false
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.mjs', '.json'],
    modules: [
      path.join(__dirname, 'app'),
      'node_modules',
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.GIT_BRANCH': JSON.stringify(GIT_BRANCH),
      'process.env.GIT_COMMIT': JSON.stringify(GIT_COMMIT),
      'process.env.LICENSED': Boolean(process.env.LICENSED)
    }),
    new Dotenv({ silent: true }),
    new webpack.NamedModulesPlugin(),
  ],
};
