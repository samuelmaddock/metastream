import { app, Menu, shell, BrowserWindow, ipcMain } from 'electron'
import log from './log'
import { PRODUCT_NAME } from 'constants/app'

export default class MenuBuilder {
  constructor(
    private mainWindow: BrowserWindow,
    private developer: boolean = process.env.NODE_ENV === 'development'
  ) {
    ipcMain.on('menu-rebuild', (event: Electron.Event, developer: boolean) => {
      log.debug(`Rebuilding app menu...`)
      this.developer = !!developer
      this.buildMenu()
    })
  }

  buildMenu() {
    if (this.developer) {
      this.setupDevelopmentEnvironment()
    }

    let template

    if (process.platform === 'darwin') {
      template = this.buildDarwinTemplate()
    } else {
      template = this.buildDefaultTemplate()
    }

    const menu = Menu.buildFromTemplate(template as any)
    Menu.setApplicationMenu(menu)

    return menu
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools()
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y)
          }
        }
      ]).popup(this.mainWindow)
    })
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: PRODUCT_NAME,
      submenu: [
        { label: `About ${PRODUCT_NAME}`, selector: 'orderFrontStandardAboutPanel:' },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        { label: `Hide ${PRODUCT_NAME}`, accelerator: 'Command+H', selector: 'hide:' },
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
            app.quit()
          }
        }
      ]
    }
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
    }
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload()
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.toggleDevTools()
          }
        }
      ]
    }
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
          }
        }
      ]
    }
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    }

    const subMenuView = this.developer ? subMenuViewDev : subMenuViewProd

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow]
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close()
            }
          }
        ]
      },
      {
        label: '&View',
        submenu: this.developer
          ? [
              {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: () => {
                  this.mainWindow.webContents.reload()
                }
              },
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
                }
              },
              {
                label: 'Toggle &Developer Tools',
                accelerator: 'Ctrl+Shift+I',
                click: () => {
                  this.mainWindow.toggleDevTools()
                }
              }
            ]
          : [
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
                }
              }
            ]
      }
    ]

    return templateDefault
  }
}
