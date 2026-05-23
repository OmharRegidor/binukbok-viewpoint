import { randomBytes } from "node:crypto";

// High-entropy token used ONLY in the public booking-view URL (/b/[token]).
// 32 bytes -> 64 hex chars. Unguessable, so the PII page can't be enumerated.
// Never derive this from a booking id, email, or timestamp.
export function generateViewToken(): string {
  return randomBytes(32).toString("hex");
}

// Short, human-readable code shown to staff and encoded in the QR.
// Check-in is admin-gated and the guest is physically present, so a short code
// is acceptable here. Excludes look-alike characters (0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateConfirmationCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < bytes.length; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return `BVP-${code}`;
}
