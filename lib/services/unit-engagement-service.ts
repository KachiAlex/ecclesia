import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue } from 'firebase-admin/firestore'
import type { MessageAttachment, MessageVoiceNote } from '@/lib/services/message-service'

export type UnitInteractionRule = {
  title: string
  description?: string
}

export interface UnitSettings {
  id: string
  churchId: string
  unitId: string
  allowMedia: boolean
  allowPolls: boolean
  allowShares: boolean
  pinnedRules?: string | null
  rules?: UnitInteractionRule[]
  createdAt: Date
  updatedAt: Date
}

export type UnitSettingsPatch = Partial<Pick<UnitSettings, 'allowMedia' | 'allowPolls' | 'allowShares' | 'pinnedRules' | 'rules'>>

const DEFAULT_UNIT_SETTINGS: Omit<UnitSettings, 'id' | 'unitId' | 'churchId' | 'createdAt' | 'updatedAt'> = {
  allowMedia: true,
  allowPolls: true,
  allowShares: true,
  pinnedRules: null,
  rules: [],
}

export interface UnitMessage {
  id: string
  unitId: string
  churchId: string
  userId: string
  content: string
  attachments?: MessageAttachment[]
  voiceNote?: MessageVoiceNote
  pinned?: boolean
  metadata?: {
    replyToMessageId?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateUnitMessageInput {
  unitId: string
  churchId: string
  userId: string
  content: string
  attachments?: MessageAttachment[]
  voiceNote?: MessageVoiceNote
  metadata?: UnitMessage['metadata']
}

export interface UnitPollOption {
  id: string
  label: string
  votes: number
}

export interface UnitPoll {
  id: string
  unitId: string
  churchId: string
  question: string
  description?: string
  options: UnitPollOption[]
  allowMultiple: boolean
  allowComments: boolean
  status: 'OPEN' | 'CLOSED'
  createdByUserId: string
  closesAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateUnitPollInput {
  unitId: string
  churchId: string
  question: string
  description?: string
  options: Array<{ label: string }>
  allowMultiple?: boolean
  allowComments?: boolean
  createdByUserId: string
  closesAt?: Date | null
}

export type UnitPollVote = {
  id: string
  unitId: string
  pollId: string
  userId: string
  optionIds: string[]
  createdAt: Date
}

export class UnitSettingsService {
  static async get(unitId: string): Promise<UnitSettings | null> {
    const doc = await db.collection(COLLECTIONS.unitSettings).where('unitId', '==', unitId).limit(1).get()
    if (doc.empty) return null
    const snapshot = doc.docs[0]
    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...DEFAULT_UNIT_SETTINGS,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as UnitSettings
  }

  static async getOrCreate(churchId: string, unitId: string): Promise<UnitSettings> {
    const existing = await this.get(unitId)
    if (existing) return existing

    const payload = {
      churchId,
      unitId,
      ...DEFAULT_UNIT_SETTINGS,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    const ref = db.collection(COLLECTIONS.unitSettings).doc()
    await ref.set(payload)
    return (await this.get(unitId)) as UnitSettings
  }

  static async update(unitId: string, patch: UnitSettingsPatch): Promise<UnitSettings> {
    const snapshot = await db.collection(COLLECTIONS.unitSettings).where('unitId', '==', unitId).limit(1).get()
    if (snapshot.empty) {
      throw new Error('Unit settings not found')
    }
    const ref = snapshot.docs[0].ref
    await ref.update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    })
    const updated = await ref.get()
    const data = updated.data()!
    return {
      id: updated.id,
      ...DEFAULT_UNIT_SETTINGS,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as UnitSettings
  }
}

export class UnitMessageService {
  static async create(input: CreateUnitMessageInput): Promise<UnitMessage> {
    const payload = {
      ...input,
      pinned: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    const ref = db.collection(COLLECTIONS.unitMessages).doc()
    await ref.set(payload)
    const created = await ref.get()
    const data = created.data()!
    return {
      id: created.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as UnitMessage
  }

  static async listByUnit(unitId: string, limit: number = 100): Promise<UnitMessage[]> {
    const snapshot = await db
      .collection(COLLECTIONS.unitMessages)
      .where('unitId', '==', unitId)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get()

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as UnitMessage
    })
  }

  static async updateMessage(unitId: string, messageId: string, patch: Partial<Pick<UnitMessage, 'content' | 'pinned'>>): Promise<UnitMessage> {
    const ref = db.collection(COLLECTIONS.unitMessages).doc(messageId)
    await ref.update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    })
    const updated = await ref.get()
    const data = updated.data()!
    if (data.unitId !== unitId) {
      throw new Error('Message does not belong to unit')
    }
    return {
      id: updated.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as UnitMessage
  }
}

export class UnitPollService {
  static async findById(id: string): Promise<UnitPoll | null> {
    const snapshot = await db.collection(COLLECTIONS.unitPolls).doc(id).get()
    if (!snapshot.exists) return null
    return this.toUnitPoll(snapshot)
  }

  static async create(input: CreateUnitPollInput): Promise<UnitPoll> {
    const payload = {
      unitId: input.unitId,
      churchId: input.churchId,
      question: input.question,
      description: input.description || null,
      options: input.options.map((option, idx) => ({
        id: `${idx + 1}`,
        label: option.label,
        votes: 0,
      })),
      allowMultiple: input.allowMultiple ?? false,
      allowComments: input.allowComments ?? false,
      status: 'OPEN' as const,
      createdByUserId: input.createdByUserId,
      closesAt: input.closesAt ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    const ref = db.collection(COLLECTIONS.unitPolls).doc()
    await ref.set(payload)
    const created = await ref.get()
    return this.toUnitPoll(created)
  }

  static async findByUnit(unitId: string, limit: number = 50): Promise<UnitPoll[]> {
    const snapshot = await db
      .collection(COLLECTIONS.unitPolls)
      .where('unitId', '==', unitId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    return snapshot.docs.map((doc) => this.toUnitPoll(doc))
  }

  static async vote(pollId: string, userId: string, optionIds: string[]): Promise<UnitPoll> {
    const pollRef = db.collection(COLLECTIONS.unitPolls).doc(pollId)
    const pollSnapshot = await pollRef.get()
    if (!pollSnapshot.exists) throw new Error('Poll not found')
    const poll = this.toUnitPoll(pollSnapshot)
    if (poll.status === 'CLOSED') throw new Error('Poll is closed')

    const dedupedOptionIds = Array.from(new Set(optionIds))
    if (!poll.allowMultiple && dedupedOptionIds.length > 1) {
      throw new Error('Multiple selections are not allowed')
    }

    const validOptions = poll.options.map((opt) => opt.id)
    if (!dedupedOptionIds.every((id) => validOptions.includes(id))) {
      throw new Error('Invalid option selection')
    }

    const voteRef = db.collection(COLLECTIONS.unitPollVotes).doc(`${pollId}-${userId}`)
    const existingVote = await voteRef.get()
    if (existingVote.exists) {
      throw new Error('You have already voted on this poll')
    }

    // record vote
    await voteRef.set({
      pollId,
      unitId: poll.unitId,
      userId,
      optionIds: dedupedOptionIds,
      createdAt: FieldValue.serverTimestamp(),
    })

    // update counts
    await pollRef.update({
      options: poll.options.map((opt) => ({
        ...opt,
        votes: dedupedOptionIds.includes(opt.id) ? opt.votes + 1 : opt.votes,
      })),
      updatedAt: FieldValue.serverTimestamp(),
    })

    const updated = await pollRef.get()
    return this.toUnitPoll(updated)
  }

  static async close(pollId: string): Promise<UnitPoll> {
    const pollRef = db.collection(COLLECTIONS.unitPolls).doc(pollId)
    await pollRef.update({
      status: 'CLOSED',
      updatedAt: FieldValue.serverTimestamp(),
    })
    const updated = await pollRef.get()
    return this.toUnitPoll(updated)
  }

  private static toUnitPoll(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): UnitPoll {
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      options: Array.isArray(data.options) ? data.options : [],
      closesAt: data.closesAt ? toDate(data.closesAt) : null,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as UnitPoll
  }
}
