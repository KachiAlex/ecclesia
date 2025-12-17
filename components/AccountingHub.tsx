'use client'

import { useEffect, useMemo, useState } from 'react'

type LedgerItem = {
  kind: 'income' | 'expense'
  id: string
  branchId?: string
  currency?: string
  amount: number
  title: string
  date: string
}

type Expense = {
  id: string
  branchId?: string
  amount: number
  currency?: string
  category: string
  description?: string
  expenseDate: string
}

export default function AccountingHub({ isAdmin }: { isAdmin: boolean }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [branchId, setBranchId] = useState<string>('')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')

  const [ledger, setLedger] = useState<LedgerItem[]>([])
  const [totals, setTotals] = useState<{ income: number; expenses: number; net: number } | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    currency: '',
    category: 'Other',
    description: '',
    expenseDate: new Date().toISOString().slice(0, 10),
  })

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (branchId.trim()) qs.set('branchId', branchId.trim())
    if (start) qs.set('start', new Date(start).toISOString())
    if (end) qs.set('end', new Date(end).toISOString())
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [branchId, start, end])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [ledgerRes, expensesRes] = await Promise.all([
        fetch(`/api/accounting/ledger${queryString}`, { cache: 'no-store' }),
        fetch(`/api/accounting/expenses${queryString}`, { cache: 'no-store' }),
      ])

      if (!ledgerRes.ok) throw new Error((await ledgerRes.json())?.error || 'Failed to load ledger')
      if (!expensesRes.ok) throw new Error((await expensesRes.json())?.error || 'Failed to load expenses')

      const ledgerJson = await ledgerRes.json()
      const expensesJson = await expensesRes.json()

      setLedger(ledgerJson.items || [])
      setTotals(ledgerJson.totals || null)
      setExpenses((expensesJson.expenses || []).map((e: any) => ({
        id: e.id,
        branchId: e.branchId,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        description: e.description,
        expenseDate: e.expenseDate,
      })))
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  async function createExpense() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          branchId: branchId.trim() || null,
          amount: Number(expenseForm.amount),
          currency: expenseForm.currency || null,
          category: expenseForm.category,
          description: expenseForm.description || null,
          expenseDate: new Date(expenseForm.expenseDate).toISOString(),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save expense')

      setExpenseForm((p) => ({ ...p, amount: '', description: '' }))
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Accounting</h1>
        <p className="text-gray-600 mt-2">You do not have access to Accounting.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Accounting</h1>
          <p className="text-gray-600 mt-1">Income (Giving) and Expenses, branch-scoped with export.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs font-semibold text-gray-600">Branch ID (optional)</label>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs font-semibold text-gray-600">Start (optional)</label>
          <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs font-semibold text-gray-600">End (optional)</label>
          <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="bg-white rounded-xl border p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-gray-600">Exports</div>
          <div className="mt-2 flex gap-2">
            <a className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50" href={`/api/accounting/export/csv${queryString}`}>Excel (CSV)</a>
            <a className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50" href={`/api/accounting/export/pdf${queryString}`}>PDF</a>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold text-gray-600">Total Income</div>
          <div className="text-2xl font-bold mt-1">{totals?.income ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold text-gray-600">Total Expenses</div>
          <div className="text-2xl font-bold mt-1">{totals?.expenses ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-semibold text-gray-600">Net</div>
          <div className="text-2xl font-bold mt-1">{totals?.net ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="text-lg font-semibold">Add Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Amount</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Currency (optional)</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.currency} onChange={(e) => setExpenseForm((p) => ({ ...p, currency: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Category</label>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.category} onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}>
                {['Rent','Utilities','Welfare','Transport','Media','Maintenance','Salaries','Missions','Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Date</label>
              <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.expenseDate} onChange={(e) => setExpenseForm((p) => ({ ...p, expenseDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Description (optional)</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <button disabled={saving} onClick={createExpense} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Expense'}
          </button>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-3">Ledger</h2>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-auto">
              {ledger.length === 0 ? (
                <div className="text-gray-600">No ledger items for this filter.</div>
              ) : (
                ledger.map((it) => (
                  <div key={`${it.kind}_${it.id}`} className="flex items-start justify-between gap-3 border rounded-lg p-3">
                    <div>
                      <div className="text-sm font-semibold">{it.title}</div>
                      <div className="text-xs text-gray-600">{new Date(it.date).toLocaleString()} {it.branchId ? `• Branch: ${it.branchId}` : ''}</div>
                    </div>
                    <div className={`text-sm font-bold ${it.kind === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                      {it.kind === 'income' ? '+' : '-'}{it.amount} {it.currency || ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-lg font-semibold mb-3">Expenses</h2>
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expenses.length === 0 ? (
              <div className="text-gray-600">No expenses for this filter.</div>
            ) : (
              expenses.map((e) => (
                <div key={e.id} className="border rounded-lg p-3">
                  <div className="text-sm font-semibold">{e.category}</div>
                  <div className="text-xs text-gray-600">{new Date(e.expenseDate).toLocaleDateString()} {e.branchId ? `• Branch: ${e.branchId}` : ''}</div>
                  {e.description && <div className="text-sm mt-1">{e.description}</div>}
                  <div className="text-sm font-bold mt-2">-{e.amount} {e.currency || ''}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
