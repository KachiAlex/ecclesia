import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore, FieldValue, Transaction } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

const globalForFirebase = globalThis as typeof globalThis & {
  firebaseApp?: App
  firebaseDb?: Firestore
  firebaseStorage?: Storage
  firebaseSettingsApplied?: boolean
  firebaseDisabled?: boolean
}

let app: App
let _db: Firestore | null = globalForFirebase.firebaseDb ?? null
let _storage: Storage | null = globalForFirebase.firebaseStorage ?? null

const hasServiceAccountEnv =
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) ||
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT) ||
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)

if (!hasServiceAccountEnv) {
  globalForFirebase.firebaseDisabled = true
}

function createDisabledProxy<T extends object>(feature: string): T {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          `Firebase ${feature} is not available. Provide FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT, or FIREBASE_SERVICE_ACCOUNT_PATH before using Firestore features.`,
        )
      },
      apply() {
        throw new Error(
          `Firebase ${feature} is not available. Provide FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT, or FIREBASE_SERVICE_ACCOUNT_PATH before using Firestore features.`,
        )
      },
    },
  ) as T
}

export function isFirebaseConfigured() {
  return hasServiceAccountEnv
}

/**
 * Initialize Firebase Admin SDK
 */
export function initFirebase(): Firestore | null {
  try {
    if (!hasServiceAccountEnv) {
      globalForFirebase.firebaseDisabled = true
    }
    if (!globalForFirebase.firebaseApp) {
      if (getApps().length === 0) {
        // Try to get service account from environment variable (for Vercel/Railway/etc)
        let serviceAccount: any = undefined

        // First try FIREBASE_SERVICE_ACCOUNT_BASE64 (preferred for Vercel)
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
          try {
            serviceAccount = JSON.parse(
              Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
            )
            console.log('Successfully parsed Firebase service account from BASE64 environment variable')
          } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e)
          }
        }

        // Then try FIREBASE_SERVICE_ACCOUNT (JSON string)
        if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            console.log('Successfully parsed Firebase service account from JSON environment variable')
          } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e)
          }
        }
        
        // Try to load from file (for local development)
        if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
          try {
            const fs = require('fs')
            const path = require('path')
            const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
            if (fs.existsSync(serviceAccountPath)) {
              serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
              console.log('Successfully loaded Firebase service account from file')
            }
          } catch (e) {
            console.error('Failed to load service account from file:', e)
          }
        }

        // Only use cert() if we have a valid service account object
        if (serviceAccount && typeof serviceAccount === 'object' && serviceAccount.type === 'service_account') {
          try {
            globalForFirebase.firebaseApp = initializeApp({
              credential: cert(serviceAccount),
              projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
            })
            console.log('Firebase initialized with service account credentials')
          } catch (e) {
            console.error('Failed to initialize Firebase with service account:', e)
            // Don't try fallback - service account is required
            console.error('Firebase initialization failed - service account is required for Firestore access')
          }
        } else if (!globalForFirebase.firebaseDisabled) {
          console.error('No valid service account found in environment variables')
          console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT must be set in Vercel environment variables')
          globalForFirebase.firebaseDisabled = true
        }
      }
    } else if (getApps().length > 0) {
      // Ensure firebase-admin uses the first registered app (important in local dev with HMR)
      globalForFirebase.firebaseApp = getApps()[0]
    }

    // If Firebase app is still not initialized, return null
    if (!globalForFirebase.firebaseApp) {
      console.warn('Firebase app not initialized - Firestore will not be available')
      return null as any
    }

    app = globalForFirebase.firebaseApp

    if (!globalForFirebase.firebaseDb) {
      try {
        const instance = getFirestore(app)
        if (!globalForFirebase.firebaseSettingsApplied) {
          instance.settings({ ignoreUndefinedProperties: true })
          globalForFirebase.firebaseSettingsApplied = true
        }
        globalForFirebase.firebaseDb = instance
      } catch (e) {
        console.error('Failed to get Firestore instance:', e)
        return null as any
      }
    }

    if (!globalForFirebase.firebaseStorage) {
      try {
        globalForFirebase.firebaseStorage = getStorage(app)
      } catch (e) {
        console.error('Failed to get Firebase Storage:', e)
      }
    }

    _db = globalForFirebase.firebaseDb!
    _storage = globalForFirebase.firebaseStorage!

    return _db
  } catch (error) {
    console.error('Unexpected error in initFirebase:', error)
    return null as any
  }
}

/**
 * Get Firestore instance
 */
export function getFirestoreDB(): Firestore {
  if (!_db) {
    const result = initFirebase()
    if (!result) {
      throw new Error('Failed to initialize Firebase')
    }
    _db = result
  }
  return _db
}

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

// Export db and storage - initialized on first access
// These are wrapped in getters to ensure lazy initialization
export const db: Firestore = globalForFirebase.firebaseDisabled
  ? createDisabledProxy<Firestore>('Firestore')
  : getFirestoreDB()
export const storage: Storage = globalForFirebase.firebaseDisabled
  ? createDisabledProxy<Storage>('Storage')
  : getFirebaseStorage()

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

