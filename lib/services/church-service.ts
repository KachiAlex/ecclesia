import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface Church {
  id: string
  name: string
  slug?: string
  description?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  ownerId?: string
  subscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

export class ChurchService {
  /**
   * Find church by ID
   */
  static async findById(id: string): Promise<Church | null> {
    const doc = await db.collection(COLLECTIONS.churches).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Church
  }

  /**
   * Create church
   */
  static async create(data: Omit<Church, 'id' | 'createdAt' | 'updatedAt'>): Promise<Church> {
    const churchData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.churches).doc()
    await docRef.set(churchData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Church
  }

  /**
   * Update church
   */
  static async update(id: string, data: Partial<Omit<Church, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Church> {
    await db.collection(COLLECTIONS.churches).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    
    return this.findById(id) as Promise<Church>
  }

  /**
   * Find all churches (for superadmin)
   */
  static async findAll(): Promise<Church[]> {
    const snapshot = await db.collection(COLLECTIONS.churches)
      .orderBy('createdAt', 'desc')
      .get()
    
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Church
    })
  }

  /**
   * Find church by slug
   */
  static async findBySlug(slug: string): Promise<Church | null> {
    const snapshot = await db.collection(COLLECTIONS.churches)
      .where('slug', '==', slug)
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Church
  }
}

/**
 * Generate a URL-friendly slug from church name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

