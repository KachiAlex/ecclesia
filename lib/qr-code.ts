import { randomBytes } from 'crypto'

/**
 * Generate a unique QR code string
 */
export function generateQRCode(prefix: string = 'ECCLESIA'): string {
  const timestamp = Date.now()
  const random = randomBytes(8).toString('hex').toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Validate QR code format
 */
export function validateQRCode(qrCode: string, prefix?: string): boolean {
  if (!qrCode) return false
  
  if (prefix) {
    return qrCode.startsWith(prefix)
  }
  
  // Basic validation - contains timestamp and random parts
  const parts = qrCode.split('-')
  return parts.length >= 3 && !isNaN(parseInt(parts[1]))
}

/**
 * Parse QR code to extract information
 */
export function parseQRCode(qrCode: string): {
  prefix: string
  timestamp: number
  random: string
} | null {
  const parts = qrCode.split('-')
  if (parts.length < 3) return null

  const timestamp = parseInt(parts[1])
  if (isNaN(timestamp)) return null

  return {
    prefix: parts[0],
    timestamp,
    random: parts.slice(2).join('-'),
  }
}

