import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Eye,
  KeyRound,
  Lock,
  LockKeyhole,
  PawPrint,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  X,
} from "@/components/win7_icons"
import { useLocation, useNavigate } from "react-router-dom"
import background from "../lib/background.jpg"
import PasscodeVault from "@/components/passcode_vault"
import AddPasswordDialog from "@/components/ui/add_password"
import EditPasswordDialog from "@/components/ui/edit_password"
import PasswordRevealDialog from "@/components/ui/password_reveal"
import RemovePasswordDialog from "@/components/ui/remove_password"
import { sendBackendRequest } from "@/lib/backend-client"

function useDraggable(initialPos = { x: 0, y: 0 }) {
  const [pos, setPos] = useState(initialPos)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback(
    (event) => {
      dragging.current = true
      offset.current = {
        x: event.clientX - pos.x,
        y: event.clientY - pos.y,
      }
    },
    [pos],
  )

  useEffect(() => {
    const onMouseMove = (event) => {
      if (!dragging.current) return

      setPos({
        x: event.clientX - offset.current.x,
        y: event.clientY - offset.current.y,
      })
    }
    const onMouseUp = () => {
      dragging.current = false
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  return { pos, onMouseDown }
}

const categories = [
  { id: "all", label: "All items", Icon: BookOpen },
  { id: "favorites", label: "Favorites", Icon: Star },
  { id: "logins", label: "Logins", Icon: KeyRound },
  { id: "passcodes", label: "Passcodes", Icon: ShieldCheck },
]

function normalizeEntries(entries) {
  return entries.map((entry, index) => {
    const id = entry.id ?? entry.Id

    if (!Number.isInteger(id)) {
      throw new Error(`Password entry ${index + 1} has an invalid ID.`)
    }

    return {
      id,
      serviceName: String(entry.serviceName ?? "Unnamed service"),
      username: String(entry.username ?? "No username"),
      isFavorite: Boolean(entry.isFav),
    }
  })
}

function nextPasswordId(entries) {
  const numericIds = entries
    .map((entry) => entry.id)
    .filter((id) => Number.isInteger(id) && id >= 0)

  return numericIds.length === 0 ? 1 : Math.max(...numericIds) + 1
}

function PasswordRow({ isReadOnly, onEdit, onRemove, onView, password }) {
  return (
    <tr>
      <td>
        <span className="pixelpass-service-cell">
          <KeyRound aria-hidden="true" />
          <strong>{password.serviceName}</strong>
        </span>
      </td>
      <td className="pixelpass-username-cell">{password.username}</td>
      <td className="pixelpass-favorite-cell">
        {password.isFavorite ? (
          <Star aria-label="Favorite" className="is-favorite" fill="currentColor" />
        ) : (
          <span aria-label="Not a favorite">—</span>
        )}
      </td>
      <td className="pixelpass-action-cell">
        <div className="pixelpass-row-actions">
          <button
            aria-label={`Reveal password for ${password.serviceName}`}
            className="pixelpass-reveal-button"
            type="button"
            onClick={() => onView(password)}
          >
            <Eye aria-hidden="true" />
            <span className="pixelpass-action-label">Reveal</span>
          </button>
          <button
            aria-label={`Edit ${password.serviceName}`}
            className="pixelpass-edit-button"
            disabled={isReadOnly}
            title={isReadOnly ? "This recovered vault is read-only" : undefined}
            type="button"
            onClick={() => onEdit(password)}
          >
            <Pencil aria-hidden="true" />
            <span className="pixelpass-action-label">Edit</span>
          </button>
          <button
            aria-label={`Remove ${password.serviceName}`}
            className="pixelpass-remove-button"
            disabled={isReadOnly}
            title={isReadOnly ? "This recovered vault is read-only" : "Remove login"}
            type="button"
            onClick={() => onRemove(password)}
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const isReadOnly = Boolean(location.state?.readOnly)
  const { pos, onMouseDown } = useDraggable({ x: 0, y: 0 })
  const [activeCategory, setActiveCategory] = useState("all")
  const [error, setError] = useState("")
  const [entryToEdit, setEntryToEdit] = useState(null)
  const [entryToRemove, setEntryToRemove] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAddPasscodeOpen, setIsAddPasscodeOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRevealOpen, setIsRevealOpen] = useState(false)
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [passwords, setPasswords] = useState([])
  const [revealError, setRevealError] = useState("")
  const [revealedPassword, setRevealedPassword] = useState("")
  const [search, setSearch] = useState("")
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [statusMessage, setStatusMessage] = useState("opening ur vault…")
  const hasLoadedPasswords = useRef(false)
  const listRequestId = useRef(0)
  const revealRequestId = useRef(0)

  const loadPasswords = useCallback(async () => {
    const requestId = ++listRequestId.current

    try {
      setIsLoading(true)
      setError("")

      const response = await sendBackendRequest({
        action: 1,
      })

      if (!response.success) {
        throw new Error(response.error ?? "The vault could not be loaded.")
      }
      if (!Array.isArray(response.data?.entries)) {
        throw new Error("The backend returned an invalid password list.")
      }
      if (requestId !== listRequestId.current) return

      setPasswords(normalizeEntries(response.data.entries))
      setStatusMessage(
        isReadOnly
          ? "recovered vault opened in read-only mode"
          : "vault unlocked nyah ^w^",
      )
    } catch (loadError) {
      if (requestId !== listRequestId.current) return
      setPasswords([])
      setError(loadError.message)
      setStatusMessage("could not load the vault T~T")
    } finally {
      if (requestId === listRequestId.current) setIsLoading(false)
    }
  }, [isReadOnly])

  useEffect(() => {
    if (hasLoadedPasswords.current) return
    hasLoadedPasswords.current = true
    loadPasswords()
  }, [loadPasswords])

  const visiblePasswords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return passwords.filter((password) => {
      const matchesCategory =
        activeCategory === "all" ||
        activeCategory === "logins" ||
        (activeCategory === "favorites" && password.isFavorite)
      const matchesSearch =
        !query ||
        password.serviceName.toLowerCase().includes(query) ||
        password.username.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, passwords, search])

  const activeCategoryLabel =
    categories.find(({ id }) => id === activeCategory)?.label ?? "All items"

  async function openPassword(entry) {
    const requestId = ++revealRequestId.current
    setSelectedEntry(entry)
    setRevealedPassword("")
    setRevealError("")
    setIsRevealOpen(true)
    setIsRevealing(true)

    try {
      const response = await sendBackendRequest({
        action: 2,
        data: {
          id: entry.id,
        },
      })

      if (!response.success) {
        throw new Error(response.error ?? "The password could not be revealed.")
      }

      const password = response.data?.password
      if (typeof password !== "string") {
        throw new Error("The backend returned an invalid password.")
      }
      if (requestId !== revealRequestId.current) return

      setRevealedPassword(password)
    } catch (revealRequestError) {
      if (requestId !== revealRequestId.current) return
      setRevealError(revealRequestError.message)
    } finally {
      if (requestId === revealRequestId.current) setIsRevealing(false)
    }
  }

  function handleRevealOpenChange(open) {
    setIsRevealOpen(open)

    if (!open) {
      revealRequestId.current += 1
      setSelectedEntry(null)
      setRevealedPassword("")
      setRevealError("")
      setIsRevealing(false)
    }
  }

  async function createPassword(values) {
    if (isReadOnly) {
      throw new Error("This recovered vault is read-only. Recover it again with every original share to make changes.")
    }

    const createdEntryId = nextPasswordId(passwords)
    const response = await sendBackendRequest({
      action: 3,
      data: {
        id: createdEntryId,
        serviceName: values.serviceName,
        username: values.username,
        password: values.password,
        isFav: values.isFavorite,
      },
    })

    if (!response.success) {
      throw new Error(response.error ?? "Failed to create password entry")
    }

    setPasswords((currentPasswords) => [
      {
        id: createdEntryId,
        serviceName: values.serviceName,
        username: values.username,
        isFavorite: values.isFavorite,
      },
      ...currentPasswords,
    ])
    setActiveCategory("all")
    setStatusMessage("saved password nyah >///<")
  }

  function openEditDialog(entry) {
    setEntryToEdit(entry)
    setIsEditOpen(true)
  }

  function handleEditOpenChange(open) {
    setIsEditOpen(open)
    if (!open) setEntryToEdit(null)
  }

  async function editPassword(values) {
    if (!entryToEdit) throw new Error("No login was selected.")
    if (isReadOnly) {
      throw new Error("This recovered vault is read-only. Recover it again with every original share to make changes.")
    }

    const response = await sendBackendRequest({
      action: 5,
      data: {
        id: entryToEdit.id,
        serviceName: values.serviceName,
        username: values.username,
        password: values.password,
        isFav: values.isFavorite,
      },
    })

    if (!response.success) {
      throw new Error(response.error ?? "Failed to edit password entry")
    }

    setPasswords((currentPasswords) =>
      currentPasswords.map((entry) =>
        entry.id === entryToEdit.id
          ? {
              ...entry,
              serviceName: values.serviceName,
              username: values.username,
              isFavorite: values.isFavorite,
            }
          : entry,
      ),
    )
    setStatusMessage("edited password nyah ^w^")
  }

  function openRemoveDialog(entry) {
    setEntryToRemove(entry)
    setIsRemoveOpen(true)
  }

  function handleRemoveOpenChange(open) {
    setIsRemoveOpen(open)
    if (!open) setEntryToRemove(null)
  }

  async function removePassword(entry) {
    if (isReadOnly) {
      throw new Error("This recovered vault is read-only. Recover it again with every original share to make changes.")
    }

    const response = await sendBackendRequest({
      action: 4,
      data: {
        id: entry.id,
      },
    })

    if (!response.success) {
      throw new Error(response.error ?? "Failed to remove password entry")
    }

    setPasswords((currentPasswords) =>
      currentPasswords.filter((password) => password.id !== entry.id),
    )
    setStatusMessage("removed password from ur vault T~T")
  }

  function lockVault() {
    listRequestId.current += 1
    revealRequestId.current += 1
    setPasswords([])
    setRevealedPassword("")
    setSelectedEntry(null)
    navigate("/")
  }

  function selectCategory(id) {
    setActiveCategory(id)
    if (id === "passcodes") {
      setStatusMessage("Real six-digit passcodes refresh every 30 seconds.")
    } else if (error) {
      setStatusMessage("could not load the vault T~T")
    } else if (isReadOnly) {
      setStatusMessage("recovered vault is open in read-only mode")
    } else {
      setStatusMessage("vault unlocked nyah ^w^")
    }
  }

  return (
      <main
        className="pixelpass-page pixelpass-home-page"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
      <section
        className="window active glass pixelpass-main-window"
        style={{
          position: "relative",
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }}
      >
        <div
          className="title-bar"
          onMouseDown={onMouseDown}
          style={{ cursor: "grab" }}
        >
          <div className="title-bar-text">
            PixelPass — {activeCategory === "passcodes" ? "Authenticator" : error ? "Vault connection" : isReadOnly ? "Recovered vault — read only" : "Unlocked vault"}
          </div>
          <div
            className="title-bar-controls"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button aria-label="Minimize" disabled type="button" />
            <button aria-label="Maximize" disabled type="button" />
            <button aria-label="Close" title="Close vault" type="button" onClick={lockVault} />
          </div>
        </div>

        <div className="window-body pixelpass-window-body">
          {isReadOnly && (
            <div className="pixelpass-read-only-notice" role="status">
              <Lock aria-hidden="true" />
              <div>
                <strong>Recovered in read-only mode</strong>
                <span>You can view and reveal saved logins. Recover again with every original image share to add, edit, or remove entries.</span>
              </div>
            </div>
          )}

          <div className="pixelpass-explorer">
            <aside className="pixelpass-sidebar">
              <div className="pixelpass-sidebar-heading">
                <LockKeyhole aria-hidden="true" />
                <div>
                  <strong>Encrypted vault</strong>
                  <span>
                    {passwords.length} {passwords.length === 1 ? "login" : "logins"}
                  </span>
                </div>
              </div>

              <nav aria-label="Vault categories">
                {categories.map(({ Icon, id, label }) => (
                  <button
                    aria-current={activeCategory === id ? "page" : undefined}
                    className={`pixelpass-sidebar-link${
                      activeCategory === id ? " is-active" : ""
                    }`}
                    key={id}
                    type="button"
                    onClick={() => selectCategory(id)}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="pixelpass-sidebar-note">
                <Lock aria-hidden="true" />
                <p>Secrets stay covered until you choose Reveal. Passcodes roll without exposing their authenticator secret.</p>
              </div>
            </aside>

            {activeCategory === "passcodes" ? (
              <section className="pixelpass-content pixelpass-passcode-content">
                <PasscodeVault
                  addOpen={isAddPasscodeOpen}
                  onAddOpenChange={setIsAddPasscodeOpen}
                  onStatusChange={setStatusMessage}
                />
              </section>
            ) : (
              <section className="pixelpass-content" aria-labelledby="passwords-heading">
              <div className="pixelpass-content-header">
                <div>
                  <h1 id="passwords-heading">{activeCategoryLabel}</h1>
                  <p aria-live="polite">
                    {visiblePasswords.length} visible {visiblePasswords.length === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="pixelpass-content-actions">
                  <div className="pixelpass-search">
                    <label className="sr-only" htmlFor="vault-search">
                      Search this vault
                    </label>
                    <Search aria-hidden="true" className="pixelpass-search-icon" />
                    <input
                      aria-controls="password-list"
                      id="vault-search"
                      placeholder="Search ur vault"
                      role="searchbox"
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <PawPrint aria-hidden="true" className="pixelpass-search-paw" />
                  </div>
                  <button
                    className="default"
                    disabled={isReadOnly}
                    title={isReadOnly ? "This recovered vault is read-only" : undefined}
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                  >
                    <Plus aria-hidden="true" />
                    New login
                  </button>
                </div>
              </div>

              <div className="pixelpass-list-frame" id="password-list">
                {isLoading ? (
                  <div className="pixelpass-loading" aria-busy="true">
                    <PawPrint aria-hidden="true" />
                    <strong>opening ur vault…</strong>
                    <div className="marquee" role="progressbar" aria-label="Loading password entries" />
                  </div>
                ) : error && passwords.length === 0 ? (
                  <div className="pixelpass-empty-state" role="alert">
                    <PawPrint aria-hidden="true" />
                    <h2>could not load the vault T~T</h2>
                    <p>{error}</p>
                    <button className="default" type="button" onClick={loadPasswords}>
                      <RefreshCw aria-hidden="true" />
                      Retry backend
                    </button>
                  </div>
                ) : visiblePasswords.length > 0 ? (
                  <div className="pixelpass-table-scroll">
                    <table className="pixelpass-password-table">
                      <thead>
                        <tr>
                          <th scope="col">Service</th>
                          <th scope="col">Username</th>
                          <th scope="col">Favorite</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePasswords.map((password) => (
                          <PasswordRow
                            isReadOnly={isReadOnly}
                            key={password.id}
                            password={password}
                            onEdit={openEditDialog}
                            onRemove={openRemoveDialog}
                            onView={openPassword}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="pixelpass-empty-state">
                    <PawPrint aria-hidden="true" />
                    <h2>No Passwords Found</h2>
                    <p>
                      {activeCategory === "secure-notes"
                        ? "secure notes are still curled up for now >w<"
                        : "Try another search or pick a different folder."}
                    </p>
                  </div>
                )}
              </div>
              </section>
            )}
          </div>
        </div>

        <div className="status-bar">
          <p
            aria-live="polite"
            className="status-bar-field pixelpass-status-message"
            role="status"
          >
            <PawPrint aria-hidden="true" />
            {statusMessage}
          </p>
          <p className="status-bar-field">
            {activeCategory === "passcodes"
              ? "30-second TOTP"
              : `${visiblePasswords.length} of ${passwords.length} items`}
          </p>
          <p className="status-bar-field">
            {activeCategory === "passcodes" ? "Session-only" : error ? "Offline" : isReadOnly ? "Read-only" : "Unlocked"}
          </p>
        </div>
      </section>

      <PasswordRevealDialog
        entry={selectedEntry}
        error={revealError}
        isLoading={isRevealing}
        open={isRevealOpen}
        password={revealedPassword}
        onOpenChange={handleRevealOpenChange}
      />
      <AddPasswordDialog
        open={isAddOpen}
        onCreate={createPassword}
        onOpenChange={setIsAddOpen}
      />
      <EditPasswordDialog
        entry={entryToEdit}
        open={isEditOpen}
        onOpenChange={handleEditOpenChange}
        onSave={editPassword}
      />
      <RemovePasswordDialog
        entry={entryToRemove}
        open={isRemoveOpen}
        onConfirm={removePassword}
        onOpenChange={handleRemoveOpenChange}
      />
    </main>
  )
}
