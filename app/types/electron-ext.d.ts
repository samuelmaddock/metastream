declare namespace Electron {
  export interface BrowserWindow {
    openDevTools(): void
    toggleDevTools(): void
    inspectElement(x: number, y: number): void
  }

  export interface MenuItemOptions {
    selector?: string
  }

  interface WebviewTag {
    enablePreferredSizeMode(enabled: boolean): void
    getPreferredSize(cb: (size: { width: number; height: number }) => void): void
  }
}
