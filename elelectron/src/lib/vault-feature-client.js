import { sendBackendRequest } from "@/lib/backend-client"
import { generateTotp, normalizeBase32 } from "@/lib/totp"

const sessionPasscodes = new Map()
const passcodeTones = ["gold", "blue", "green"]

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

async function currentPasscode(record, now = Date.now()) {
  const { secret, ...metadata } = record
  if (!secret) throw new Error("This authenticator entry is missing its secret.")

  return {
    ...metadata,
    ...(await generateTotp(secret, { now })),
  }
}

export async function recoverVault({ paths, masterKey }) {
  const normalizedPaths = Array.from(new Set(paths ?? [])).filter(
    (path) => typeof path === "string" && path.length > 0,
  )

  if (normalizedPaths.length < 2) {
    throw new Error("Choose at least two PixelPass recovery images.")
  }
  if (normalizedPaths.some((path) => !path.toLowerCase().endsWith(".png"))) {
    throw new Error("PixelPass recovery images must be PNG files.")
  }
  if (!masterKey) {
    throw new Error("Enter the master key used when this vault was created.")
  }

  const response = await sendBackendRequest({
    mode: 5,
    password: masterKey,
    paths: normalizedPaths,
  })

  if (!response.success) {
    throw new Error(
      response.error ||
        "PixelPass could not recover this vault. Check the master key and make sure the selected images are matching recovery shares.",
    )
  }
  if (typeof response.read_only !== "boolean") {
    throw new Error('Backend recovery response must include a boolean "read_only" field.')
  }

  return {
    readOnly: response.read_only,
    sharesProvided: normalizedPaths.length,
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
     * Convert each bundled sample PNG into the existing mode-1 base64 payload
     * so the five images shown in the UI are the five images actually mutated.
     */
    const { sampleImageUrls, ...request } = backendRequest
    const samplePayloads = await Promise.all(
      sampleImageUrls.map((imageUrl) => imageUrlToPngPayload(imageUrl)),
    )
    if (samplePayloads.length === 0 || samplePayloads.some((payload) => !payload)) {
      throw new Error("The five-image sample pack could not be prepared.")
    }
    resolvedRequest = { ...request, data: samplePayloads, mode: 1 }
  }

  return sendBackendRequest(resolvedRequest)
}

export async function listPasscodes() {
  return Promise.all(
    Array.from(sessionPasscodes.values()).map((record) => currentPasscode(record)),
  )
}

export async function requestCurrentPasscode(record) {
  const storedRecord = sessionPasscodes.get(record.id)
  if (!storedRecord) throw new Error("This authenticator entry is no longer available.")
  return currentPasscode(storedRecord)
}

export async function createPasscode({ accountName, issuer, secret }) {
  const normalizedIssuer = issuer.trim()
  const normalizedAccountName = accountName.trim()
  if (!normalizedIssuer || !normalizedAccountName) {
    throw new Error("Enter both the issuer and account name.")
  }
  const normalizedSecret = normalizeBase32(secret)

  const record = {
    accountName: normalizedAccountName,
    id: globalThis.crypto?.randomUUID?.() ?? `totp-${Date.now()}`,
    issuer: normalizedIssuer,
    secret: normalizedSecret,
    tone: passcodeTones[sessionPasscodes.size % passcodeTones.length],
  }
  const generatedRecord = await currentPasscode(record)
  sessionPasscodes.set(record.id, record)
  return generatedRecord
}

export async function removePasscode(id) {
  return { id, success: sessionPasscodes.delete(id) }
}
