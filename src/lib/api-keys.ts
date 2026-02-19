import bcrypt from 'bcryptjs';

/**
 * Generate a secure API key
 * Format: nf_prod_[32 random alphanumeric chars]
 */
export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 32; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `nf_prod_${random}`;
}

/**
 * Get the prefix of an API key for display (first 12 chars)
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + '...';
}

/**
 * Hash an API key for storage
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

/**
 * Verify an API key against its hash
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

/**
 * Generate a cryptographic key pair for agent verification
 * Returns base64-encoded public key (private key stays with the agent)
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  // For MVP, we'll use a simple random string as the "public key"
  // In production, use proper Ed25519 key generation
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 64; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return {
    publicKey: `pk_${key}`,
    privateKey: `sk_${key}`, // In reality, these would be cryptographically linked
  };
}
