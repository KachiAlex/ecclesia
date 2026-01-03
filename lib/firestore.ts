import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore, FieldValue, Transaction } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseApp?: App
  firebaseDb?: Firestore
  firebaseStorage?: Storage
  firebaseSettingsApplied?: boolean
}

let app: App
let _db: Firestore | null = globalForFirebase.firebaseDb ?? null
let _storage: Storage | null = globalForFirebase.firebaseStorage ?? null

/**
 * Initialize Firebase Admin SDK
 */
export function initFirebase() {
  if (!globalForFirebase.firebaseApp) {
    if (getApps().length === 0) {
      // Try to get service account from environment variable (for Vercel/Railway/etc)
      let serviceAccount: any = undefined

      const envServiceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
        ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
        : process.env.FIREBASE_SERVICE_ACCOUNT

      if (envServiceAccountRaw) {
        try {
          serviceAccount = JSON.parse(envServiceAccountRaw)
          console.log('Successfully parsed Firebase service account from environment variable')
        } catch (e) {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e)
          console.error('Raw value length:', envServiceAccountRaw?.length || 0)
          console.error('Raw value preview:', envServiceAccountRaw?.substring(0, 100) + '...')
        }
      } else {
        console.log('No FIREBASE_SERVICE_ACCOUNT environment variable found')
      }
      
      // Try to load from file (for local development)
      if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        try {
          const fs = require('fs')
          const path = require('path')
          const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
          if (fs.existsSync(serviceAccountPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
          }
        } catch (e) {
          console.error('Failed to load service account from file:', e)
        }
      }

      if (serviceAccount && typeof serviceAccount === 'object') {
        globalForFirebase.firebaseApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
        })
      } else {
        // Use default credentials (for Cloud Run/Firebase/Vercel with default credentials)
        console.log('No valid service account found, using default credentials')
        globalForFirebase.firebaseApp = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
        })
      }
    }
  } else if (getApps().length > 0) {
    // Ensure firebase-admin uses the first registered app (important in local dev with HMR)
    globalForFirebase.firebaseApp = getApps()[0]
  }

  app = globalForFirebase.firebaseApp!

  if (!globalForFirebase.firebaseDb) {
    const instance = getFirestore(app)
    if (!globalForFirebase.firebaseSettingsApplied) {
      instance.settings({ ignoreUndefinedProperties: true })
      globalForFirebase.firebaseSettingsApplied = true
    }
    globalForFirebase.firebaseDb = instance
  }

  if (!globalForFirebase.firebaseStorage) {
    globalForFirebase.firebaseStorage = getStorage(app)
  }

  _db = globalForFirebase.firebaseDb!
  _storage = globalForFirebase.firebaseStorage!

  return _db
}

/**
 * Get Firestore instance
 */
export function getFirestoreDB(): Firestore {
  if (!_db) {
    _db = initFirebase()
  }
  return _db
}

// Export db - initialized on first access
export const db = getFirestoreDB()

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage(): Storage {
  if (!_storage) {
    initFirebase() // This will initialize storage too
    if (!_storage) {
      throw new Error('Firebase Storage not initialized')
    }
  }
  return _storage
}

// Export storage - initialized on first access
export const storage = getFirebaseStorage()

/**
 * Helper to convert Firestore timestamp to Date
 */
export function toDate(timestamp: any): Date {
  if (!timestamp) return new Date()
  if (timestamp.toDate) return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  return new Date(timestamp)
}

/**
 * Helper to convert Date to Firestore timestamp
 */
export function toTimestamp(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return { _seconds: Math.floor(d.getTime() / 1000), _nanoseconds: 0 }
}

/**
 * Batch write helper
 */
export async function batchWrite(operations: Array<{ type: 'set' | 'update' | 'delete'; ref: string; data?: any }>) {
  const firestoreDB = getFirestoreDB()
  const batch = firestoreDB.batch()
  
  for (const op of operations) {
    const docRef = firestoreDB.doc(op.ref)
    if (op.type === 'set') {
      batch.set(docRef, op.data)
    } else if (op.type === 'update') {
      batch.update(docRef, op.data)
    } else if (op.type === 'delete') {
      batch.delete(docRef)
    }
  }
  
  await batch.commit()
}

/**
 * Transaction helper
 */
export async function runTransaction<T>(
  callback: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const firestoreDB = getFirestoreDB()
  return await firestoreDB.runTransaction(callback)
}

// Export FieldValue for use in updates
export { FieldValue }

