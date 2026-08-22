import { prisma } from '@/lib/prisma'

export interface MessageAttachment {
  url: string
  name?: string
  contentType?: string
  size?: number
}

export interface MessageVoiceNote {
  url: string
  duration?: number
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  attachments?: MessageAttachment[]
  voiceNote?: MessageVoiceNote
  read: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GroupMessage {
  id: string
  userId: string
  groupId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMessageInput {
  senderId: string
  receiverId: string
  content: string
  attachments?: MessageAttachment[]
  voiceNote?: MessageVoiceNote
}

const fromPrisma = (record: any): Message => {
  const { firestoreData, ...rest } = record
  const legacy = (firestoreData as Record<string, unknown>) || {}
  const merged = { ...legacy, ...rest } as any
  if (merged.createdAt) merged.createdAt = new Date(merged.createdAt)
  if (merged.updatedAt) merged.updatedAt = new Date(merged.updatedAt)
  return merged as Message
}

const fromPrismaGroup = (record: any): GroupMessage => {
  const { firestoreData, ...rest } = record
  const legacy = (firestoreData as Record<string, unknown>) || {}
  const merged = { ...legacy, ...rest } as any
  if (merged.createdAt) merged.createdAt = new Date(merged.createdAt)
  if (merged.updatedAt) merged.updatedAt = new Date(merged.updatedAt)
  return merged as GroupMessage
}

export class MessageService {
  static async findById(id: string): Promise<Message | null> {
    const record = await prisma.message.findUnique({ where: { id } })
    if (!record) return null
    return fromPrisma(record)
  }

  static async create(data: CreateMessageInput): Promise<Message> {
    const record = await prisma.message.create({
      data: {
        ...data,
        read: false,
        createdAt: new Date(),
      } as any,
    })
    return fromPrisma(record)
  }

  static async findByConversation(userId1: string, userId2: string, limit: number = 100): Promise<Message[]> {
    const records = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return records.reverse().map(fromPrisma)
  }

  static async listUserMessages(userId: string): Promise<Message[]> {
    const records = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'asc' },
    })
    return records.map(fromPrisma)
  }

  static async markAsRead(messageId: string): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: { read: true },
    })
  }

  static async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    })
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.message.count({
      where: { receiverId: userId, read: false },
    })
  }

  static async getUnreadCountFromUser(userId: string, otherUserId: string): Promise<number> {
    return prisma.message.count({
      where: {
        receiverId: userId,
        senderId: otherUserId,
        read: false,
      },
    })
  }
}

export class GroupMessageService {
  static async create(data: Omit<GroupMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<GroupMessage> {
    const record = await prisma.groupMessage.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    })
    return fromPrismaGroup(record)
  }

  static async findByGroup(groupId: string, limit: number = 100): Promise<GroupMessage[]> {
    const records = await prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
    return records.map(fromPrismaGroup)
  }
}

