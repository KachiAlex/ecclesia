import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import type { BranchLevel } from '@/lib/services/branch-hierarchy'
export type { BranchLevel } from '@/lib/services/branch-hierarchy'

const DEFAULT_BRANCH_LEVEL: BranchLevel = 'BRANCH'

export interface Branch {
  id: string
  name: string
  slug: string
  churchId: string
  level: BranchLevel
  levelLabel?: string
  parentBranchId?: string | null
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  description?: string
  adminId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BranchAdmin {
  id: string
  branchId: string
  userId: string
  canManageMembers: boolean
  canManageEvents: boolean
  canManageGroups: boolean
  canManageGiving: boolean
  canManageSermons: boolean
  assignedAt: Date
  assignedBy?: string
}

const toBranch = (
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Branch => {
  const data = doc.data()!
  const level = (data.level as BranchLevel) || DEFAULT_BRANCH_LEVEL
  return {
    id: doc.id,
    ...data,
    level,
    levelLabel: typeof data.levelLabel === 'string' ? data.levelLabel : undefined,
    parentBranchId:
      data.parentBranchId === undefined ? null : (data.parentBranchId as string | null),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Branch
}

export class BranchService {
  /**
   * Find branch by ID
   */
  static async findById(id: string): Promise<Branch | null> {
    const doc = await db.collection(COLLECTIONS.branches).doc(id).get()
    if (!doc.exists) return null

    return toBranch(doc)
  }

  /**
   * Find branch by slug within a church
   */
  static async findBySlug(churchId: string, slug: string): Promise<Branch | null> {
    const snapshot = await db.collection(COLLECTIONS.branches)
      .where('churchId', '==', churchId)
      .where('slug', '==', slug)
      .limit(1)
      .get()
    
    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return toBranch(doc)
  }

  /**
   * Find all branches for a church
   */
  static async findByChurch(
    churchId: string,
    options?: {
      includeInactive?: boolean
      parentBranchId?: string | null
      level?: BranchLevel
    }
  ): Promise<Branch[]> {
    const includeInactive = options?.includeInactive === true

    try {
      let query: FirebaseFirestore.Query = db
        .collection(COLLECTIONS.branches)
        .where('churchId', '==', churchId)

      if (!includeInactive) {
        query = query.where('isActive', '==', true)
      }

      if (options?.parentBranchId !== undefined) {
        query = query.where('parentBranchId', '==', options.parentBranchId ?? null)
      }

      if (options?.level) {
        query = query.where('level', '==', options.level)
      }

      const snapshot = await query.get()

      const branches = snapshot.docs.map((doc) => toBranch(doc))

      // Sort by createdAt descending (client-side to avoid index requirement)
      return branches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error in findByChurch:', error)
      throw error
    }
  }

  /**
   * Create branch
   */
  static async create(data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Branch> {
    const branchData = {
      ...data,
      level: data.level ?? DEFAULT_BRANCH_LEVEL,
      levelLabel: data.levelLabel ?? null,
      parentBranchId: data.parentBranchId ?? null,
      isActive: data.isActive ?? true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.branches).doc()
    await docRef.set(branchData)

    const created = await docRef.get()
    return toBranch(created)
  }

  /**
   * Update branch
   */
  static async update(id: string, data: Partial<Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Branch> {
    await db.collection(COLLECTIONS.branches).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    
    return this.findById(id) as Promise<Branch>
  }

  /**
   * Delete branch (soft delete by setting isActive to false)
   */
  static async delete(id: string): Promise<void> {
    await this.update(id, { isActive: false })
  }
}

export class BranchAdminService {
  /**
   * Assign admin to branch
   */
  static async assignAdmin(data: Omit<BranchAdmin, 'id' | 'assignedAt'>): Promise<BranchAdmin> {
    // Check if admin already assigned
    const existing = await this.findByBranchAndUser(data.branchId, data.userId)
    if (existing) {
      // Update existing assignment
      return this.update(existing.id, data)
    }

    const adminData = {
      ...data,
      assignedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.branchAdmins).doc()
    await docRef.set(adminData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      assignedAt: toDate(createdData.assignedAt),
    } as BranchAdmin
  }

  /**
   * Find admin by branch and user
   */
  static async findByBranchAndUser(branchId: string, userId: string): Promise<BranchAdmin | null> {
    const snapshot = await db.collection(COLLECTIONS.branchAdmins)
      .where('branchId', '==', branchId)
      .where('userId', '==', userId)
      .limit(1)
      .get()
    
    if (snapshot.empty) return null
    
    const doc = snapshot.docs[0]
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      assignedAt: toDate(data.assignedAt),
    } as BranchAdmin
  }

  /**
   * Find all admins for a branch
   */
  static async findByBranch(branchId: string): Promise<BranchAdmin[]> {
    const snapshot = await db.collection(COLLECTIONS.branchAdmins)
      .where('branchId', '==', branchId)
      .get()
    
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        assignedAt: toDate(data.assignedAt),
      } as BranchAdmin
    })
  }

  /**
   * Find all branches where user is admin
   */
  static async findByUser(userId: string): Promise<BranchAdmin[]> {
    const snapshot = await db.collection(COLLECTIONS.branchAdmins)
      .where('userId', '==', userId)
      .get()
    
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        assignedAt: toDate(data.assignedAt),
      } as BranchAdmin
    })
  }

  /**
   * Update admin permissions
   */
  static async update(id: string, data: Partial<Omit<BranchAdmin, 'id' | 'assignedAt'>>): Promise<BranchAdmin> {
    await db.collection(COLLECTIONS.branchAdmins).doc(id).update(data)
    
    const doc = await db.collection(COLLECTIONS.branchAdmins).doc(id).get()
    const docData = doc.data()!
    return {
      id: doc.id,
      ...docData,
      assignedAt: toDate(docData.assignedAt),
    } as BranchAdmin
  }

  /**
   * Remove admin from branch
   */
  static async removeAdmin(branchId: string, userId: string): Promise<void> {
    const admin = await this.findByBranchAndUser(branchId, userId)
    if (admin) {
      await db.collection(COLLECTIONS.branchAdmins).doc(admin.id).delete()
    }
  }
}

/**
 * Generate a URL-friendly slug from branch name
 */
export function generateBranchSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

