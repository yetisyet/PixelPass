export function isBackendConnected() {
  return typeof window.pixelPassBackend?.request === "function"
}

export function toProtocolLine(request) {
  return `${JSON.stringify(request)}\n`
}

export async function sendBackendRequest(request) {
  if (!isBackendConnected()) {
    throw new Error(
      "Python backend bridge is not connected. Expose window.pixelPassBackend.request in preload.js.",
    )
  }

  const rawResponse = await window.pixelPassBackend.request(request)
  const response =
    typeof rawResponse === "string" ? JSON.parse(rawResponse.trim()) : rawResponse

  if (!response || typeof response !== "object") {
    throw new Error("Backend response must be a JSON object.")
  }

  if (response.action !== request.action) {
    throw new Error(
      `Response action must be "${request.action}", received "${response.action ?? "missing"}".`,
    )
  }

  if (typeof response.success !== "boolean") {
    throw new Error('Backend response must include a boolean "success" field.')
  }

  return response
}
