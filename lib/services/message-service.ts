import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
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

  static async create(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'read'>): Promise<Message> {
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
    // Get messages where user1 is sender and user2 is receiver
    const sentSnapshot = await db.collection(COLLECTIONS.messages)
      .where('senderId', '==', userId1)
      .where('receiverId', '==', userId2)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get()

    // Get messages where user2 is sender and user1 is receiver
    const receivedSnapshot = await db.collection(COLLECTIONS.messages)
      .where('senderId', '==', userId2)
      .where('receiverId', '==', userId1)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get()

    // Combine and sort
    const allMessages = [
      ...sentSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ...receivedSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    ].sort((a, b) => {
      const dateA = toDate(a.createdAt).getTime()
      const dateB = toDate(b.createdAt).getTime()
      return dateA - dateB
    })

    return allMessages.map(msg => ({
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

