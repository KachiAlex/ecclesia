'use client'

import { useMemo, useState } from 'react'

type Church = {
  id: string
  hierarchyLevels?: { key?: string; label?: string; order?: number }[] | null
}

type EditableLevel = {
  key: string
  label: string
  order: number
}

const MAX_LEVELS = 8

const DEFAULT_LEVELS: EditableLevel[] = [
  { key: 'LEVEL_1', label: 'Global Headquarters', order: 0 },
  { key: 'LEVEL_2', label: 'Region', order: 1 },
  { key: 'LEVEL_3', label: 'Zone', order: 2 },
  { key: 'LEVEL_4', label: 'Branch', order: 3 },
]

const normalizeLabel = (value: string) => value.trim()

const normalizeLevels = (input?: Church['hierarchyLevels']): EditableLevel[] => {
  if (!Array.isArray(input) || input.length === 0) {
    return DEFAULT_LEVELS
  }

  const deduped: EditableLevel[] = []
  const seen = new Set<string>()
  input
    .filter((record): record is { key?: string; label?: string; order?: number } => !!record)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .forEach((record, index) => {
      const label = normalizeLabel(record.label ?? '')
      if (!label) return
      const key =
        record.key?.trim().toUpperCase() ||
        label
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '') ||
        `LEVEL_${index + 1}`

      if (seen.has(key)) return
      seen.add(key)

      deduped.push({
        key,
        label,
        order: deduped.length,
      })
    })

  return deduped.length > 0 ? deduped : DEFAULT_LEVELS
}

const generateLevelKey = (label: string, existingKeys: Set<string>, fallbackIndex: number) => {
  const base =
    label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || `LEVEL_${fallbackIndex + 1}`

  if (!existingKeys.has(base)) {
    return base
  }

  let suffix = 2
  while (suffix < 99) {
    const candidate = `${base}_${suffix}`
    if (!existingKeys.has(candidate)) {
      return candidate
    }
    suffix += 1
  }
  return `${base}_${Date.now()}`
}

interface HierarchySettingsProps {
  church: Church
}

export default function HierarchySettings({ church }: HierarchySettingsProps) {
  const [levels, setLevels] = useState<EditableLevel[]>(() => normalizeLevels(church?.hierarchyLevels))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const canAdd = levels.length < MAX_LEVELS

  const handleLabelChange = (index: number, value: string) => {
    setLevels((prev) =>
      prev.map((level, idx) => (idx === index ? { ...level, label: value } : level))
    )
  }

  const handleAddLevel = () => {
    if (!canAdd) return
    const existingKeys = new Set(levels.map((level) => level.key))
    const defaultLabel = `Level ${levels.length + 1}`
    const newKey = generateLevelKey(defaultLabel, existingKeys, levels.length)

    setLevels((prev) => [
      ...prev,
      {
        key: newKey,
        label: defaultLabel,
        order: prev.length,
      },
    ])
  }

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    setLevels((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((level, idx) => ({ ...level, order: idx }))
    })
  }

  const removeLevel = (index: number) => {
    if (levels.length === 1) return
    setLevels((prev) => prev.filter((_, idx) => idx !== index).map((level, idx) => ({ ...level, order: idx })))
  }

  const payload = useMemo(
    () =>
      levels.map((level, index) => ({
        key: level.key,
        label: normalizeLabel(level.label) || `Level ${index + 1}`,
        order: index,
      })),
    [levels]
  )

  const hierarchyLevelLabels = useMemo(
    () =>
      payload.reduce<Record<string, string>>((acc, level) => {
        acc[level.key] = level.label
        return acc
      }, {}),
    [payload]
  )

  const handleSave = async () => {
    setError('')
    setSuccess(false)
    const invalid = payload.some((level) => level.label.length < 2 || level.label.length > 60)
    if (invalid) {
      setError('Each level label must be between 2 and 60 characters.')
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/churches/${church.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hierarchyLevels: payload,
          hierarchyLevelLabels,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update hierarchy levels.')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-600">
          These labels drive the “Add headquarters/region/state” flows and what members see in the branch
          hierarchy. Reorder the list to change the level order.
        </p>
        <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          Tip: Start with your global HQ at level 1, then add regions, states, zones, campuses, etc. You can add
          up to {MAX_LEVELS} tiers.
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Hierarchy levels saved.
        </div>
      )}

      <div className="space-y-4">
        {levels.map((level, index) => (
          <div key={level.key} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 bg-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Level {index + 1}</p>
                <p className="text-sm text-slate-500">Key: {level.key}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveLevel(index, 'up')}
                  disabled={index === 0}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveLevel(index, 'down')}
                  disabled={index === levels.length - 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeLevel(index)}
                  disabled={levels.length === 1}
                  className="p-2 rounded-lg border border-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display label
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={level.label}
                onChange={(event) => handleLabelChange(index, event.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                placeholder="e.g., Region, Zone, Campus"
                maxLength={60}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddLevel}
          disabled={!canAdd}
          className="px-4 py-2 rounded-xl border border-dashed border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add another level
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save hierarchy'}
        </button>
      </div>
    </div>
  )
}
