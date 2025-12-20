"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Plan = {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  billingCycle: string
  features: string[]
  type?: string
}

const currencyOptions = ["USD", "NGN", "EUR", "GBP"]

const formatPrice = (value: number, currency: string) => {
  if (!value || value === 0) return "Free"
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value)
  } catch {
    return `${currency} ${value}`
  }
}

interface PlanPricingManagerProps {
  initialPlans: Plan[]
}

export default function PlanPricingManager({ initialPlans }: PlanPricingManagerProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      initialPlans.map((plan) => [
        plan.id,
        {
          price: plan.price,
          currency: plan.currency || "USD",
          billingCycle: plan.billingCycle || "monthly",
        },
      ])
    )
  )
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  }, [plans])

  const handleDraftChange = (planId: string, field: string, value: string | number) => {
    setDrafts((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }))
  }

  const handleSave = async (planId: string) => {
    const draft = drafts[planId]
    if (!draft) return

    const parsedPrice = Number(draft.price)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setStatus({ type: "error", text: "Price must be a non-negative number." })
      return
    }

    const payload = {
      price: parsedPrice,
      currency: draft.currency || "USD",
      billingCycle: draft.billingCycle || "monthly",
    }

    setSavingPlanId(planId)
    setStatus(null)

    try {
      const response = await fetch(`/api/superadmin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to update plan")
      }

      const updatedPlan = result.plan as Plan
      setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, ...updatedPlan } : plan)))
      setDrafts((prev) => ({
        ...prev,
        [planId]: {
          price: updatedPlan.price,
          currency: updatedPlan.currency,
          billingCycle: updatedPlan.billingCycle,
        },
      }))
      setStatus({ type: "success", text: `${updatedPlan.name} pricing updated.` })
      router.refresh()
    } catch (error: any) {
      setStatus({ type: "error", text: error.message || "Unable to update plan. Try again." })
    } finally {
      setSavingPlanId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-600">Edit pricing, currency, and billing cadence for each plan.</p>
        </div>
        {status && (
          <div
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              status.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {status.text}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => {
          const draft = drafts[plan.id]
          const isSaving = savingPlanId === plan.id
          return (
            <div key={plan.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  {plan.type && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {plan.type}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatPrice(plan.price, plan.currency)}
                  <span className="text-base text-gray-500 font-normal">
                    {plan.billingCycle === "annual" ? "/year" : "/month"}
                  </span>
                </p>
                {plan.description && <p className="text-sm text-gray-600 mt-1">{plan.description}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex flex-col">
                  Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft?.price ?? 0}
                    onChange={(e) => handleDraftChange(plan.id, "price", e.target.value)}
                    className="mt-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 flex flex-col">
                  Currency
                  <select
                    value={draft?.currency ?? "USD"}
                    onChange={(e) => handleDraftChange(plan.id, "currency", e.target.value)}
                    className="mt-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  >
                    {currencyOptions.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700 flex flex-col">
                  Billing Cycle
                  <select
                    value={draft?.billingCycle ?? "monthly"}
                    onChange={(e) => handleDraftChange(plan.id, "billingCycle", e.target.value)}
                    className="mt-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={() => handleSave(plan.id)}
                disabled={isSaving}
                className="mt-auto rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Pricing"}
              </button>

              {plan.features?.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Included Features</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
