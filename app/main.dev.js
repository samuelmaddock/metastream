module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./app/main.dev.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./app/browser/asset-protocol.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = registerAssetProtocol;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_path__ = __webpack_require__("path");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_path__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_electron__ = __webpack_require__("electron");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_electron___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_electron__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_constants_path__ = __webpack_require__("./app/constants/path.ts");



function registerAssetProtocol() {
    __WEBPACK_IMPORTED_MODULE_1_electron__["protocol"].registerFileProtocol('asset', (request, callback) => {
        let relativePath = __WEBPACK_IMPORTED_MODULE_0_path___default.a.normalize(request.url.substr(7));
        let filePath = __WEBPACK_IMPORTED_MODULE_0_path___default.a.join(__WEBPACK_IMPORTED_MODULE_2_constants_path__["a" /* ASSETS_PATH */], relativePath);
        filePath = filePath.split('#').shift();
        callback(filePath);
    });
}


/***/ }),

/***/ "./app/browser/menu.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_electron__ = __webpack_require__("electron");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_electron___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_electron__);

class MenuBuilder {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }
    buildMenu() {
        if (true) {
            this.setupDevelopmentEnvironment();
        }
        let template;
        if (process.platform === 'darwin') {
            template = this.buildDarwinTemplate();
        }
        else {
            template = this.buildDefaultTemplate();
        }
        const menu = __WEBPACK_IMPORTED_MODULE_0_electron__["Menu"].buildFromTemplate(template);
        __WEBPACK_IMPORTED_MODULE_0_electron__["Menu"].setApplicationMenu(menu);
        return menu;
    }
    setupDevelopmentEnvironment() {
        this.mainWindow.openDevTools();
        this.mainWindow.webContents.on('context-menu', (e, props) => {
            const { x, y } = props;
            __WEBPACK_IMPORTED_MODULE_0_electron__["Menu"].buildFromTemplate([
                {
                    label: 'Inspect element',
                    click: () => {
                        this.mainWindow.inspectElement(x, y);
                    }
                }
            ]).popup(this.mainWindow);
        });
    }
    buildDarwinTemplate() {
        const subMenuAbout = {
            label: 'Media Player',
            submenu: [
                { label: 'About Media Player', selector: 'orderFrontStandardAboutPanel:' },
                { type: 'separator' },
                { label: 'Services', submenu: [] },
                { type: 'separator' },
                { label: 'Hide Media Player', accelerator: 'Command+H', selector: 'hide:' },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    selector: 'hideOtherApplications:'
                },
                { label: 'Show All', selector: 'unhideAllApplications:' },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: () => {
                        __WEBPACK_IMPORTED_MODULE_0_electron__["app"].quit();
                    }
                }
            ]
        };
        const subMenuEdit = {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
                { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
                { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
                { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
                { label: 'Select All', accelerator: 'Command+A', selector: 'selectAll:' }
            ]
        };
        const subMenuViewDev = {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'Command+R',
                    click: () => {
                        this.mainWindow.webContents.reload();
                    }
                },
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'Alt+Command+I',
                    click: () => {
                        this.mainWindow.toggleDevTools();
                    }
                }
            ]
        };
        const subMenuViewProd = {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Full Screen',
                    accelerator: 'Ctrl+Command+F',
                    click: () => {
                        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                    }
                }
            ]
        };
        const subMenuWindow = {
            label: 'Window',
            submenu: [
                { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
                { type: 'separator' },
                { label: 'Bring All to Front', selector: 'arrangeInFront:' }
            ]
        };
        const subMenuView =  true ? subMenuViewDev : subMenuViewProd;
        return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow];
    }
    buildDefaultTemplate() {
        const templateDefault = [
            {
                label: '&File',
                submenu: [
                    {
                        label: '&Open',
                        accelerator: 'Ctrl+O'
                    },
                    {
                        label: '&Close',
                        accelerator: 'Ctrl+W',
                        click: () => {
                            this.mainWindow.close();
                        }
                    }
                ]
            },
            {
                label: '&View',
                submenu:  true
                    ? [
                        {
                            label: '&Reload',
                            accelerator: 'Ctrl+R',
                            click: () => {
                                this.mainWindow.webContents.reload();
                            }
                        },
                        {
                            label: 'Toggle &Full Screen',
                            accelerator: 'F11',
                            click: () => {
                                this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                            }
                        },
                        {
                            label: 'Toggle &Developer Tools',
                            accelerator: 'Alt+Ctrl+I',
                            click: () => {
                                this.mainWindow.toggleDevTools();
                            }
                        }
                    ]
                    : [
                        {
                            label: 'Toggle &Full Screen',
                            accelerator: 'F11',
                            click: () => {
                                this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
                            }
                        }
                    ]
            }
        ];
        return templateDefault;
    }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = MenuBuilder;



/***/ }),

/***/ "./app/constants/path.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_path__ = __webpack_require__("path");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_path__);

const SOURCE_PATH = __dirname;
/* unused harmony export SOURCE_PATH */

const ASSETS_PATH = __WEBPACK_IMPORTED_MODULE_0_path___default.a.join(SOURCE_PATH, 'assets');
/* harmony export (immutable) */ __webpack_exports__["a"] = ASSETS_PATH;



/***/ }),

/***/ "./app/main.dev.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_electron__ = __webpack_require__("electron");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_electron___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_electron__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_electron_localshortcut__ = __webpack_require__("electron-localshortcut");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_electron_localshortcut___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_electron_localshortcut__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_path__ = __webpack_require__("path");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_path__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__browser_menu__ = __webpack_require__("./app/browser/menu.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__browser_asset_protocol__ = __webpack_require__("./app/browser/asset-protocol.ts");
/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */





if (false) {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}
if (true) {
    __webpack_require__("electron-debug")();
    const path = __webpack_require__("path");
    const p = path.join(__dirname, '..', 'app', 'node_modules');
    __webpack_require__("module").globalPaths.push(p);
}
const USE_ELECTRON_BACKEND = true;
if (USE_ELECTRON_BACKEND) {
    __webpack_require__("./app/renderer/platform/electron/main-backend.js");
}
const installExtensions = async () => {
    const installer = __webpack_require__("electron-devtools-installer");
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
    return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload))).catch(console.log);
};
const setupPlugins = () => {
    const dirpath =  false ? dirname(process.execPath) : __dirname;
    // You have to pass the filename of `widevinecdmadapter` here, it is
    // * `widevinecdmadapter.plugin` on macOS,
    // * `libwidevinecdmadapter.so` on Linux,
    // * `widevinecdmadapter.dll` on Windows.
    __WEBPACK_IMPORTED_MODULE_0_electron__["app"].commandLine.appendSwitch('widevine-cdm-path', Object(__WEBPACK_IMPORTED_MODULE_2_path__["join"])(dirpath, '/lib/widevinecdmadapter.dll'));
    // The version of plugin can be got from `chrome://plugins` page in Chrome.
    __WEBPACK_IMPORTED_MODULE_0_electron__["app"].commandLine.appendSwitch('widevine-cdm-version', '1.4.8.1029');
};
setupPlugins();
/**
 * Add event listeners...
 */
__WEBPACK_IMPORTED_MODULE_0_electron__["app"].on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        __WEBPACK_IMPORTED_MODULE_0_electron__["app"].quit();
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
        __WEBPACK_IMPORTED_MODULE_0_electron__["BrowserWindow"].getAllWindows().forEach(win => {
            win.webContents.send('command', shortcut);
        });
    };
    globalCommands.forEach(cmd => {
        __WEBPACK_IMPORTED_MODULE_0_electron__["globalShortcut"].register(cmd[0], ipcShortcut.bind(null, cmd[1]));
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
    ];
    localCommands.forEach(cmd => {
        __WEBPACK_IMPORTED_MODULE_0_electron__["BrowserWindow"].getAllWindows().forEach(win => {
            Object(__WEBPACK_IMPORTED_MODULE_1_electron_localshortcut__["register"])(win, cmd[0], () => {
                win.webContents.send('command', cmd[1]);
            });
        });
    });
};
const setupWindow = () => {
    let win = new __WEBPACK_IMPORTED_MODULE_0_electron__["BrowserWindow"]({
        show: false,
        width: 1280,
        height: 720,
        webPreferences: {
            blinkFeatures: 'CSSBackdropFilter'
        },
        frame: false,
        titleBarStyle: 'hidden'
    });
    win.loadURL(`file://${__dirname}/builtin-pages/app.html`);
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
        if (win) {
            win.removeAllListeners();
            win = null;
        }
    });
    const menuBuilder = new __WEBPACK_IMPORTED_MODULE_3__browser_menu__["a" /* default */](win);
    menuBuilder.buildMenu();
    return win;
};
__WEBPACK_IMPORTED_MODULE_0_electron__["app"].on('ready', async () => {
    if (true) {
        await installExtensions();
    }
    Object(__WEBPACK_IMPORTED_MODULE_4__browser_asset_protocol__["a" /* registerAssetProtocol */])();
    let numWindows = 1;
    // Allow multiple windows for local testing
    if (true) {
        numWindows = parseInt(process.env.NUM_WINDOWS || '1', 10) || 1;
        numWindows = Math.min(Math.max(numWindows, 1), 4);
    }
    for (let i = 0; i < numWindows; i++) {
        setupWindow();
    }
    registerMediaShortcuts();
});


/***/ }),

/***/ "./app/renderer/platform/electron/main-backend.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_electron__ = __webpack_require__("electron");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_electron___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_electron__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_crypto__ = __webpack_require__("crypto");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_crypto___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_crypto__);



const sessions = new Map();

class Session {
  constructor(hostClient) {
    this.id = __WEBPACK_IMPORTED_MODULE_1_crypto___default.a.randomBytes(6).toString('hex');
    this.clients = new Set();

    this.clients.add(hostClient.id);
    this.owner = hostClient.id;

    this.receive = this.receive.bind(this);

    __WEBPACK_IMPORTED_MODULE_0_electron__["ipcMain"].on(`platform-lobby-message-${this.id}`, this.receive);
  }

  close() {
    __WEBPACK_IMPORTED_MODULE_0_electron__["ipcMain"].removeListener(`platform-lobby-message-${this.id}`, this.receive);
  }

  receive(event, targetId, msg) {
    targetId = parseInt(targetId, 10);
    const senderId = event.sender.id;
    console.log(`[Session.receive][${this.id}] Received '${msg}' from ${senderId} for ${targetId}`);
    this.sendTo(targetId, senderId, msg);
  }

  join(client) {
    this.clients.add(client.id);
  }

  leave(client) {
    if (this.owner === client.id) {
      // TODO: inform clients of disconnect
      this.clients.clear();
    } else {
      this.clients.delete(client.id);
    }
  }

  sendTo(targetId, senderId, msg) {
    if (!this.clients.has(targetId)) {
      console.error(`Unknown target ${targetId}`);
      return;
    }

    const client = __WEBPACK_IMPORTED_MODULE_0_electron__["webContents"].fromId(targetId);
    client.send(`platform-lobby-message-${this.id}`, senderId, msg);
  }

  isEmpty() {
    return this.clients.size === 0;
  }
}

__WEBPACK_IMPORTED_MODULE_0_electron__["ipcMain"].on('platform-create-lobby', (event, opts) => {
  const { sender } = event;

  const session = new Session(sender);

  sessions.set(session.id, session);

  console.log(`Created electron session [${session.id}]`);
  sender.send('platform-create-lobby-result', session.id);
});

__WEBPACK_IMPORTED_MODULE_0_electron__["ipcMain"].on('platform-join-lobby', (event, lobbyId) => {
  const { sender } = event;
  const session = sessions.get(lobbyId);
  if (!session) {
    console.error(`[platform-join-lobby] No session found for '${lobbyId}'`);
    sender.send('platform-join-lobby-result', false);
    return;
  }

  session.join(sender);
  sender.send('platform-join-lobby-result', true, session.owner + '');
});

__WEBPACK_IMPORTED_MODULE_0_electron__["ipcMain"].on('platform-leave-lobby', (event, lobbyId) => {
  const { sender } = event;
  const session = sessions.get(lobbyId);
  if (!session) {
    console.error(`[platform-leave-lobby] No session found for '${lobbyId}'`);
    sender.send('platform-leave-lobby-result', false);
    return;
  }

  session.leave(sender);

  if (session.isEmpty()) {
    session.close();
    sessions.delete(session.id);
  }
});

__WEBPACK_IMPORTED_MODULE_0_electron__["ipcMain"].on('platform-query', (event, opts) => {
  const results = Array.from(sessions).map(mapEntry => {
    const [id, session] = mapEntry;
    return {
      id: session.id,
      name: 'Electron Session',
      data: {
        foo: 'bar'
      }
    };
  });

  event.sender.send('platform-query-result', results);
});


/***/ }),

/***/ "crypto":
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),

/***/ "electron":
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),

/***/ "electron-debug":
/***/ (function(module, exports) {

module.exports = require("electron-debug");

/***/ }),

/***/ "electron-devtools-installer":
/***/ (function(module, exports) {

module.exports = require("electron-devtools-installer");

/***/ }),

/***/ "electron-localshortcut":
/***/ (function(module, exports) {

module.exports = require("electron-localshortcut");

/***/ }),

/***/ "module":
/***/ (function(module, exports) {

module.exports = require("module");

/***/ }),

/***/ "path":
/***/ (function(module, exports) {

module.exports = require("path");

/***/ })

/******/ });
//# sourceMappingURL=main.dev.js.map