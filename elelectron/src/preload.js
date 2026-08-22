import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("pixelPassBackend", {
  copyText: (text) => ipcRenderer.invoke("clipboard:write", String(text)),
  request: async (request) => {
    try {
      return await ipcRenderer.invoke("python:request", request)
    } catch (error) {
      return {
        action: request?.action ?? "unknown",
        error: error instanceof Error
          ? error.message
          : "Python backend transport is not connected yet.",
        success: false,
      }
    }
  },
})
