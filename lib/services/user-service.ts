import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { PayFrequencyOption } from './staff-level-service'

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
  isStaff?: boolean
  isSuspended?: boolean
  staffLevelId?: string
  staffLevelName?: string
  customWage?: {
    amount: number
    currency: string
    payFrequency: PayFrequencyOption
  }
  parentId?: string
  spouseId?: string
  xp?: number
  level?: number
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PRISMA_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'password', 'email', 'firstName', 'lastName',
  'phone', 'profileImage', 'bio', 'dateOfBirth', 'address', 'city', 'state',
  'zipCode', 'country', 'role', 'spiritualMaturity', 'churchId', 'branchId',
  'xp', 'level', 'lastLoginAt', 'firestoreData'
])

export class UserService {
  /**
   * Merge a Prisma user record with any legacy firestoreData
   */
  private static fromPrisma(record: any): User {
    const { firestoreData, ...rest } = record
    const legacy = (firestoreData as Record<string, unknown>) || {}
    return { ...legacy, ...rest } as unknown as User
  }

  /**
   * Build firestoreData object from input fields that are not Prisma columns
   */
  private static buildLegacyData(data: any, extra: any = {}): any {
    const result: any = { ...extra }
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && !PRISMA_FIELDS.has(key) && !['id', 'createdAt', 'updatedAt', 'password'].includes(key)) {
        result[key] = value
      }
    }
    if (Object.keys(result).length === 0) return undefined
    return result
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { id } })
    if (!record) return null
    return this.fromPrisma(record)
  }

  /**
   * Find user by email within a specific church (tenant)
   */
  static async findByEmailInChurch(email: string, churchId: string): Promise<User | null> {
    const record = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), churchId },
    })
    if (!record) return null
    return this.fromPrisma(record)
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!record) return null
    return this.fromPrisma(record)
  }

  /**
   * Create user
   */
  static async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const password = data.password ? await bcrypt.hash(data.password, 10) : ''
    const record = await prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        password,
        firstName: data.firstName || 'Unknown',
        lastName: data.lastName || 'User',
        phone: data.phone,
        profileImage: data.profileImage,
        bio: data.bio,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        role: data.role as any,
        spiritualMaturity: data.spiritualMaturity as any,
        churchId: data.churchId,
        branchId: data.branchId,
        xp: data.xp || 0,
        level: data.level || 1,
        firestoreData: this.buildLegacyData(data),
      },
    })
    return this.fromPrisma(record)
  }

  /**
   * Update user
   */
  static async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const current = await prisma.user.findUnique({ where: { id }, select: { firestoreData: true } })
    const currentLegacy = ((current?.firestoreData as Record<string, unknown>) || {})

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase()
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
    if (data.address !== undefined) updateData.address = data.address
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode
    if (data.country !== undefined) updateData.country = data.country
    if (data.role !== undefined) updateData.role = data.role as any
    if (data.spiritualMaturity !== undefined) updateData.spiritualMaturity = data.spiritualMaturity as any
    if (data.churchId !== undefined) updateData.churchId = data.churchId
    if (data.branchId !== undefined) updateData.branchId = data.branchId
    if (data.xp !== undefined) updateData.xp = data.xp
    if (data.level !== undefined) updateData.level = data.level
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    const newLegacy = this.buildLegacyData(data)
    if (newLegacy !== undefined || Object.keys(currentLegacy).length > 0) {
      updateData.firestoreData = { ...currentLegacy, ...newLegacy }
    }

    const record = await prisma.user.update({ where: { id }, data: updateData })
    return this.fromPrisma(record)
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }

  /**
   * Find users by church
   */
  static async findByChurch(churchId: string, limit?: number): Promise<User[]> {
    const records = await prisma.user.findMany({
      where: { churchId },
      take: limit || undefined,
      orderBy: { createdAt: 'desc' },
    })
    return records.map((record) => this.fromPrisma(record))
  }

  /**
   * Search users
   */
  static async search(churchId: string, searchTerm: string): Promise<User[]> {
    const searchLower = searchTerm.toLowerCase()
    const records = await prisma.user.findMany({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
    })
    return records
      .map((record) => this.fromPrisma(record))
      .filter((user) =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      )
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
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

    await prisma.user.update({
      where: { id },
      data: { xp: newXP, level: newLevel, updatedAt: new Date() },
    })
  }
}

