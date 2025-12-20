"use client"

import { useEffect, useMemo, useState } from "react"
import LicenseManagerWrapper from './LicenseManagerWrapper'

interface TenantDetailData {
  church: any
  subscription: any
  plan: any
  availablePlans: any[]
  userCount: number
  planMeta?: any
  recommendedPlanMeta?: any
}

interface TenantDetailModalProps {
  open: boolean
  loading: boolean
  error: string
  data: TenantDetailData | null
  onClose: () => void
  onRefresh: () => void
}

const formatDate = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

export default function TenantDetailModal({ open, loading, error, data, onClose, onRefresh }: TenantDetailModalProps) {
  const [editMode, setEditMode] = useState(false)
  const [formValues, setFormValues] = useState({
    name: "",
    slug: "",
    city: "",
    country: "",
    email: "",
    phone: "",
    address: "",
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionMessage, setActionMessage] = useState("")

  const church = data?.church
  const subscription = data?.subscription
  const plan = data?.plan
  const availablePlans = data?.availablePlans
  const planMeta = data?.planMeta
  const recommendedPlanMeta = data?.recommendedPlanMeta
  const isOverUserLimit =
    planMeta?.limits?.maxUsers && data?.userCount
      ? data.userCount > planMeta.limits.maxUsers
      : false

  useEffect(() => {
    if (church) {
      setFormValues({
        name: church.name || "",
        slug: church.slug || "",
        city: church.city || "",
        country: church.country || "",
        email: church.email || "",
        phone: church.phone || "",
        address: church.address || "",
      })
    }
  }, [church])

  useEffect(() => {
    if (!open) {
      setEditMode(false)
      setActionLoading(false)
      setActionError("")
      setActionMessage("")
    }
  }, [open])

  const status = subscription?.status || "TRIAL"

  const planList = useMemo(() => {
    if (availablePlans && availablePlans.length > 0) {
      return availablePlans
    }
    if (plan) {
      return [plan]
    }
    return []
  }, [plan, availablePlans])

  const onChangeField = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const showMessage = (type: "error" | "success", text: string) => {
    if (type === "error") {
      setActionError(text)
      setActionMessage("")
    } else {
      setActionError("")
      setActionMessage(text)
    }
  }

  const handleUpdateDetails = async () => {
    if (!church) return
    setActionLoading(true)
    showMessage("success", "")
    try {
      const response = await fetch(`/api/superadmin/churches/${church.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_church",
          name: formValues.name,
          slug: formValues.slug,
          city: formValues.city,
          country: formValues.country,
          email: formValues.email,
          phone: formValues.phone,
          address: formValues.address,
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update tenant")
      }
      showMessage("success", "Tenant details updated")
      setEditMode(false)
      onRefresh()
    } catch (err: any) {
      showMessage("error", err.message || "Unable to update tenant")
    } finally {
      setActionLoading(false)
    }
  }

  const callActionEndpoint = async (endpoint: string, method: "POST" | "DELETE" = "POST") => {
    if (!church) return
    setActionLoading(true)
    showMessage("success", "")
    try {
      const response = await fetch(endpoint, { method })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || "Request failed")
      }
      showMessage("success", payload.message || "Action completed")
      onRefresh()
    } catch (err: any) {
      showMessage("error", err.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspend = () => {
    if (!church) return
    if (status === "SUSPENDED") {
      callActionEndpoint(`/api/superadmin/churches/${church.id}/activate`)
    } else if (confirm("Suspend this church? They will lose access.")) {
      callActionEndpoint(`/api/superadmin/churches/${church.id}/suspend`)
    }
  }

  const handleDelete = () => {
    if (!church) return
    if (!confirm("Delete this tenant? This will suspend their subscription.")) {
      return
    }
    callActionEndpoint(`/api/superadmin/churches/${church.id}`, "DELETE")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Tenant Overview</p>
            <h2 className="text-2xl font-bold text-gray-900">{church?.name || "Loading tenant..."}</h2>
            {church?.slug && <p className="text-sm text-gray-500">/{church.slug}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center text-red-600">{error}</div>
        ) : !church ? (
          <div className="px-6 py-8 text-center text-gray-500">No tenant data available.</div>
        ) : (
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
            <div className="space-y-6">
              {actionMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                  {actionMessage}
                </div>
              )}
              {actionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  {actionError}
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Tenant Details</h3>
                  {!editMode ? (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={handleUpdateDetails}
                        disabled={actionLoading}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Name", field: "name", type: "text" },
                    { label: "Slug", field: "slug", type: "text" },
                    { label: "Email", field: "email", type: "email" },
                    { label: "Phone", field: "phone", type: "text" },
                    { label: "City", field: "city", type: "text" },
                    { label: "Country", field: "country", type: "text" },
                    { label: "Address", field: "address", type: "text" },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="text-sm font-medium text-gray-600">{label}</label>
                      {editMode ? (
                        <input
                          type={type}
                          value={(formValues as any)[field] ?? ""}
                          onChange={(e) => onChangeField(field as keyof typeof formValues, e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{(church as any)[field] || '—'}</p>
                      )}
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900">Created</p>
                      <p>{formatDate(church.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Members</p>
                      <p>{data?.userCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {planMeta && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Current Tier</p>
                      <h3 className="text-xl font-bold text-gray-900">{planMeta.name}</h3>
                      <p className="text-sm text-gray-600">{planMeta.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>
                        ${planMeta.priceMonthlyRange.min}–{planMeta.priceMonthlyRange.max}/mo
                      </p>
                      <p>
                        ${planMeta.priceAnnualRange.min}–{planMeta.priceAnnualRange.max}/yr
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Ideal For</p>
                      <p>{planMeta.idealUseCases?.join(', ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">User Limit</p>
                      <p>
                        {planMeta.limits?.maxUsers ? `${planMeta.limits.maxUsers} users` : 'Unlimited'}{' '}
                        {isOverUserLimit && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Over limit
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {planMeta.features.slice(0, 4).map((feature: string) => (
                      <span
                        key={feature}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {recommendedPlanMeta && recommendedPlanMeta.id !== planMeta.id && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">
                        Recommended upgrade: {recommendedPlanMeta.name}
                      </p>
                      <p className="mt-1 text-xs text-amber-800">
                        Based on current size (~{data?.userCount ?? '—'} members) we recommend moving to the{' '}
                        {recommendedPlanMeta.name} plan for optimal coverage. Use “Change Plan” in License Manager below to
                        upgrade instantly.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {(() => {
                    const statusColors: Record<string, string> = {
                      TRIAL: 'bg-blue-600 hover:bg-blue-700',
                      ACTIVE: 'bg-red-600 hover:bg-red-700',
                      SUSPENDED: 'bg-green-600 hover:bg-green-700',
                    }
                    const actionColor = statusColors[status] ?? 'bg-red-600 hover:bg-red-700'
                    return (
                      <button
                        type="button"
                        onClick={handleSuspend}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${actionColor} disabled:opacity-50`}
                      >
                        {status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                      </button>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                  >
                    Delete Tenant
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {status}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <dt className="font-semibold text-gray-900">Plan</dt>
                    <dd>{plan?.name || "Free"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Billing</dt>
                    <dd>
                      {plan?.price
                        ? `$${plan.price}/${plan.billingCycle === "monthly" ? "mo" : "yr"}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Trial ends</dt>
                    <dd>{formatDate(subscription?.trialEndsAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Renewal</dt>
                    <dd>{formatDate(subscription?.endDate)}</dd>
                  </div>
                </dl>
              </div>

              <LicenseManagerWrapper
                churchId={church.id}
                initialSubscription={subscription}
                initialPlan={plan}
                initialPlans={planList}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
