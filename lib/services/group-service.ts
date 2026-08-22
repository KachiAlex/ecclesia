import { prisma } from '@/lib/prisma'

export interface Group {
  id: string
  churchId: string
  departmentId?: string
  name: string
  description?: string
  latitude?: number
  longitude?: number
  createdAt: Date
  updatedAt: Date
}

export interface GroupMembership {
  id: string
  userId: string
  groupId: string
  role: string
  joinedAt: Date
}

const fromPrisma = (record: any): Group => {
  const { firestoreData, ...rest } = record
  const legacy = (firestoreData as Record<string, unknown>) || {}
  return { ...legacy, ...rest } as Group
}

const fromPrismaMembership = (record: any): GroupMembership => {
  const { firestoreData, ...rest } = record
  const legacy = (firestoreData as Record<string, unknown>) || {}
  return { ...legacy, ...rest } as GroupMembership
}

export class GroupService {
  static async findByChurch(churchId: string): Promise<Group[]> {
    const records = await prisma.group.findMany({ where: { churchId } })
    return records.map(fromPrisma)
  }
}

export class GroupMembershipService {
  static async findByUserAndGroup(userId: string, groupId: string): Promise<GroupMembership | null> {
    const record = await prisma.groupMembership.findFirst({
      where: { userId, groupId },
    })
    if (!record) return null
    return fromPrismaMembership(record)
  }
}
