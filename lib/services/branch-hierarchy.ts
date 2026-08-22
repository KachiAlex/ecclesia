export type BranchLevel = string

export type HierarchyLevelLabels = Partial<Record<BranchLevel, string>>

export type HierarchyLevelDefinition = {
  key: BranchLevel
  label: string
  order: number
}

export type HierarchyLevelInput = {
  key?: string
  label?: string
  order?: number
}

type HierarchySource =
  | {
      hierarchyLevelLabels?: HierarchyLevelLabels
      hierarchyLevels?: HierarchyLevelInput[]
    }
  | null
  | undefined

const MAX_LEVELS = 8
const LABEL_MIN_LENGTH = 2
const LABEL_MAX_LENGTH = 60

const DEFAULT_LEVEL_DEFINITIONS: HierarchyLevelDefinition[] = [
  { key: 'REGION', label: 'Headquarters', order: 0 },
  { key: 'STATE', label: 'Region', order: 1 },
  { key: 'ZONE', label: 'State', order: 2 },
  { key: 'BRANCH', label: 'Branch', order: 3 },
]

export const DEFAULT_LEVEL_LABELS: Record<BranchLevel, string> =
  DEFAULT_LEVEL_DEFINITIONS.reduce<Record<BranchLevel, string>>((acc, level) => {
    acc[level.key] = level.label
    return acc
  }, {})

const normalizeKey = (value: unknown): BranchLevel | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

const sanitizeLabel = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length < LABEL_MIN_LENGTH || trimmed.length > LABEL_MAX_LENGTH) {
    return null
  }
  return trimmed
}

const sanitizeLevelsArray = (value: unknown): HierarchyLevelDefinition[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const sanitized: HierarchyLevelDefinition[] = []
  const seenKeys = new Set<string>()

  value
    .filter((entry) => entry && typeof entry === 'object')
    .slice(0, MAX_LEVELS)
    .forEach((entry, index) => {
      const record = entry as HierarchyLevelInput
      const label = sanitizeLabel(record.label)
      if (!label) {
        return
      }
      const key = normalizeKey(record.key) ?? normalizeKey(label) ?? `LEVEL_${index + 1}`
      if (seenKeys.has(key)) {
        return
      }
      seenKeys.add(key)
      sanitized.push({
        key,
        label,
        order: typeof record.order === 'number' ? record.order : index,
      })
    })

  return sanitized.sort((a, b) => a.order - b.order).map((level, index) => ({
    ...level,
    order: index,
  }))
}

export const sanitizeHierarchyLevelOverrides = (
  value: unknown
): { value: HierarchyLevelLabels } | { error: string } => {
  if (value === null || typeof value !== 'object') {
    return { error: 'hierarchyLevelLabels must be an object' }
  }

  const record: HierarchyLevelLabels = {}
  for (const [rawKey, rawLabel] of Object.entries(value as Record<string, unknown>)) {
    const key = normalizeKey(rawKey)
    if (!key) continue
    const label = sanitizeLabel(rawLabel)
    if (!label) {
      return { error: `Label for ${rawKey} must be a non-empty string up to ${LABEL_MAX_LENGTH} characters` }
    }
    record[key] = label
  }

  return { value: record }
}

export const sanitizeHierarchyLevelInputs = (
  value: unknown
): { value: HierarchyLevelDefinition[] } | { error: string } => {
  if (!Array.isArray(value)) {
    return { error: 'hierarchyLevels must be an array' }
  }
  if (value.length === 0) {
    return { error: 'At least one hierarchy level is required' }
  }
  if (value.length > MAX_LEVELS) {
    return { error: `A maximum of ${MAX_LEVELS} levels is supported` }
  }

  const sanitized = sanitizeLevelsArray(value)
  if (sanitized.length === 0) {
    return { error: 'Each hierarchy level must include a unique key and a label' }
  }

  if (sanitized.length !== value.length) {
    return { error: 'Hierarchy levels must have unique keys and valid labels' }
  }

  return { value: sanitized }
}

const mergeLabelOverrides = (
  levels: HierarchyLevelDefinition[],
  overrides?: HierarchyLevelLabels | null
): HierarchyLevelDefinition[] => {
  if (!overrides) {
    return levels
  }

  return levels.map((level) => ({
    ...level,
    label: overrides[level.key] ?? level.label,
  }))
}

export const getHierarchyLevels = (source: HierarchySource): HierarchyLevelDefinition[] => {
  const overrides = source?.hierarchyLevelLabels ?? null
  const provided = sanitizeLevelsArray(source?.hierarchyLevels)
  if (provided.length > 0) {
    return mergeLabelOverrides(provided, overrides)
  }
  return mergeLabelOverrides(DEFAULT_LEVEL_DEFINITIONS, overrides)
}

export const getHierarchyLevelLabels = (
  source: HierarchySource
): Record<BranchLevel, string> => {
  const levels = getHierarchyLevels(source)
  return levels.reduce<Record<string, string>>((acc, level) => {
    acc[level.key] = level.label
    return acc
  }, {})
}

export const getLevelLabel = (source: HierarchySource, level: BranchLevel): string => {
  const labels = getHierarchyLevelLabels(source)
  return labels[level] ?? level
}

export const findRootLevel = (
  source: HierarchySource
): HierarchyLevelDefinition => getHierarchyLevels(source)[0]

export const findChildLevelKey = (
  source: HierarchySource,
  parentKey: BranchLevel
): BranchLevel | null => {
  const levels = getHierarchyLevels(source)
  const index = levels.findIndex((level) => level.key === parentKey)
  if (index === -1) return null
  return levels[index + 1]?.key ?? null
}

export const normalizeLevelValue = (value: unknown): BranchLevel | null => normalizeKey(value)
