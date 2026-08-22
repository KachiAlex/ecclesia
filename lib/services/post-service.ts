import { prisma } from '@/lib/prisma'

export interface Post {
  id: string
  userId: string
  churchId: string
  content: string
  type: string
  imageUrl?: string
  likes: number
  createdAt: Date
  updatedAt: Date
}

const fromPrisma = (record: any): Post => {
  const { firestoreData, ...rest } = record
  const legacy = (firestoreData as Record<string, unknown>) || {}
  return { ...legacy, ...rest } as Post
}

export class PostService {
  static async findById(id: string): Promise<Post | null> {
    const record = await prisma.post.findUnique({ where: { id } })
    if (!record) return null
    return fromPrisma(record)
  }

  static async create(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes'>): Promise<Post> {
    const record = await prisma.post.create({
      data: {
        ...data,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    })
    return fromPrisma(record)
  }

  static async findByChurch(churchId: string, limit: number = 20, lastDocId?: string): Promise<Post[]> {
    const records = await prisma.post.findMany({
      where: { churchId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: lastDocId ? 1 : undefined,
      cursor: lastDocId ? { id: lastDocId } : undefined,
    })
    return records.map(fromPrisma)
  }

  static async findByUser(userId: string, limit: number = 20): Promise<Post[]> {
    const records = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return records.map(fromPrisma)
  }

  static async incrementLikes(id: string): Promise<void> {
    await prisma.post.update({
      where: { id },
      data: { likes: { increment: 1 }, updatedAt: new Date() },
    })
  }

  static async decrementLikes(id: string): Promise<void> {
    await prisma.post.update({
      where: { id },
      data: { likes: { decrement: 1 }, updatedAt: new Date() },
    })
  }

  static async delete(id: string): Promise<void> {
    await prisma.post.delete({ where: { id } })
  }
}

