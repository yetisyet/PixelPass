export function isBackendConnected() {
  return typeof window.pixelPassBackend?.request === "function"
}

export function toProtocolLine(request) {
  return `${JSON.stringify(request)}\n`
}

export async function sendBackendRequest(request) {
  if (!isBackendConnected()) {
    throw new Error(
      "Python backend is not connected yet. Use Load demo to test the vault for now.",
    )
  }

  let rawResponse
  try {
    rawResponse = await window.pixelPassBackend.request(request)
  } catch {
    throw new Error(
      "Python backend could not answer yet. Use Load demo while the transport is being connected.",
    )
  }
  const response =
    typeof rawResponse === "string" ? JSON.parse(rawResponse.trim()) : rawResponse

  if (!response || typeof response !== "object") {
    throw new Error("Backend response must be a JSON object.")
  }

  if ("action" in request && response.action !== request.action) {
    throw new Error(
      `Response action must be "${request.action}", received "${response.action ?? "missing"}".`,
    )
  }

  if (typeof response.success !== "boolean") {
    throw new Error('Backend response must include a boolean "success" field.')
  }

  return response
}
