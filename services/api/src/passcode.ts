// Passcode hashing for the accounts table. scrypt, so a copy of school.db does not reveal passcodes.
// Format: scrypt$N$r$p$saltHex$hashHex

import { scrypt, scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

const N = 16384;
const R = 8;
const P = 1;
const LEN = 32;

export function hashPasscode(passcode: string, saltHex: string): string {
  const h = scrypt(utf8ToBytes(passcode.normalize('NFKC')), hexToBytes(saltHex), { N, r: R, p: P, dkLen: LEN });
  return `scrypt$${N}$${R}$${P}$${saltHex}$${bytesToHex(h)}`;
}

/** Constant-time check of a passcode against a stored hash. */
export async function verifyPasscode(passcode: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const h = await scryptAsync(utf8ToBytes(passcode.normalize('NFKC')), hexToBytes(salt), { N: Number(n), r: Number(r), p: Number(p), dkLen: hash.length / 2 });
  const want = hexToBytes(hash);
  let diff = h.length ^ want.length;
  for (let i = 0; i < h.length; i++) diff |= h[i] ^ (want[i] ?? 0);
  return diff === 0;
}
