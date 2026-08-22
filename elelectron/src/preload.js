import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("pixelPassBackend", {
  copyText: (text) => ipcRenderer.invoke("clipboard:write", String(text)),
  request: (request) => ipcRenderer.invoke("python:request", request),
})
