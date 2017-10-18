/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import MenuBuilder from './menu';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

if (process.env.NODE_ENV === 'development' && !process.env.WITH_STEAM) {
  require('./platform/electron/main-backend.js');
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const setupPlugins = () => {
  const dirpath = process.env.NODE_ENV === 'production' ? dirname(process.execPath) : __dirname;

  // You have to pass the filename of `widevinecdmadapter` here, it is
  // * `widevinecdmadapter.plugin` on macOS,
  // * `libwidevinecdmadapter.so` on Linux,
  // * `widevinecdmadapter.dll` on Windows.
  app.commandLine.appendSwitch('widevine-cdm-path', join(dirpath, '/lib/widevinecdmadapter.dll'));
  // The version of plugin can be got from `chrome://plugins` page in Chrome.
  app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.1008');
}

setupPlugins();

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const setupWindow = () => {
  let win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    webPreferences: {
      blinkFeatures: 'CSSBackdropFilter'
    },
    frame: false,
    titleBarStyle: 'hidden'
  });

  win.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  win.webContents.on('did-finish-load', () => {
    if (!win) {
      throw new Error('"win" is not defined');
    }
    win.show();
    win.focus();
  });

  win.on('closed', () => {
    win.removeAllListeners();
    win = null;
  });

  const menuBuilder = new MenuBuilder(win);
  menuBuilder.buildMenu();

  return win;
};

app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  let numWindows = 1;

  // Allow multiple windows for local testing
  if (process.env.NODE_ENV === 'development') {
    numWindows = parseInt(process.env.NUM_WINDOWS, 10) || 1;
    numWindows = Math.min(Math.max(numWindows, 1), 4);
  }

  for (let i = 0; i < numWindows; i++) {
    setupWindow();
  }
});
