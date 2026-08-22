import { useState } from "react"
import { AlertTriangle } from "lucide-react"

import Win7Dialog from "@/components/win7_dialog"

export default function RemovePasswordDialog({
  entry,
  onConfirm,
  onOpenChange,
  open,
}) {
  const [error, setError] = useState("")
  const [isRemoving, setIsRemoving] = useState(false)

  function handleOpenChange(nextOpen) {
    if (!nextOpen && !isRemoving) setError("")
    onOpenChange(nextOpen)
  }

  async function removeEntry() {
    if (!entry) return
    setError("")
    setIsRemoving(true)

    try {
      await onConfirm(entry)
      onOpenChange(false)
    } catch (removeError) {
      setError(removeError.message)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Win7Dialog
      description="Confirm permanent removal of this saved login."
      open={open}
      title="Remove saved login"
      onOpenChange={handleOpenChange}
      footer={
        <>
          <button
            className="default"
            disabled={isRemoving}
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            Keep it
          </button>
          <button
            className="pixelpass-danger-button"
            disabled={isRemoving}
            type="button"
            onClick={removeEntry}
          >
            {isRemoving ? "Removing…" : "Remove login"}
          </button>
        </>
      }
    >
      <div className="pixelpass-remove-body">
        <div className="pixelpass-dialog-heading">
          <span className="pixelpass-dialog-icon pixelpass-warning-icon" aria-hidden="true">
            <AlertTriangle />
          </span>
          <div>
            <h2>remove {entry?.serviceName ?? "this login"}?</h2>
            <p>
              {entry?.username ?? "this account"} will leave ur vault for good T~T
            </p>
          </div>
        </div>

        {error && (
          <div className="pixelpass-error-panel" role="alert">
            <strong>could not remove this login T~T</strong>
            <p>{error}</p>
          </div>
        )}
      </div>
    </Win7Dialog>
  )
}
