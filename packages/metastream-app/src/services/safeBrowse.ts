import { getHost } from 'utils/url'

const STORAGE_KEY = 'safeBrowseHosts'

const SAFE_HOSTS = new Set([
  'www.youtube.com',
  'www.youtu.be',
  'm.youtube.com',
  'youtube.com',
  'www.netflix.com',
  'www.crunchyroll.com',
  'www.google.com',
  'www.hulu.com',
  'soundcloud.com',
  'w.soundcloud.com',
  'www.amazon.com',
  'www.twitch.tv',
  'clips.twitch.tv',
  'drive.google.com',
  'www.dailymotion.com',
  'roosterteeth.com',
  'www.reddit.com',
  'www.funimation.com',
  'twitter.com',
  'www.bilibili.com',
  'www.facebook.com',
  'open.spotify.com',
  'www.primevideo.com',
  'www.amazon.co.uk',
  'play.hbogo.com',
  'play.hbonow.com',
  'streamable.com',
  'www.dropbox.com',
  'www.plex.tv',
  'app.plex.tv',
  'www.nicovideo.jp',
  'i.imgur.com'
])

let safeBrowse: SafeBrowse | undefined

export class SafeBrowse {
  private enabled = true
  private persistentHosts!: Set<string>

  static getInstance() {
    return safeBrowse || (safeBrowse = new SafeBrowse())
  }

  private constructor() {
    this.load()
    window.addEventListener('beforeunload', this.save.bind(this), false)
  }

  private load() {
    const value =
      process.env.NODE_ENV === 'development' ? '' : localStorage.getItem(STORAGE_KEY) || ''
    const hosts = value.split(',')
    this.persistentHosts = new Set(hosts)
  }

  private save() {
    const hosts = Array.from(this.persistentHosts)
    if (hosts.length === 0) return
    const value = hosts.join(',')
    localStorage.setItem(STORAGE_KEY, value)
  }

  isPermittedURL(url: string) {
    if (!this.enabled) return true

    const host = getHost(url)
    if (!host) return true

    const isPermitted = SAFE_HOSTS.has(host) || this.persistentHosts.has(host)
    return isPermitted
  }

  permitURL(url: string) {
    const host = getHost(url)
    if (!host) return
    this.persistentHosts.add(host)
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }
}
