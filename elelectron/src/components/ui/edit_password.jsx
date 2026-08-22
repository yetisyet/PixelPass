import { useEffect, useId, useState } from "react"
import { Pencil, PawPrint } from "lucide-react"

import Win7Dialog from "@/components/win7_dialog"

export default function EditPasswordDialog({
  entry,
  onOpenChange,
  onSave,
  open,
}) {
  const formId = useId()
  const [error, setError] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")

  useEffect(() => {
    if (!open || !entry) return
    setError("")
    setIsFavorite(entry.isFavorite)
    setPassword("")
    setUsername(entry.username)
  }, [entry, open])

  function resetForm() {
    setError("")
    setIsFavorite(false)
    setPassword("")
    setUsername("")
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen && !isSaving) resetForm()
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!entry) return
    setError("")
    setIsSaving(true)

    try {
      await onSave({
        isFavorite,
        password,
        serviceName: entry.serviceName,
        username,
      })
      resetForm()
      onOpenChange(false)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Win7Dialog
      description="Edit this login in the unlocked PixelPass vault."
      open={open}
      title={`Edit ${entry?.serviceName ?? "login"}`}
      onOpenChange={handleOpenChange}
      footer={
        <>
          <button
            disabled={isSaving}
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="default"
            disabled={isSaving}
            form={formId}
            type="submit"
          >
            {isSaving ? "Saving… >w<" : "Save changes"}
          </button>
        </>
      }
    >
      <form className="pixelpass-edit-form" id={formId} onSubmit={handleSubmit}>
        <div className="pixelpass-dialog-heading">
          <span className="pixelpass-dialog-icon" aria-hidden="true">
            <Pencil />
          </span>
          <div>
            <h2>edit this little login paw print nyah ^w^</h2>
            <p>enter the password u want the backend to save &gt;///&lt;</p>
          </div>
        </div>

        {error && (
          <div className="pixelpass-error-panel" role="alert">
            <strong>could not edit this login T~T</strong>
            <p>{error}</p>
          </div>
        )}

        <div className="pixelpass-form-grid">
          <label htmlFor="edit-service">Service name</label>
          <input
            id="edit-service"
            readOnly
            type="text"
            value={entry?.serviceName ?? ""}
          />

          <label htmlFor="edit-username">Username or email</label>
          <input
            autoFocus
            autoComplete="username"
            id="edit-username"
            maxLength={200}
            required
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label htmlFor="edit-password">New password</label>
          <input
            autoComplete="new-password"
            id="edit-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="pixelpass-checkbox-row">
          <input
            checked={isFavorite}
            id="edit-favorite"
            type="checkbox"
            onChange={(event) => setIsFavorite(event.target.checked)}
          />
          <label htmlFor="edit-favorite">Keep in Favorites</label>
        </div>

        <p className="pixelpass-form-note">
          <PawPrint aria-hidden="true" />
          service name stays fixed while u edit this login nyah ^w^
        </p>
      </form>
    </Win7Dialog>
  )
}
