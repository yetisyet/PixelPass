import assert from "node:assert/strict"
import { webcrypto } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto })
}

const source = readFileSync(new URL("../src/lib/totp.js", import.meta.url), "utf8")
const totp = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"

test("TOTP matches the RFC 6238 SHA-1 reference vectors", async () => {
  const vectors = [
    [59, "94287082"],
    [1_111_111_109, "07081804"],
    [1_111_111_111, "14050471"],
    [1_234_567_890, "89005924"],
    [2_000_000_000, "69279037"],
    [20_000_000_000, "65353130"],
  ]

  for (const [seconds, expected] of vectors) {
    const result = await totp.generateTotp(rfcSecret, {
      digits: 8,
      now: seconds * 1000,
    })
    assert.equal(result.code, expected)
  }
})

test("TOTP defaults to a real six-digit 30-second code", async () => {
  const result = await totp.generateTotp(rfcSecret, { now: 59_000 })

  assert.equal(result.code, "287082")
  assert.equal(result.code.length, 6)
  assert.equal(result.periodSeconds, 30)
  assert.equal(result.expiresAt, 60_000)
})

test("Base32 secrets accept authenticator-style spacing and reject invalid characters", () => {
  assert.equal(
    totp.normalizeBase32("gezd gnbv-gy3t qojq"),
    "GEZDGNBVGY3TQOJQ",
  )
  assert.throws(
    () => totp.normalizeBase32("not-a-valid-secret!"),
    /Base32 letters A–Z and numbers 2–7/,
  )
})
