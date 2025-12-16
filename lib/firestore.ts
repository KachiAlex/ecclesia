import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore, FieldValue, Transaction } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

let app: App
let _db: Firestore | null = null
let _storage: Storage | null = null

/**
 * Initialize Firebase Admin SDK
 */
export function initFirebase() {
  if (getApps().length === 0) {
    // Try to get service account from environment variable (for Vercel/Railway/etc)
    let serviceAccount: any = undefined
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
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
        }
      } catch (e) {
        console.error('Failed to load service account from file:', e)
      }
    }

    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      })
    } else {
      // Use default credentials (for Cloud Run/Firebase/Vercel with default credentials)
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      })
    }

    _db = getFirestore(app)
    _storage = getStorage(app)
  } else {
    app = getApps()[0]
    _db = getFirestore(app)
    _storage = getStorage(app)
  }

  return _db!
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

