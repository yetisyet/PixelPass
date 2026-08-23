const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export const DEFAULT_TOTP_DIGITS = 6
export const DEFAULT_TOTP_PERIOD_SECONDS = 30

export function normalizeBase32(secret) {
  const normalized = String(secret ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/=+$/, "")

  if (normalized.length < 16) {
    throw new Error("Enter a Base32 authenticator secret with at least 16 characters.")
  }
  if (/[^A-Z2-7]/.test(normalized)) {
    throw new Error("The authenticator secret must use Base32 letters A–Z and numbers 2–7.")
  }

  return normalized
}

export function decodeBase32(secret) {
  const normalized = normalizeBase32(secret)
  const bytes = []
  let bitBuffer = 0
  let bitCount = 0

  for (const character of normalized) {
    bitBuffer = (bitBuffer * 32) + BASE32_ALPHABET.indexOf(character)
    bitCount += 5

    while (bitCount >= 8) {
      bitCount -= 8
      bytes.push(Math.floor(bitBuffer / (2 ** bitCount)) & 0xff)
      bitBuffer %= 2 ** bitCount
    }
  }

  return new Uint8Array(bytes)
}

function encodeCounter(counter) {
  const bytes = new Uint8Array(8)
  let remaining = BigInt(counter)

  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 0xffn)
    remaining >>= 8n
  }

  return bytes
}

export async function generateTotp(
  secret,
  {
    digits = DEFAULT_TOTP_DIGITS,
    now = Date.now(),
    periodSeconds = DEFAULT_TOTP_PERIOD_SECONDS,
  } = {},
) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure authenticator code generation is unavailable in this browser.")
  }
  if (!Number.isFinite(now) || now < 0) {
    throw new Error("The current time is invalid.")
  }
  if (!Number.isInteger(periodSeconds) || periodSeconds <= 0) {
    throw new Error("The authenticator period must be a positive number of seconds.")
  }
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) {
    throw new Error("Authenticator codes must contain between 6 and 8 digits.")
  }

  const normalizedSecret = normalizeBase32(secret)
  const counter = Math.floor(now / 1000 / periodSeconds)
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    decodeBase32(normalizedSecret),
    { hash: "SHA-1", name: "HMAC" },
    false,
    ["sign"],
  )
  const digest = new Uint8Array(
    await globalThis.crypto.subtle.sign("HMAC", key, encodeCounter(counter)),
  )
  const offset = digest[digest.length - 1] & 0x0f
  const binaryCode =
    ((digest[offset] & 0x7f) * 0x1000000) +
    (digest[offset + 1] * 0x10000) +
    (digest[offset + 2] * 0x100) +
    digest[offset + 3]

  return {
    code: String(binaryCode % (10 ** digits)).padStart(digits, "0"),
    expiresAt: (counter + 1) * periodSeconds * 1000,
    periodSeconds,
  }
}
