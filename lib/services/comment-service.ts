import { prisma } from '@/lib/prisma'

export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  parentCommentId?: string
  createdAt: Date
  updatedAt: Date
}

const fromPrisma = (record: any): Comment => {
  const { firestoreData, ...rest } = record
  const legacy = (firestoreData as Record<string, unknown>) || {}
  return { ...legacy, ...rest } as Comment
}

export class CommentService {
  static async findById(id: string): Promise<Comment | null> {
    const record = await prisma.comment.findUnique({ where: { id } })
    if (!record) return null
    return fromPrisma(record)
  }

  static async create(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const record = await prisma.comment.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    })
    return fromPrisma(record)
  }

  static async findByPost(postId: string, limit: number = 50): Promise<Comment[]> {
    const records = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
    return records.map(fromPrisma)
  }

  static async update(id: string, content: string): Promise<Comment> {
    const record = await prisma.comment.update({
      where: { id },
      data: { content, updatedAt: new Date() },
    })
    return fromPrisma(record)
  }

  static async delete(id: string): Promise<void> {
    await prisma.comment.delete({ where: { id } })
  }
}

