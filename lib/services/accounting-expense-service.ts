import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue, Query } from 'firebase-admin/firestore'

export type AccountingExpenseCategory =
  | 'Rent'
  | 'Utilities'
  | 'Welfare'
  | 'Transport'
  | 'Media'
  | 'Maintenance'
  | 'Salaries'
  | 'Missions'
  | 'Other'

export interface AccountingExpense {
  id: string
  churchId: string
  branchId?: string
  amount: number
  currency?: string
  category: AccountingExpenseCategory | string
  description?: string
  expenseDate: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export class AccountingExpenseService {
  static async findById(id: string): Promise<AccountingExpense | null> {
    const doc = await db.collection(COLLECTIONS.accountingExpenses).doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      expenseDate: toDate(data.expenseDate),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as AccountingExpense
  }

  static async create(
    data: Omit<AccountingExpense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AccountingExpense> {
    const expenseData = {
      ...data,
      expenseDate: data.expenseDate instanceof Date ? data.expenseDate : new Date(data.expenseDate),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.accountingExpenses).doc()
    await docRef.set(expenseData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      expenseDate: toDate(createdData.expenseDate),
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as AccountingExpense
  }

  static async findByChurch(
    churchId: string,
    options?: {
      branchId?: string | null
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<AccountingExpense[]> {
    let query: Query = db.collection(COLLECTIONS.accountingExpenses).where('churchId', '==', churchId)

    if (options?.branchId) {
      query = query.where('branchId', '==', options.branchId)
    }

    // NOTE: Avoid orderBy + equality filters to prevent composite index requirements.
    // Fetch a limited set and sort/filter in-memory.
    query = query.limit(options?.limit || 200)

    const snapshot = await query.get()
    let expenses = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        expenseDate: toDate(data.expenseDate),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as AccountingExpense
    })

    if (options?.startDate) {
      expenses = expenses.filter((e) => e.expenseDate >= options.startDate!)
    }

    if (options?.endDate) {
      expenses = expenses.filter((e) => e.expenseDate <= options.endDate!)
    }

    expenses = expenses.sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())

    return expenses
  }
}
