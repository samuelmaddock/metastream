import firebase from 'firebase'
import 'firebase/firestore'

let initializing: boolean = false
let db: firebase.firestore.Firestore | null = null
let uid: string | null = null

export async function init() {
  const apiKey = process.env.FIREBASE_API_KEY

  if (!apiKey) {
    throw new Error('Firebase API key not configured.')
  }

  initializing = true

  firebase.initializeApp({
    apiKey,
    authDomain: 'getmetastream.firebaseapp.com',
    projectId: 'getmetastream'
  })

  db = firebase.firestore()

  if (process.env.NODE_ENV === 'development') {
    Object.assign((window as any).app, { firestore: db })
  }

  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true
  })

  const userInfo = await firebase.auth().signInAnonymously()
  if (userInfo.user) {
    uid = userInfo.user.uid
  }

  initializing = false
  console.log('Initialized Firestore session', userInfo)
}

export function isReady() {
  return Boolean(db && uid)
}

export function isInitializing() {
  return initializing
}

export function getDatabase() {
  return db
}

export function getUserId() {
  return uid
}
