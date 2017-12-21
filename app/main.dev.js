/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, globalShortcut } from 'electron';
import { register as registerLocalShortcut } from 'electron-localshortcut';
import { join, dirname } from 'path';
import MenuBuilder from './browser/menu';

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

const USE_ELECTRON_BACKEND = true;
if (USE_ELECTRON_BACKEND) {
  require('./renderer/platform/electron/main-backend.js');
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
  app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.1029');
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

/** Relays global shortcuts to renderer windows via IPC */
const registerMediaShortcuts = () => {
  // TODO: why the fuck do these block commands elsewhere?
  const globalCommands = [
    ['medianexttrack', 'media:next'],
    ['mediaplaypause', 'media:playpause']
  ];

  const ipcShortcut = (shortcut) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('command', shortcut);
    });
  };

  globalCommands.forEach(cmd => {
    globalShortcut.register(cmd[0], ipcShortcut.bind(null, cmd[1]));
  });

  const localCommands = [
    ['CmdOrCtrl+T', 'window:new-tab'],
    ['CmdOrCtrl+N', 'window:new-tab'],
    ['CmdOrCtrl+L', 'window:focus-url'],
    ['CmdOrCtrl+W', 'window:close'],
    ['Alt+Left', 'window:history-prev'],
    ['Cmd+Left', 'window:history-prev'],
    ['Alt+Right', 'window:history-next'],
    ['Cmd+Right', 'window:history-next'],
    ['Cmd+Right', 'window:history-next'],
    // ['Space', 'media:playpause'],
  ];

  localCommands.forEach(cmd => {
    BrowserWindow.getAllWindows().forEach(win => {
      registerLocalShortcut(win, cmd[0], () => {
        win.webContents.send('command', cmd[1]);
      });
    });
  });
};

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

  registerMediaShortcuts();
});
