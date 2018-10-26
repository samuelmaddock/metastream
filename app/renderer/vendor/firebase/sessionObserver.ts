import { SessionObserver } from 'renderer/lobby/middleware/session'
import { ISessionState } from 'renderer/lobby/reducers/session'
import { VERSION } from 'constants/app'

import * as firebase from './'
import { cleanObject } from 'utils/object'
import { localUserId } from '../../network/index'

type Timestamp = number

interface SessionDocument {
  id: string
  version: string
  created: Timestamp
  modified: Timestamp
  name: string
  users: number
  media?: {
    url: string
    title: string
    thumbnail?: string
  }
  tags?: string[]
  hidden?: boolean
}

/**
 * Observers session state to relay to public session browser.
 */
export class FirebaseSessionObserver implements SessionObserver {
  private disabled: boolean = false
  private document: SessionDocument | null = null

  private buildDocument(state: ISessionState) {
    const prevDoc = this.document
    const now = new Date().getTime()

    const doc: SessionDocument = {
      id: state.id,
      version: VERSION,
      created: prevDoc ? prevDoc.created : now,
      modified: now,
      name: 'Metastream',
      users: state.users,
      media: state.media
    }

    return cleanObject(doc) as SessionDocument
  }

  private updateDocument(state: ISessionState | null) {
    const db = firebase.getDatabase()
    const userId = firebase.getUserId()
    if (!db || !userId) return

    if (state) {
      this.document = this.buildDocument(state)

      db.collection('sessions')
        .doc(userId)
        .set(this.document)
    } else {
      // TODO: delete document
    }
  }

  onChange(state: ISessionState | null): void {
    if (this.disabled) return

    // Only announce session from host
    if ((!state && !document) || (state && state.id !== localUserId())) return

    if (!firebase.isReady()) {
      if (firebase.isInitializing()) return

      // TODO: handle case where session starts and ends before firebase initializes
      firebase
        .init()
        .then(() => {
          this.updateDocument(state)
        })
        .catch(err => {
          console.error('Firebase failed to initialize')
          console.error(err)
          this.disabled = true
        })

      return
    }

    this.updateDocument(state)
  }
}
