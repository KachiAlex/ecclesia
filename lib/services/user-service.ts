import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import bcrypt from 'bcryptjs'
import { FieldValue, Query } from 'firebase-admin/firestore'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  password: string
  role: string
  churchId: string
  branchId?: string
  churchRoleId?: string
  churchRoleName?: string
  designationId?: string
  designationName?: string
  profileImage?: string
  phone?: string
  dateOfBirth?: Date | string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  bio?: string
  spiritualMaturity?: string
  employmentStatus?: string
  parentId?: string
  spouseId?: string
  xp?: number
  level?: number
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class UserService {
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const doc = await db.collection(COLLECTIONS.users).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      lastLoginAt: data.lastLoginAt ? toDate(data.lastLoginAt) : undefined,
    } as User
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const snapshot = await db.collection(COLLECTIONS.users)
      .where('email', '==', email)
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
      lastLoginAt: data.lastLoginAt ? toDate(data.lastLoginAt) : undefined,
    } as User
  }

  /**
   * Create user
   */
  static async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10)

    const userData = {
      ...data,
      password: hashedPassword,
      xp: data.xp || 0,
      level: data.level || 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.users).doc()
    await docRef.set(userData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      password: hashedPassword, // Return hashed password
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as User
  }

  /**
   * Update user
   */
  static async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    await db.collection(COLLECTIONS.users).doc(id).update(updateData)
    return this.findById(id) as Promise<User>
  }

  /**
   * Find users by church
   */
  static async findByChurch(churchId: string, limit?: number): Promise<User[]> {
    let query: Query = db.collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
    
    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? toDate(data.lastLoginAt) : undefined,
      } as User
    })
  }

  /**
   * Search users
   */
  static async search(churchId: string, searchTerm: string): Promise<User[]> {
    // Firestore doesn't support full-text search, so we'll search by name fields
    const snapshot = await db.collection(COLLECTIONS.users)
      .where('churchId', '==', churchId)
      .get()
    
    const searchLower = searchTerm.toLowerCase()
    return snapshot.docs
      .map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? toDate(data.lastLoginAt) : undefined,
        } as User
      })
      .filter((user: any) =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      )
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id: string): Promise<void> {
    await db.collection(COLLECTIONS.users).doc(id).update({
      lastLoginAt: FieldValue.serverTimestamp(),
    })
  }

  /**
   * Add XP
   */
  static async addXP(id: string, amount: number): Promise<void> {
    const user = await this.findById(id)
    if (!user) return

    const newXP = (user.xp || 0) + amount
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1

    await db.collection(COLLECTIONS.users).doc(id).update({
      xp: newXP,
      level: newLevel,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

