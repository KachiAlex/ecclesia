import { db, toDate } from '@/lib/firestore'
import { COLLECTIONS } from '@/lib/firestore-collections'
import { FieldValue, Query } from 'firebase-admin/firestore'

export interface PayrollPosition {
  id: string
  churchId: string
  departmentId?: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WageScale {
  id: string
  positionId: string
  churchId: string
  type: string
  amount: number
  currency: string
  hoursPerWeek?: number
  commissionRate?: number
  benefits: number
  deductions: number
  effectiveFrom: Date
  effectiveTo?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Salary {
  id: string
  userId: string
  positionId: string
  wageScaleId: string
  startDate: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PayrollPeriod {
  id: string
  churchId: string
  startDate: Date
  endDate: Date
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface PayrollRecord {
  id: string
  periodId: string
  userId: string
  salaryId: string
  grossAmount: number
  deductions: number
  netAmount: number
  status: string
  paymentMethod?: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class PayrollPositionService {
  static async findByChurch(churchId: string, activeOnly: boolean = true): Promise<PayrollPosition[]> {
    let query: Query = db.collection(COLLECTIONS.payrollPositions)
      .where('churchId', '==', churchId)
    
    if (activeOnly) {
      query = query.where('isActive', '==', true)
    }

    const snapshot = await query.orderBy('name', 'asc').get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        isActive: data.isActive !== false,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as PayrollPosition
    })
  }

  static async findById(id: string): Promise<PayrollPosition | null> {
    const doc = await db.collection(COLLECTIONS.payrollPositions).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      isActive: data.isActive !== false,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PayrollPosition
  }

  static async create(data: Omit<PayrollPosition, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollPosition> {
    const positionData = {
      ...data,
      isActive: data.isActive !== false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.payrollPositions).doc()
    await docRef.set(positionData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as PayrollPosition
  }

  static async update(id: string, data: Partial<PayrollPosition>): Promise<PayrollPosition> {
    await db.collection(COLLECTIONS.payrollPositions).doc(id).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return this.findById(id) as Promise<PayrollPosition>
  }
}

export class WageScaleService {
  static async findByChurch(churchId: string, positionId?: string): Promise<WageScale[]> {
    let query: Query = db.collection(COLLECTIONS.wageScales)
      .where('churchId', '==', churchId)
    
    if (positionId) {
      query = query.where('positionId', '==', positionId)
    }

    const snapshot = await query.orderBy('effectiveFrom', 'desc').get()

    // Filter active scales
    const now = new Date()
    return snapshot.docs
      .map((doc: any) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          effectiveFrom: toDate(data.effectiveFrom),
          effectiveTo: data.effectiveTo ? toDate(data.effectiveTo) : undefined,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as WageScale
      })
      .filter((scale: any) => !scale.effectiveTo || scale.effectiveTo >= now)
  }

  static async create(data: Omit<WageScale, 'id' | 'createdAt' | 'updatedAt'>): Promise<WageScale> {
    const scaleData = {
      ...data,
      effectiveFrom: data.effectiveFrom instanceof Date ? data.effectiveFrom : new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? (data.effectiveTo instanceof Date ? data.effectiveTo : new Date(data.effectiveTo)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.wageScales).doc()
    await docRef.set(scaleData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      effectiveFrom: toDate(createdData.effectiveFrom),
      effectiveTo: createdData.effectiveTo ? toDate(createdData.effectiveTo) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as WageScale
  }
}

export class SalaryService {
  static async findByUser(userId: string): Promise<Salary[]> {
    const snapshot = await db.collection(COLLECTIONS.salaries)
      .where('userId', '==', userId)
      .orderBy('startDate', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: toDate(data.startDate),
        endDate: data.endDate ? toDate(data.endDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Salary
    })
  }

  static async create(data: Omit<Salary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Salary> {
    const salaryData = {
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
      endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.salaries).doc()
    await docRef.set(salaryData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startDate: toDate(createdData.startDate),
      endDate: createdData.endDate ? toDate(createdData.endDate) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as Salary
  }
}

export class PayrollPeriodService {
  static async findByChurch(churchId: string): Promise<PayrollPeriod[]> {
    const snapshot = await db.collection(COLLECTIONS.payrollPeriods)
      .where('churchId', '==', churchId)
      .orderBy('startDate', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: toDate(data.startDate),
        endDate: toDate(data.endDate),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as PayrollPeriod
    })
  }

  static async create(data: Omit<PayrollPeriod, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollPeriod> {
    const periodData = {
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
      endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.payrollPeriods).doc()
    await docRef.set(periodData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      startDate: toDate(createdData.startDate),
      endDate: toDate(createdData.endDate),
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as PayrollPeriod
  }
}

export class PayrollRecordService {
  static async findByPeriod(periodId: string): Promise<PayrollRecord[]> {
    const snapshot = await db.collection(COLLECTIONS.payrollRecords)
      .where('periodId', '==', periodId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        paidAt: data.paidAt ? toDate(data.paidAt) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as PayrollRecord
    })
  }

  static async findById(id: string): Promise<PayrollRecord | null> {
    const doc = await db.collection(COLLECTIONS.payrollRecords).doc(id).get()
    if (!doc.exists) return null
    
    const data = doc.data()!
    return {
      id: doc.id,
      ...data,
      paidAt: data.paidAt ? toDate(data.paidAt) : undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as PayrollRecord
  }

  static async create(data: Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayrollRecord> {
    const recordData = {
      ...data,
      paidAt: data.paidAt ? (data.paidAt instanceof Date ? data.paidAt : new Date(data.paidAt)) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const docRef = db.collection(COLLECTIONS.payrollRecords).doc()
    await docRef.set(recordData)

    const created = await docRef.get()
    const createdData = created.data()!
    return {
      id: created.id,
      ...createdData,
      paidAt: createdData.paidAt ? toDate(createdData.paidAt) : undefined,
      createdAt: toDate(createdData.createdAt),
      updatedAt: toDate(createdData.updatedAt),
    } as PayrollRecord
  }

  static async update(id: string, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (data.paidAt) {
      updateData.paidAt = data.paidAt instanceof Date ? data.paidAt : new Date(data.paidAt)
    }

    await db.collection(COLLECTIONS.payrollRecords).doc(id).update(updateData)
    return this.findById(id) as Promise<PayrollRecord>
  }
}

