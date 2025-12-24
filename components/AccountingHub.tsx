'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Branch = {
  id: string
  name: string
}

type LedgerItem = {
  kind: 'income' | 'expense'
  id: string
  branchId?: string
  currency?: string
  amount: number
  title: string
  date: string
  meta?: any
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

  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState<string>('')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')

  const [ledger, setLedger] = useState<LedgerItem[]>([])
  const [totals, setTotals] = useState<{ income: number; expenses: number; net: number } | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)

  const [incomeSaving, setIncomeSaving] = useState(false)
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    currency: '',
    source: 'Other',
    description: '',
    incomeDate: new Date().toISOString().slice(0, 10),
  })
  const [incomeReceipt, setIncomeReceipt] = useState<File | null>(null)

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    currency: '',
    category: 'Other',
    description: '',
    expenseDate: new Date().toISOString().slice(0, 10),
  })

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const { balanceRows, incomePercent, expensesPercent } = useMemo(() => {
    const incomeTotal = totals?.income ?? 0
    const expensesTotal = totals?.expenses ?? 0
    const netTotal = totals?.net ?? incomeTotal - expensesTotal
    const base = incomeTotal + expensesTotal
    const incomeShare = base > 0 ? Math.round((incomeTotal / base) * 100) : 0
    return {
      balanceRows: [
        {
          label: 'Total Income',
          amount: incomeTotal,
          tone: 'positive',
          helper: 'Giving + manual income entries',
        },
        {
          label: 'Total Expenses',
          amount: expensesTotal,
          tone: 'negative',
          helper: 'All recorded operating expenses',
        },
        {
          label: 'Net Balance',
          amount: netTotal,
          tone: netTotal >= 0 ? 'positive' : 'negative',
          helper: netTotal >= 0 ? 'Surplus available to reinvest' : 'Deficit — review spending',
        },
      ],
      incomePercent: incomeShare,
      expensesPercent: base > 0 ? 100 - incomeShare : 0,
    }
  }, [totals])

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (branchId.trim()) qs.set('branchId', branchId.trim())
    if (start) qs.set('start', new Date(start).toISOString())
    if (end) qs.set('end', new Date(end).toISOString())
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [branchId, start, end])

  async function readApiError(res: Response) {
    try {
      const json = await res.json()
      return json?.error || 'Request failed'
    } catch {
      try {
        const text = await res.text()
        return text || 'Request failed'
      } catch {
        return 'Request failed'
      }
    }
  }

  const loadBranches = useCallback(async () => {
    try {
      const cur = await fetch('/api/churches/switch', { cache: 'no-store' })
      if (!cur.ok) return
      const curJson = await cur.json()
      const churchId = curJson?.churchId as string | undefined
      if (!churchId) return

      const res = await fetch(`/api/churches/${churchId}/branches`, { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setBranches((json || []).map((b: any) => ({ id: b.id, name: b.name })))
    } catch {
      // ignore
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ledgerRes, expensesRes] = await Promise.all([
        fetch(`/api/accounting/ledger${queryString}`, { cache: 'no-store' }),
        fetch(`/api/accounting/expenses${queryString}`, { cache: 'no-store' }),
      ])

      if (!ledgerRes.ok) throw new Error(await readApiError(ledgerRes))
      if (!expensesRes.ok) throw new Error(await readApiError(expensesRes))

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
  }, [queryString])

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!branchId.trim()) {
      setError('Select a branch to export.')
      return
    }

    setExporting(format)
    setError(null)
    try {
      const res = await fetch(`/api/accounting/export/${format}${queryString}`, {
        cache: 'no-store',
      })

      if (!res.ok) throw new Error(await readApiError(res))
      const blob = await res.blob()
      downloadFile(blob, `accounting-balance-sheet.${format}`)
    } catch (e: any) {
      setError(e?.message || `Failed to export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  useEffect(() => {
    loadBranches()
    loadAll()
  }, [loadAll, loadBranches])

  async function createExpense() {
    if (!branchId.trim()) {
      setError('Please select a branch before adding an expense.')
      return
    }
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

      if (!res.ok) throw new Error(await readApiError(res))

      setExpenseForm((p) => ({ ...p, amount: '', description: '' }))
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function createIncome() {
    if (!branchId.trim()) {
      setError('Please select a branch before adding income.')
      return
    }
    setIncomeSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.set('branchId', branchId.trim() || '')
      fd.set('amount', incomeForm.amount)
      fd.set('currency', incomeForm.currency || '')
      fd.set('source', incomeForm.source)
      fd.set('description', incomeForm.description || '')
      fd.set('incomeDate', new Date(incomeForm.incomeDate).toISOString())
      if (incomeReceipt) fd.set('file', incomeReceipt)

      const res = await fetch('/api/accounting/income', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) throw new Error(await readApiError(res))

      setIncomeForm((p) => ({ ...p, amount: '', description: '' }))
      setIncomeReceipt(null)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to save income')
    } finally {
      setIncomeSaving(false)
    }
  }

  async function voidManualIncome(incomeId: string) {
    setError(null)
    const reason = window.prompt('Reason for void (optional):') || ''
    try {
      const res = await fetch(`/api/accounting/income/${incomeId}/void`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error(await readApiError(res))
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to void')
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

  const voidedIds = new Set(
    ledger
      .filter((x) => x.kind === 'income' && x.meta?.source === 'MANUAL' && x.meta?.voidsIncomeId)
      .map((x) => x.meta.voidsIncomeId as string)
  )

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
          <label className="text-xs font-semibold text-gray-600">Branch (optional)</label>
          <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
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
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={!branchId.trim() || exporting === 'csv'}
              className={`px-3 py-2 rounded-lg border text-sm transition ${
                branchId.trim()
                  ? 'hover:bg-gray-50'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {exporting === 'csv' ? 'Exporting…' : 'Excel (CSV)'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={!branchId.trim() || exporting === 'pdf'}
              className={`px-3 py-2 rounded-lg border text-sm transition ${
                branchId.trim()
                  ? 'hover:bg-gray-50'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
          </div>
          {!branchId.trim() && <div className="text-xs text-gray-500 mt-2">Select a branch to export.</div>}
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

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Balance Sheet</h2>
            <p className="text-sm text-gray-600">Live snapshot of income versus expenses for this filter range.</p>
          </div>
          <div className="text-xs text-gray-500">
            Updated {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-3">
          {balanceRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{row.label}</p>
                <p className="text-xs text-gray-500">{row.helper}</p>
              </div>
              <div className={`text-lg font-semibold ${row.tone === 'positive' ? 'text-green-600' : row.tone === 'negative' ? 'text-red-600' : 'text-gray-900'}`}>
                {numberFormatter.format(row.amount ?? 0)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Income {incomePercent}%</span>
            <span>Expenses {expensesPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${incomePercent}%` }}
            ></div>
            <div
              className="h-full bg-red-500 -mt-2"
              style={{ width: `${expensesPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="text-lg font-semibold">Add Expense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Amount</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Currency (optional)</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={expenseForm.currency} onChange={(e) => setExpenseForm((p) => ({ ...p, currency: e.target.value }))}>
                  <option value="">Default</option>
                  {['NGN','USD','GBP','EUR','CAD','AUD','ZAR','GHS','KES'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="text-lg font-semibold">Add Income (Manual)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Amount</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={incomeForm.amount} onChange={(e) => setIncomeForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Currency (optional)</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={incomeForm.currency} onChange={(e) => setIncomeForm((p) => ({ ...p, currency: e.target.value }))}>
                  <option value="">Default</option>
                  {['NGN','USD','GBP','EUR','CAD','AUD','ZAR','GHS','KES'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Source</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={incomeForm.source} onChange={(e) => setIncomeForm((p) => ({ ...p, source: e.target.value }))}>
                  {['Cash Offering','Bank Transfer','Grant','Fundraising','Sponsorship','Venue Rental','Other'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Date</label>
                <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={incomeForm.incomeDate} onChange={(e) => setIncomeForm((p) => ({ ...p, incomeDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Description (optional)</label>
              <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={incomeForm.description} onChange={(e) => setIncomeForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Receipt (optional: PDF/JPG/PNG/WebP, max 10MB)</label>
              <input type="file" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" accept="application/pdf,image/*" onChange={(e) => setIncomeReceipt(e.target.files?.[0] || null)} />
            </div>
            <button disabled={incomeSaving} onClick={createIncome} className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-60">
              {incomeSaving ? 'Saving...' : 'Save Income'}
            </button>
          </div>
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

                      {it.kind === 'income' && it.meta?.source && (
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${it.meta.source === 'GIVING' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {it.meta.source}
                          </span>
                          {it.meta?.attachmentUrl && (
                            <a className="text-xs underline text-gray-700" href={it.meta.attachmentUrl} target="_blank" rel="noreferrer">
                              Receipt
                            </a>
                          )}
                          {it.meta?.voidsIncomeId && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                              Reversal
                            </span>
                          )}
                          {it.meta.source === 'MANUAL' && it.amount > 0 && !voidedIds.has(it.id) && (
                            <button type="button" onClick={() => voidManualIncome(it.id)} className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50">
                              Void
                            </button>
                          )}
                        </div>
                      )}
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
