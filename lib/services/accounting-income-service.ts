import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue, Query } from 'firebase-admin/firestore'

export type AccountingIncomeSource =
  | 'Cash Offering'
  | 'Bank Transfer'
  | 'Grant'
  | 'Fundraising'
  | 'Sponsorship'
  | 'Venue Rental'
  | 'Other'

export interface AccountingIncome {
  id: string
  churchId: string
  branchId?: string
  amount: number
  currency?: string
  source: AccountingIncomeSource | string
  description?: string
  incomeDate: Date
  attachmentUrl?: string
  attachmentPath?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  voidsIncomeId?: string
}

export class AccountingIncomeService {
  static async findById(id: string): Promise<AccountingIncome | null> {
    const doc = await db.collection(COLLECTIONS.accountingIncome).doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      incomeDate: toDate(data.incomeDate),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as AccountingIncome
  }

  static async create(
    data: Omit<AccountingIncome, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AccountingIncome> {
    const incomeData: any = {
      ...data,
      incomeDate: data.incomeDate instanceof Date ? data.incomeDate : new Date(data.incomeDate),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.accountingIncome).doc()
    await docRef.set(incomeData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      incomeDate: toDate(createdData.incomeDate),
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as AccountingIncome
  }

  static async findByChurch(
    churchId: string,
    options?: {
      branchId?: string | null
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<AccountingIncome[]> {
    let query: Query = db.collection(COLLECTIONS.accountingIncome).where('churchId', '==', churchId)

    if (options?.branchId) {
      query = query.where('branchId', '==', options.branchId)
    }

    query = query.limit(options?.limit || 200)

    const snapshot = await query.get()
    let incomes = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        incomeDate: toDate(data.incomeDate),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as AccountingIncome
    })

    if (options?.startDate) {
      incomes = incomes.filter((i) => i.incomeDate >= options.startDate!)
    }

    if (options?.endDate) {
      incomes = incomes.filter((i) => i.incomeDate <= options.endDate!)
    }

    incomes = incomes.sort((a, b) => b.incomeDate.getTime() - a.incomeDate.getTime())

    return incomes
  }
}
