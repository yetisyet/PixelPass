import { useId, useState } from "react"
import { PawPrint } from "lucide-react"

import Win7Dialog from "@/components/win7_dialog"

export default function AddPasswordDialog({ onCreate, onOpenChange, open }) {
  const formId = useId()
  const [error, setError] = useState("")
  const [isFavorite, setIsFavorite] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [password, setPassword] = useState("")
  const [serviceName, setServiceName] = useState("")
  const [username, setUsername] = useState("")

  function resetForm() {
    setError("")
    setIsFavorite(false)
    setPassword("")
    setServiceName("")
    setUsername("")
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen && !isSaving) resetForm()
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    try {
      await onCreate({ isFavorite, password, serviceName, username })
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
      description="Add a login to the unlocked PixelPass vault."
      open={open}
      title="Add a new login"
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
            {isSaving ? "Saving… >w<" : "Save login"}
          </button>
        </>
      }
    >
      <form className="pixelpass-add-form" id={formId} onSubmit={handleSubmit}>
        <div className="pixelpass-dialog-heading">
          <span className="pixelpass-dialog-icon" aria-hidden="true">
            <PawPrint />
          </span>
          <div>
            <h2>leave a new paw print in ur vault nyah ^w^</h2>
            <p>ur password goes straight to the backend, not the list &gt;///&lt;</p>
          </div>
        </div>

        {error && (
          <div className="pixelpass-error-panel" role="alert">
            <strong>could not save this login T~T</strong>
            <p>{error}</p>
          </div>
        )}

        <div className="pixelpass-form-grid">
          <label htmlFor="new-service">Service name</label>
          <input
            autoFocus
            id="new-service"
            maxLength={100}
            required
            type="text"
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
          />

          <label htmlFor="new-username">Username or email</label>
          <input
            autoComplete="username"
            id="new-username"
            maxLength={200}
            required
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label htmlFor="new-password">Password</label>
          <input
            autoComplete="new-password"
            id="new-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="pixelpass-checkbox-row">
          <input
            checked={isFavorite}
            id="new-favorite"
            type="checkbox"
            onChange={(event) => setIsFavorite(event.target.checked)}
          />
          <label htmlFor="new-favorite">Add to Favorites</label>
        </div>
      </form>
    </Win7Dialog>
  )
}
