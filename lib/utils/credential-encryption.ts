import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-key-change-in-production'
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts sensitive credentials for storage
 * Property 7: Credential Encryption - For any stored platform credential, the credential must be encrypted at rest
 */
export function encryptCredentials(credentials: Record<string, any>): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Combine IV, auth tag, and encrypted data
    const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
    return combined
  } catch (error) {
    console.error('Error encrypting credentials:', error)
    throw new Error('Failed to encrypt credentials')
  }
}

/**
 * Decrypts stored credentials
 * Property 7: Credential Encryption - decrypted only when needed for API calls
 */
export function decryptCredentials(encrypted: string): Record<string, any> {
  try {
    const parts = encrypted.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedData = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Error decrypting credentials:', error)
    throw new Error('Failed to decrypt credentials')
  }
}

/**
 * Validates that credentials are not empty
 * Property 1: Platform Connection Consistency - if status is "connected", credentials must be valid and non-empty
 */
export function validateCredentials(credentials: Record<string, any>): boolean {
  if (!credentials || typeof credentials !== 'object') {
    return false
  }
  
  const hasAtLeastOneCredential = Object.values(credentials).some(
    (value) => value !== null && value !== undefined && value !== ''
  )
  
  return hasAtLeastOneCredential
}
