// Lightweight, URL-safe obfuscation for query params — not real cryptographic
// security, just keeps raw IDs (hostId, mobileNo, etc.) out of plain sight in
// shared links. If you need actual security, swap the XOR step for a real
// cipher (e.g. AES via crypto-js) — encryptParams/decryptParams stay as the
// two functions everything else in the app calls, so nothing else changes.

const KEY = 'vms-secret-key'; // TODO: move to environment config, keep the same value on both sides

function xor(input: string, key: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

/** Encrypts a plain object of query params into a single URL-safe token string. */
export function encryptParams(params: Record<string, string>): string {
  const json = JSON.stringify(params);
  const obfuscated = xor(json, KEY);
  // btoa works on binary strings; encodeURIComponent first keeps non-ASCII safe
  const base64 = btoa(encodeURIComponent(obfuscated));
  // Make it URL-safe (no +, /, = which need escaping in query strings)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decrypts a token string back into the original params object. Returns null if invalid. */
export function decryptParams(token: string): Record<string, string> | null {
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const obfuscated = decodeURIComponent(atob(padded));
    const json = xor(obfuscated, KEY);
    return JSON.parse(json);
  } catch {
    return null;
  }
}