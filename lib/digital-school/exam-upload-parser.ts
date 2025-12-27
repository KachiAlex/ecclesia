import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export type ParsedExamQuestion = {
  question: string
  options: string[]
  correctOption: number
  explanation?: string
  weight?: number
  durationSeconds?: number
}

export type ExamParseSummary = {
  parsed: ParsedExamQuestion[]
  totalRows: number
  skipped: { rowNumber: number; reason: string }[]
  warnings: string[]
}

const DEFAULT_HEADER = [
  'question',
  'optionA',
  'optionB',
  'optionC',
  'optionD',
  'correctOption',
  'durationSeconds',
  'explanation',
  'weight',
]

const OPTION_PREFIXES = ['option', 'choice', 'answerchoice', 'opt']

const COMMENT_PREFIX = '#'

type RawRow = Record<string, any>

type ParseFormat = 'csv' | 'xlsx' | 'json' | 'unknown'

export function parseExamUpload(buffer: Buffer, options: { fileName?: string } = {}): ExamParseSummary {
  const format = detectFormat(options.fileName)
  let rawRows: RawRow[] = []

  if (format === 'xlsx') {
    rawRows = parseFromWorkbook(buffer)
  } else if (format === 'json') {
    rawRows = parseFromJson(buffer)
  } else {
    rawRows = parseFromCsv(buffer)
  }

  const summary = buildQuestions(rawRows)
  return summary
}

function detectFormat(fileName?: string): ParseFormat {
  if (!fileName) return 'unknown'
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return 'xlsx'
    case 'json':
      return 'json'
    case 'csv':
      return 'csv'
    default:
      return 'unknown'
  }
}

function parseFromWorkbook(buffer: Buffer): RawRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const primarySheet = workbook.SheetNames[0]
  if (!primarySheet) {
    return []
  }
  const sheet = workbook.Sheets[primarySheet]
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false })
  return normalizeTabularRows(rows)
}

function parseFromJson(buffer: Buffer): RawRow[] {
  const text = buffer.toString('utf8').trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      if (parsed.length && Array.isArray(parsed[0])) {
        return normalizeTabularRows(parsed as any[][])
      }
      return (parsed as RawRow[]).map((row) => ({ ...row }))
    }
    if (Array.isArray(parsed?.questions)) {
      return (parsed.questions as RawRow[]).map((row) => ({ ...row }))
    }
    return []
  } catch {
    return []
  }
}

function parseFromCsv(buffer: Buffer): RawRow[] {
  const text = buffer.toString('utf8')
  const rows = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: 'greedy',
  })
  const data = rows.data as string[][]
  return normalizeTabularRows(data)
}

function normalizeTabularRows(rows: any[][]): RawRow[] {
  if (!Array.isArray(rows)) return []

  const sanitizedRows = rows
    .map((row) => row.map((value) => (typeof value === 'string' ? value.replace(/\r/g, '').trim() : value)))
    .filter((row) => row.some((cell) => (typeof cell === 'string' ? cell.trim().length > 0 : cell != null)))

  while (sanitizedRows.length && isInstructionRow(sanitizedRows[0])) {
    sanitizedRows.shift()
  }

  if (!sanitizedRows.length) return []

  const firstRowNormalized = sanitizedRows[0].map((cell) => normalizeKey(String(cell ?? '')))
  const hasHeaderRow = firstRowNormalized.includes('question')

  let header: string[]
  let dataRows: any[][]
  if (hasHeaderRow) {
    const headerRow = sanitizedRows.shift()!
    header = headerRow.map((cell, index) => {
      const label = String(cell ?? '').trim()
      return label || DEFAULT_HEADER[index] || `column_${index + 1}`
    })
    dataRows = sanitizedRows
  } else {
    const maxLength = Math.max(DEFAULT_HEADER.length, ...sanitizedRows.map((row) => row.length))
    header = Array.from({ length: maxLength }, (_, index) => DEFAULT_HEADER[index] || `column_${index + 1}`)
    dataRows = sanitizedRows
  }

  return dataRows.map((row) => mapRowValues(row, header))
}

function isInstructionRow(row: any[]): boolean {
  const firstValue = row.find((cell) => {
    if (cell == null) return false
    const value = String(cell).trim()
    return value.length > 0
  })
  if (!firstValue) return false
  return String(firstValue).trim().startsWith(COMMENT_PREFIX)
}

function mapRowValues(row: any[], header: string[]): RawRow {
  const mapped: RawRow = {}
  for (let index = 0; index < header.length; index += 1) {
    const key = header[index] ?? `column_${index + 1}`
    mapped[key] = row[index]
  }
  return mapped
}

function buildQuestions(rows: RawRow[]): ExamParseSummary {
  const parsed: ParsedExamQuestion[] = []
  const skipped: { rowNumber: number; reason: string }[] = []
  const warnings: string[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    const question = extractQuestion(row)
    if (!question) {
      skipped.push({ rowNumber, reason: 'Missing question text' })
      return
    }
    if (question.trim().startsWith(COMMENT_PREFIX)) {
      skipped.push({ rowNumber, reason: 'Comment row ignored' })
      return
    }

    const { options, optionIndexMap } = extractOptions(row)
    const filledOptions = options.filter((option) => option.trim().length > 0)
    if (filledOptions.length < 2) {
      skipped.push({ rowNumber, reason: 'At least two answer options are required' })
      return
    }

    const { index: correctOption, warning } = resolveCorrectOption(row, filledOptions, optionIndexMap)
    if (warning) {
      warnings.push(`Row ${rowNumber}: ${warning}`)
    }

    const explanation = extractFirstValue(row, ['explanation', 'rationale', 'note', 'why'])
    const weight = extractNumber(row, ['weight', 'points', 'scoreweight'])
    const durationSeconds = parseDurationSeconds(row) ?? 60

    const { options: dedupedOptions, correctOption: dedupedCorrectOption } = dedupeFinalOptions(
      filledOptions,
      correctOption,
    )

    parsed.push({
      question: question.trim(),
      options: dedupedOptions,
      correctOption: dedupedCorrectOption,
      explanation: explanation || undefined,
      weight: typeof weight === 'number' ? weight : undefined,
      durationSeconds,
    })
  })

  return {
    parsed,
    totalRows: rows.length,
    skipped,
    warnings,
  }
}

function extractQuestion(row: RawRow): string {
  return (
    extractFirstValue(row, ['question', 'prompt', 'text', 'title']) ||
    ''
  )
}

function extractOptions(row: RawRow): { options: string[]; optionIndexMap: Map<number, number> } {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeKey(key), value] as const)
  const tempOptions = new Map<number, string>()

  normalizedEntries.forEach(([key, value]) => {
    OPTION_PREFIXES.forEach((prefix) => {
      if (key.startsWith(prefix) && key.length > prefix.length) {
        const suffix = key.slice(prefix.length)
        const optionIndex = parseOptionIndex(suffix)
        if (optionIndex != null) {
          tempOptions.set(optionIndex, sanitizeOptionValue(value))
        }
      }
    })
  })

  if (tempOptions.size === 0) {
    const combined = extractFirstValue(row, ['options', 'choices', 'answers'])
    if (combined) {
      combined
        .split(/[|;]/)
        .map((part) => sanitizeOptionValue(part))
        .forEach((value, idx) => {
          tempOptions.set(idx, value)
        })
    }
  }

  const orderedIndexes = Array.from(tempOptions.keys()).sort((a, b) => a - b)
  const optionIndexMap = new Map<number, number>()
  const options: string[] = []

  orderedIndexes.forEach((originalIndex) => {
    const value = tempOptions.get(originalIndex) ?? ''
    if (!value) {
      return
    }
    optionIndexMap.set(originalIndex, options.length)
    options.push(value)
  })

  return dedupeOptions(options, optionIndexMap)
}

function parseOptionIndex(input: string): number | null {
  if (!input) return null
  const letterMatch = input.match(/^[a-z]/)
  if (letterMatch) {
    return letterMatch[0].charCodeAt(0) - 97
  }
  const numberMatch = input.match(/^\d+/)
  if (numberMatch) {
    return Number(numberMatch[0]) - 1
  }
  return null
}

function sanitizeOptionValue(value: any): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return value.toString()
  return String(value).trim()
}

function dedupeOptions(
  options: string[],
  optionIndexMap: Map<number, number>,
): { options: string[]; optionIndexMap: Map<number, number> } {
  if (options.length <= 1) {
    return { options, optionIndexMap }
  }

  const normalizedMap = new Map<string, number>()
  const remappedIndexes = new Map<number, number>()
  const deduped: string[] = []

  options.forEach((option, index) => {
    const normalized = option.trim().toLowerCase()
    const existing = normalizedMap.get(normalized)
    if (normalized && existing != null) {
      remappedIndexes.set(index, existing)
      return
    }
    const nextIndex = deduped.length
    deduped.push(option)
    normalizedMap.set(normalized, nextIndex)
    remappedIndexes.set(index, nextIndex)
  })

  const dedupedMap = new Map<number, number>()
  optionIndexMap.forEach((mappedIndex, originalIndex) => {
    const dedupedIndex = remappedIndexes.get(mappedIndex)
    if (dedupedIndex != null) {
      dedupedMap.set(originalIndex, dedupedIndex)
    }
  })

  return { options: deduped, optionIndexMap: dedupedMap }
}

function resolveCorrectOption(
  row: RawRow,
  options: string[],
  optionIndexMap: Map<number, number>,
): { index: number; warning?: string } {
  const rawValue =
    extractFirstValue(row, ['correctoption', 'answer', 'correctanswer', 'key', 'correct']) || ''
  const normalizedValue = rawValue.trim()

  if (normalizedValue) {
    const letter = normalizedValue.match(/^[A-Za-z]/)?.[0]
    if (letter) {
      const originalIndex = letter.toUpperCase().charCodeAt(0) - 65
      const remapped = optionIndexMap.get(originalIndex)
      if (remapped != null) {
        return { index: remapped }
      }
    }

    if (/^\d+$/.test(normalizedValue)) {
      const numericIndex = Number(normalizedValue)
      const zeroBased = numericIndex > 0 ? numericIndex - 1 : numericIndex
      if (zeroBased >= 0 && zeroBased < options.length) {
        return { index: zeroBased }
      }
    }

    const matchingIndex = options.findIndex(
      (option) => option.localeCompare(normalizedValue, undefined, { sensitivity: 'accent' }) === 0,
    )
    if (matchingIndex !== -1) {
      return { index: matchingIndex }
    }
  }

  return {
    index: 0,
    warning: 'Correct option missing or invalid – defaulted to the first option.',
  }
}

function extractFirstValue(row: RawRow, keys: string[]): string {
  for (const key of Object.keys(row)) {
    const normalizedKey = normalizeKey(key)
    if (keys.includes(normalizedKey)) {
      const value = row[key]
      if (value == null) continue
      const stringValue = typeof value === 'string' ? value.trim() : String(value)
      if (stringValue.length > 0) return stringValue
    }
  }
  return ''
}

function extractNumber(row: RawRow, keys: string[]): number | null {
  const rawText = extractFirstValue(row, keys)
  if (!rawText) return null
  const numeric = Number(rawText.replace(/[^\d.-]/g, ''))
  if (Number.isFinite(numeric)) return numeric
  return null
}

function parseDurationSeconds(row: RawRow): number | null {
  const value = extractFirstValue(row, [
    'durationseconds',
    'duration',
    'seconds',
    'timer',
    'timelimit',
    'timeperquestion',
  ])
  if (!value) return null
  if (value.includes(':')) {
    const [minutes, seconds] = value.split(':').map((segment) => Number(segment))
    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes * 60 + seconds
    }
  }
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.round(numeric)
  }
  return null
}

function normalizeKey(input: string): string {
  return input.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function dedupeFinalOptions(options: string[], correctIndex: number): { options: string[]; correctOption: number } {
  if (options.length <= 1) {
    return { options, correctOption: 0 }
  }

  const normalizedMap = new Map<string, number>()
  const deduped: string[] = []
  let resolvedCorrectIndex = correctIndex

  options.forEach((option, index) => {
    const normalized = option.trim().toLowerCase()
    if (normalizedMap.has(normalized)) {
      const existingIndex = normalizedMap.get(normalized)!
      if (index === correctIndex) {
        resolvedCorrectIndex = existingIndex
      }
      return
    }
    const dedupedIndex = deduped.length
    normalizedMap.set(normalized, dedupedIndex)
    deduped.push(option)
    if (index === correctIndex) {
      resolvedCorrectIndex = dedupedIndex
    }
  })

  if (resolvedCorrectIndex >= deduped.length) {
    resolvedCorrectIndex = 0
  }

  return { options: deduped, correctOption: resolvedCorrectIndex }
}
