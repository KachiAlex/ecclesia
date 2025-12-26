import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

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

export class MessageService {
  static async findById(id: string): Promise<Message | null> {
    const doc = await db.collection(COLLECTIONS.messages).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      read: data.read || false,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Message
  }

  static async create(data: CreateMessageInput): Promise<Message> {
    const messageData = {
      ...data,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.messages).doc()
    await docRef.set(messageData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Message
  }

  static async findByConversation(userId1: string, userId2: string, limit: number = 100): Promise<Message[]> {
    // Firestore equality filters on two fields do not require composite indexes,
    // so we fetch both directions independently and then sort/limit in memory.
    const sentSnapshot = await db.collection(COLLECTIONS.messages)
      .where('senderId', '==', userId1)
      .where('receiverId', '==', userId2)
      .get()

    const receivedSnapshot = await db.collection(COLLECTIONS.messages)
      .where('senderId', '==', userId2)
      .where('receiverId', '==', userId1)
      .get()

    const merged = [
      ...sentSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ...receivedSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    ].sort((a, b) => {
      const dateA = toDate(a.createdAt).getTime()
      const dateB = toDate(b.createdAt).getTime()
      return dateA - dateB
    })

    const limited = typeof limit === 'number' && limit > 0
      ? merged.slice(Math.max(0, merged.length - limit))
      : merged

    return limited.map(msg => ({
      id: msg.id,
      read: msg.read || false,
      ...msg,
      createdAt: toDate(msg.createdAt),
      updatedAt: toDate(msg.updatedAt),
    })) as Message[]
  }

  static async listUserMessages(userId: string): Promise<Message[]> {
    const sentSnapshot = await db
      .collection(COLLECTIONS.messages)
      .where('senderId', '==', userId)
      .get()

    const receivedSnapshot = await db
      .collection(COLLECTIONS.messages)
      .where('receiverId', '==', userId)
      .get()

    const merged = [
      ...sentSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ...receivedSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    ].sort((a, b) => {
      const dateA = toDate(a.createdAt).getTime()
      const dateB = toDate(b.createdAt).getTime()
      return dateA - dateB
    })

    return merged.map((msg) => ({
      id: msg.id,
      read: msg.read || false,
      ...msg,
      createdAt: toDate(msg.createdAt),
      updatedAt: toDate(msg.updatedAt),
    })) as Message[]
  }

  static async markAsRead(messageId: string): Promise<void> {
    await db.collection(COLLECTIONS.messages).doc(messageId).update({
      read: true,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  static async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    const snapshot = await db.collection(COLLECTIONS.messages)
      .where('senderId', '==', otherUserId)
      .where('receiverId', '==', userId)
      .where('read', '==', false)
      .get()

    const batch = db.batch()
    snapshot.docs.forEach((doc: any) => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: FieldValue.serverTimestamp(),
      })
    })
    await batch.commit()
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const snapshot = await db.collection(COLLECTIONS.messages)
      .where('receiverId', '==', userId)
      .where('read', '==', false)
      .count()
      .get()

    return snapshot.data().count || 0
  }

  static async getUnreadCountFromUser(userId: string, otherUserId: string): Promise<number> {
    const snapshot = await db
      .collection(COLLECTIONS.messages)
      .where('receiverId', '==', userId)
      .where('senderId', '==', otherUserId)
      .where('read', '==', false)
      .count()
      .get()

    return snapshot.data().count || 0
  }
}

export class GroupMessageService {
  static async create(data: Omit<GroupMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<GroupMessage> {
    const messageData = {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.groupMessages).doc()
    await docRef.set(messageData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as GroupMessage
  }

  static async findByGroup(groupId: string, limit: number = 100): Promise<GroupMessage[]> {
    const snapshot = await db.collection(COLLECTIONS.groupMessages)
      .where('groupId', '==', groupId)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as GroupMessage
    })
  }
}

