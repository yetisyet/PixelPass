import { useEffect, useState } from "react"
import { PawPrint } from "lucide-react"

import Win7Dialog from "@/components/win7_dialog"

export default function PasswordRevealDialog({
  entry,
  error,
  isLoading,
  onOpenChange,
  open,
  password,
}) {
  const [copyStatus, setCopyStatus] = useState("idle")

  useEffect(() => {
    setCopyStatus("idle")
  }, [open, password])

  async function handleCopy() {
    let copied = false

    try {
      if (typeof window.pixelPassBackend?.copyText === "function") {
        await window.pixelPassBackend.copyText(password)
        copied = true
      }
    } catch {}

    try {
      if (!copied && typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(password)
        copied = true
      }
    } catch {}

    if (!copied) {
      const passwordField = document.querySelector("#revealed-password")
      passwordField?.focus()
      passwordField?.select()
      copied = document.execCommand("copy")
    }

    if (copied) {
      setCopyStatus("copied")
    } else {
      setCopyStatus("error")
    }
  }

  return (
    <Win7Dialog
      description="Reveal and copy this saved password."
      open={open}
      title={entry?.serviceName ?? "Reveal password"}
      onOpenChange={onOpenChange}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)}>
            Close
          </button>
          <button
            className="default"
            disabled={!password || isLoading}
            type="button"
            onClick={handleCopy}
          >
            {copyStatus === "copied" ? "Copied! ^w^" : "Copy password"}
          </button>
        </>
      }
    >
      <div className="pixelpass-reveal-body">
        <div className="pixelpass-dialog-heading">
          <span className="pixelpass-dialog-icon" aria-hidden="true">
            <PawPrint />
          </span>
          <div>
            <h2>meowing ur pwd for {entry?.username ?? "this account"}</h2>
            <p>keep this window open only as long as u need it nyah &gt;///&lt;</p>
          </div>
        </div>

        {isLoading ? (
          <div aria-busy="true" aria-label="Retrieving password">
            <p>meowing ur pwd…</p>
            <div className="marquee" role="progressbar" aria-label="Retrieving password" />
          </div>
        ) : error ? (
          <div className="pixelpass-error-panel" role="alert">
            <strong>could not meow ur pwd T~T</strong>
            <p>{error}</p>
          </div>
        ) : password ? (
          <div className="pixelpass-field-stack">
            <label htmlFor="revealed-password">Password</label>
            <input
              className="pixelpass-password-field"
              id="revealed-password"
              readOnly
              type="text"
              value={password}
            />
            <p aria-live="polite" className="pixelpass-copy-status">
              {copyStatus === "copied" && "password copied to ur clipboard ^w^"}
              {copyStatus === "error" &&
                "unknown error please copy it manually T~T"}
            </p>
          </div>
        ) : null}
      </div>
    </Win7Dialog>
  )
}
