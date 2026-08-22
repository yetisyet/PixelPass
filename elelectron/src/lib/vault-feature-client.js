import { sendBackendRequest } from "@/lib/backend-client"

// Recovery and TOTP are frontend-first prototypes until their backend actions
// land. Keeping this switch here prevents fixture logic leaking into screens.
export const USE_FEATURE_STUBS = true

const PASSCODE_PERIOD_SECONDS = 30

const seededPasscodes = [
  {
    id: "totp-github",
    issuer: "GitHub",
    accountName: "demo@pixelpass.app",
    tone: "violet",
  },
  {
    id: "totp-discord",
    issuer: "Discord",
    accountName: "pixel-paws",
    tone: "blue",
  },
]
const sessionPasscodes = new Map(
  seededPasscodes.map((passcode) => [passcode.id, passcode]),
)

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function imageUrlToPngPayload(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext("2d")
      if (!context) {
        reject(new Error("The sample image could not be prepared."))
        return
      }
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL("image/png").split(",", 2)[1])
    }
    image.onerror = () => reject(new Error("The sample image could not be loaded."))
    image.src = imageUrl
  })
}

function displayName(file, index) {
  return file?.name || file?.path?.split(/[\\/]/).pop() || `vault-image-${index + 1}.png`
}

function currentPasscode(record, now = Date.now()) {
  const periodMilliseconds = PASSCODE_PERIOD_SECONDS * 1000
  const period = Math.floor(now / periodMilliseconds)
  let hash = 2166136261

  for (const character of `${record.id}:${period}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return {
    ...record,
    code: String(Math.abs(hash) % 1_000_000).padStart(6, "0"),
    expiresAt: (period + 1) * periodMilliseconds,
    isStub: true,
    periodSeconds: PASSCODE_PERIOD_SECONDS,
  }
}

export function createDemoRecoveryFiles() {
  return [
    { id: "demo-cat-window", name: "cat-at-the-window.png", isDemo: true },
    { id: "demo-cat-garden", name: "garden-cat.png", isDemo: true },
    { id: "demo-cat-sunbeam", name: "sunbeam-nap.png", isDemo: true },
    { id: "demo-cat-socks", name: "socks-the-cat.png", isDemo: true },
    { id: "demo-cat-camera", name: "camera-roll-cat.png", isDemo: true },
  ]
}

export async function inspectRecoveryImages(files) {
  /**
   * BACKEND_HANDOFF(recovery.inspect)
   * Send the selected image payloads or paths. Return share validity,
   * threshold, total share count, and a vault fingerprint. Do not decrypt or
   * expose vault contents during inspection.
   */
  await wait(720)

  const normalizedFiles = Array.from(files ?? []).map((file, index) => ({
    id: file.id || `${displayName(file, index)}-${index}`,
    name: displayName(file, index),
    source: file,
  }))

  if (normalizedFiles.length === 0) {
    throw new Error("Choose at least one image to inspect.")
  }

  const hasMixedVaults = normalizedFiles.some(({ name }) =>
    name.toLowerCase().includes("mixed"),
  )
  const invalidCount = normalizedFiles.filter(({ name }) =>
    /ordinary|invalid|empty/i.test(name),
  ).length
  const validShares = Math.max(0, normalizedFiles.length - invalidCount)
  const requiredShares = 3

  return {
    files: normalizedFiles,
    hasMixedVaults,
    invalidCount,
    isStub: true,
    requiredShares,
    totalShares: Math.max(5, normalizedFiles.length),
    validShares,
    vaultFingerprint: hasMixedVaults ? null : "PP-7A2C",
  }
}

export async function recoverVault({ inspection, masterKey }) {
  /**
   * BACKEND_HANDOFF(recovery.unlock)
   * Send the selected image payloads plus the master key. The backend should
   * combine a threshold of Shamir shares, decrypt the vault, and return only
   * success metadata or a typed recovery error.
   */
  await wait(1650)

  if (!inspection) throw new Error("Inspect recovery images first.")
  if (inspection.hasMixedVaults) {
    throw new Error("These images appear to belong to different PixelPass vaults.")
  }
  if (inspection.validShares < inspection.requiredShares) {
    throw new Error(
      `Only ${inspection.validShares} valid shares were found. This vault needs ${inspection.requiredShares}.`,
    )
  }
  if (!masterKey || masterKey.length < 8 || /wrong/i.test(masterKey)) {
    throw new Error("That master key could not decrypt the recovered vault.")
  }

  return {
    entryCount: 4,
    isStub: true,
    sharesUsed: inspection.requiredShares,
    vaultFingerprint: inspection.vaultFingerprint,
  }
}

export async function initializeGuidedVault({ backendRequest }) {
  /**
   * EXISTING_BACKEND_HANDOFF(vault.initialize)
   * This deliberately uses PixelPass's current initialization protocol. The
   * guided UI is new, but no new Python action is required for modes 1–4.
   */
  let resolvedRequest = backendRequest

  if (backendRequest.mode === "frontend-sample") {
    /**
     * FRONTEND_ADAPTER(sample-five)
     * The existing mode-4 sample pack expands to every bundled image. Send one
     * bundled PNG through mode 1 instead, where the existing backend repeats it
     * to the requested total. This keeps the visible 3-of-5 contract truthful
     * without changing Python.
     */
    const { sampleImageUrl, ...request } = backendRequest
    const samplePayload = await imageUrlToPngPayload(sampleImageUrl)
    if (!samplePayload) throw new Error("The five-image sample pack could not be prepared.")
    resolvedRequest = { ...request, data: [samplePayload], mode: 1 }
  }

  return sendBackendRequest(resolvedRequest)
}

export async function listPasscodes() {
  /**
   * BACKEND_HANDOFF(passcodes.list)
   * Return passcode metadata and the current code window. The future vault
   * stores the TOTP secret; it must never persist the rolling six-digit code.
  */
  await wait(360)
  return Array.from(sessionPasscodes.values())
    .map((record) => currentPasscode(record))
}

export async function requestCurrentPasscode(record) {
  /**
   * BACKEND_HANDOFF(passcodes.current)
   * Request a single code by entry ID. Expected fields: code, expiresAt, and
   * periodSeconds. The secret remains inside the encrypted vault.
   */
  await wait(90)
  return currentPasscode(record)
}

export async function createPasscode({ accountName, issuer, secret }) {
  /**
   * BACKEND_HANDOFF(passcodes.create)
   * Send issuer, accountName, and the authenticator secret over the existing
   * IPC boundary. The backend validates and encrypts the secret in the vault.
   */
  await wait(520)

  if (!issuer.trim() || !accountName.trim() || secret.trim().length < 8) {
    throw new Error("Enter an issuer, account, and a valid authenticator secret.")
  }

  const record = {
    accountName: accountName.trim(),
    id: `totp-${Date.now()}`,
    issuer: issuer.trim(),
    tone: "green",
  }
  sessionPasscodes.set(record.id, record)
  return currentPasscode(record)
}

export async function removePasscode(id) {
  /**
   * BACKEND_HANDOFF(passcodes.remove)
   * Remove the passcode entry by ID and persist the updated encrypted vault.
  */
  await wait(240)
  sessionPasscodes.delete(id)
  return { id, isStub: true, success: true }
}
