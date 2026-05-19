// Encryption utility for storing sensitive data securely in database
// Uses AES-256-GCM encryption

import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set')
}

// Ensure key is 32 bytes for AES-256
const key = crypto
  .createHash('sha256')
  .update(String(ENCRYPTION_KEY))
  .digest()

/**
 * Encrypts sensitive data using AES-256-GCM
 * Returns encrypted data and IV as a combined string
 */
export function encrypt(text) {
  if (!text) return null

  const iv = crypto.randomBytes(12) // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(String(text), 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return IV + authTag + encrypted data (separated by colons)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts data encrypted with the encrypt function
 * Throws error if decryption fails or data is tampered
 */
export function decrypt(encryptedData) {
  if (!encryptedData) return null

  try {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error('Decryption failed: Data may be corrupted or tampered')
  }
}
