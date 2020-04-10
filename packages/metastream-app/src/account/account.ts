import { StorageKey } from 'constants/storage'
import { EventEmitter } from 'events'

type Firebase = typeof import('firebase/app')

export const enum MetastreamUserTier {
  None = 0,
  Starter = 1,
  Supporter = 2
}

interface UserDocument {
  tier: MetastreamUserTier
}

let instance: AccountService

export class AccountService extends EventEmitter {
  static get() {
    return instance || (instance = new AccountService())
  }

  private _firebase?: Firebase
  private get firebase() {
    if (!this._firebase) {
      throw new Error('Firebase is not initialized')
    }
    return this._firebase
  }

  private _userData?: UserDocument

  get tier() {
    return (this._userData && this._userData.tier) || MetastreamUserTier.None
  }

  private async initFirebase() {
    if (!process.env.FIREBASE_CONFIG) {
      throw new Error('Firebase not configured')
    }

    const firebase = await import(/* webpackChunkName: "firebase-app" */ 'firebase/app')
    await Promise.all([
      import(/* webpackChunkName: "firebase-auth" */ 'firebase/auth'),
      import(/* webpackChunkName: "firebase-firestore" */ 'firebase/firestore')
    ])

    if (!this._firebase) {
      const firebaseConfig = JSON.parse(atob(process.env.FIREBASE_CONFIG))
      firebase.initializeApp(firebaseConfig)
      this._firebase = firebase
    }

    if (process.env.NODE_ENV === 'development') {
      ;(window as any).app.firebase = firebase
    }

    return firebase
  }

  private async fetchUserDocument() {
    const userRecord = this.firebase.auth().currentUser!
    const userDocRef = await this.firebase
      .firestore()
      .collection('users')
      .doc(userRecord.uid)
      .get()
    const userData = userDocRef.data() as UserDocument
    this._userData = userData
    this.emit('change')
    return userData
  }

  async checkLogin() {
    const didLogin = Boolean(localStorage.getItem(StorageKey.Login))
    if (didLogin) {
      const firebase = await this.initFirebase() // init
      const user = await new Promise(resolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe()
          resolve(user)
        })
      })

      if (process.env.NODE_ENV === 'development') {
        console.debug('Firebase user', user)
      }

      if (user) {
        await this.fetchUserDocument()
      }
    }
  }

  async promptLogin() {
    const customToken = await new Promise<string>((resolve, reject) => {
      const params: { [key: string]: string | undefined } = {
        response_type: 'code',
        client_id: process.env.PATREON_CLIENT_ID,
        redirect_uri: process.env.PATREON_REDIRECT_URI,
        scope: ['identity', 'identity[email]'].join(' ')
      }

      const url = new URL('https://www.patreon.com/oauth2/authorize')
      for (const key of Object.keys(params)) {
        url.searchParams.set(key, params[key] + '')
      }

      const win = window.open(url.href, 'MetastreamAuth')
      if (!win) {
        reject()
        return
      }

      window.addEventListener('message', function onAuthMessage(event: MessageEvent) {
        if (event.origin !== location.origin) return

        if (win.closed) {
          window.removeEventListener('message', onAuthMessage)
          reject()
          return
        }

        const action = typeof event.data === 'object' && event.data
        if (action && action.type === 'auth-token') {
          win.close()
          window.removeEventListener('message', onAuthMessage)

          if (action.error) {
            reject(new Error(action.error))
          } else {
            resolve(action.token)
          }
        }
      })
    })

    await this.initFirebase()
    const userCred = await this.firebase.auth().signInWithCustomToken(customToken)

    if (process.env.NODE_ENV === 'development') {
      console.log(userCred)
    }

    // Remember that the user logged in so we can restore on refresh
    try {
      localStorage.setItem(StorageKey.Login, '1')
    } catch {}

    await this.fetchUserDocument()
  }

  async logout() {
    if (!this._firebase) return
    await this.firebase.auth().signOut()

    try {
      localStorage.removeItem(StorageKey.Login)
    } catch {}

    this._userData = undefined
    this.emit('change')
  }
}
