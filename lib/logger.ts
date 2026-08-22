export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogFields = Record<string, any>

export function generateCorrelationId(): string {
  const g: any = globalThis as any
  const uuid = g?.crypto?.randomUUID?.bind(g.crypto)
  if (uuid) return uuid()
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getCorrelationIdFromRequest(request: Request): string {
  const headerId = request.headers.get('x-correlation-id') || request.headers.get('x-request-id')
  return headerId || generateCorrelationId()
}

export function log(level: LogLevel, event: string, fields: LogFields = {}) {
  const env = (globalThis as any)?.process?.env
  if (env?.NODE_ENV === 'test' || env?.VITEST) {
    return
  }

  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  }

  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  debug: (event: string, fields?: LogFields) => log('debug', event, fields),
  info: (event: string, fields?: LogFields) => log('info', event, fields),
  warn: (event: string, fields?: LogFields) => log('warn', event, fields),
  error: (event: string, fields?: LogFields) => log('error', event, fields),
}
