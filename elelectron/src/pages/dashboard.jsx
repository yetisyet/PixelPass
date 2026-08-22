import { useEffect, useMemo, useRef, useState } from "react"
import {
  Eye,
  FlaskConical,
  KeyRound,
  LockKeyhole,
  PawPrint,
  Plus,
  Search,
  Star,
  StickyNote,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import AddPasswordDialog from "@/components/ui/add_password"
import PasswordRevealDialog from "@/components/ui/password_reveal"
import { sendBackendRequest } from "@/lib/backend-client"

const categories = [
  { id: "all", label: "All items", Icon: PawPrint },
  { id: "favorites", label: "Favorites", Icon: Star },
  { id: "logins", label: "Logins", Icon: KeyRound },
  { id: "secure-notes", label: "Secure notes", Icon: StickyNote },
]

const demoEntries = [
  {
    serviceName: "Demo GitHub",
    username: "demo@pixelpass.app",
    isFavorite: true,
    demoPassword: "demo-github-password-67",
  },
  {
    serviceName: "Demo Discord",
    username: "demo-user",
    isFavorite: false,
    demoPassword: "demo-discord-password-42",
  },
]

function normalizeEntries(entries) {
  return entries.map((entry, index) => ({
    serviceName: String(entry.serviceName ?? "Unnamed service"),
    username: String(entry.username ?? "No username"),
    isFavorite: Boolean(entry.isFavorite),
  }))
}

function PasswordRow({ onView, password }) {
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
        <button type="button" onClick={() => onView(password)}>
          <Eye aria-hidden="true" />
          Reveal
        </button>
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState("all")
  const [error, setError] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRevealOpen, setIsRevealOpen] = useState(false)
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

  useEffect(() => {
    if (hasLoadedPasswords.current) return
    hasLoadedPasswords.current = true
    const requestId = ++listRequestId.current

    async function loadPasswords() {
      try {
        setIsLoading(true)
        setError("")

        const response = await sendBackendRequest({
          action: "retrieve_all_passwords",
        })

        if (!response.success) {
          throw new Error(response.error ?? "The vault could not be loaded.")
        }
        if (!Array.isArray(response.data?.entries)) {
          throw new Error("The backend returned an invalid password list.")
        }
        if (requestId !== listRequestId.current) return

        setPasswords(normalizeEntries(response.data.entries))
        setIsDemoMode(false)
        setStatusMessage("vault unlocked nyah ^w^")
      } catch (loadError) {
        if (requestId !== listRequestId.current) return
        setError(loadError.message)
        setStatusMessage("backend is hiding T~T — demo still works")
      } finally {
        if (requestId === listRequestId.current) setIsLoading(false)
      }
    }

    loadPasswords()
  }, [])

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

  function loadDemoPasswords() {
    listRequestId.current += 1
    setPasswords(demoEntries)
    setActiveCategory("all")
    setError("")
    setIsDemoMode(true)
    setIsLoading(false)
    setSearch("")
    setStatusMessage("demo paws loaded >w<")
  }

  async function openPassword(entry) {
    const requestId = ++revealRequestId.current
    setSelectedEntry(entry)
    setRevealedPassword("")
    setRevealError("")
    setIsRevealOpen(true)
    setIsRevealing(true)

    try {
      if (entry.demoPassword) {
        setRevealedPassword(entry.demoPassword)
        return
      }

      const response = await sendBackendRequest({
        action: "retrieve_password",
        serviceName: entry.serviceName,
        username: entry.username,
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
    if (isDemoMode) {
      setPasswords((currentPasswords) => [
        {
          id: `demo-${Date.now()}`,
          serviceName: values.serviceName,
          username: values.username,
          isFavorite: values.isFavorite,
          demoPassword: values.password,
        },
        ...currentPasswords,
      ])
      setActiveCategory("all")
      setStatusMessage("saved password nyah >///<")
      return
    }

    throw new Error(
      "the backend add-item action is not defined yet — Load demo to test it >w<",
    )
  }

  function lockVault() {
    listRequestId.current += 1
    revealRequestId.current += 1
    setPasswords([])
    setRevealedPassword("")
    setSelectedEntry(null)
    navigate("/")
  }

  return (
    <main className="pixelpass-page pixelpass-vault-page">
      <section className="window active glass pixelpass-main-window">
        <div className="title-bar">
          <div className="title-bar-text">
            PixelPass — {isDemoMode ? "Demo vault" : error ? "Vault connection" : "Unlocked vault"}
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" disabled type="button" />
            <button aria-label="Maximize" disabled type="button" />
            <button aria-label="Close" title="Close vault" type="button" onClick={lockVault} />
          </div>
        </div>

        <div className="window-body pixelpass-window-body">
          <div className="pixelpass-command-bar" role="toolbar" aria-label="Vault actions">
            <div className="pixelpass-command-group">
              <button type="button" onClick={loadDemoPasswords}>
                <FlaskConical aria-hidden="true" />
                Load demo
              </button>
              <button type="button" onClick={lockVault}>
                <LockKeyhole aria-hidden="true" />
                Lock vault
              </button>
            </div>
            <button className="default" type="button" onClick={() => setIsAddOpen(true)}>
              <Plus aria-hidden="true" />
              New item
            </button>
          </div>

          <div className="pixelpass-explorer">
            <aside className="pixelpass-sidebar">
              <div className="pixelpass-sidebar-heading">
                <PawPrint aria-hidden="true" />
                <div>
                  <strong>saved password nyah</strong>
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
                    onClick={() => setActiveCategory(id)}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="pixelpass-sidebar-note">
                <PawPrint aria-hidden="true" />
                <p>secrets stay covered until u click Reveal ^w^</p>
              </div>
            </aside>

            <section className="pixelpass-content" aria-labelledby="passwords-heading">
              <div className="pixelpass-content-header">
                <div>
                  <h1 id="passwords-heading">{activeCategoryLabel}</h1>
                  <p>
                    {visiblePasswords.length} visible {visiblePasswords.length === 1 ? "item" : "items"}
                  </p>
                </div>

                <label className="pixelpass-search" htmlFor="vault-search">
                  <Search aria-hidden="true" />
                  <input
                    id="vault-search"
                    placeholder="Search ur vault nyah…"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <PawPrint aria-hidden="true" className="pixelpass-search-paw" />
                  <span className="sr-only">Search this vault</span>
                </label>
              </div>

              <div className="pixelpass-list-frame">
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
                    <button className="default" type="button" onClick={loadDemoPasswords}>
                      <FlaskConical aria-hidden="true" />
                      Try the demo &gt;w&lt;
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
                          <th scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePasswords.map((password) => (
                          <PasswordRow
                            key={password.id}
                            password={password}
                            onView={openPassword}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="pixelpass-empty-state">
                    <PawPrint aria-hidden="true" />
                    <h2>no matching paw prints T~T</h2>
                    <p>
                      {activeCategory === "secure-notes"
                        ? "secure notes are still curled up for now >w<"
                        : "try another search or pick a different folder nyah"}
                    </p>
                  </div>
                )}
              </div>
            </section>
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
            {visiblePasswords.length} of {passwords.length} items
          </p>
          <p className="status-bar-field">
            {isDemoMode ? "Demo mode" : error ? "Offline" : "Unlocked"}
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
    </main>
  )
}
