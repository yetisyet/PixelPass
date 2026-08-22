import { useEffect, useId, useRef, useState } from "react"
import {
  Check,
  Clock3,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react"

import Win7Dialog from "@/components/win7_dialog"
import {
  createPasscode,
  listPasscodes,
  removePasscode,
  requestCurrentPasscode,
} from "@/lib/vault-feature-client"

function AddPasscodeDialog({ onCreate, onOpenChange, open }) {
  const formId = useId()
  const [accountName, setAccountName] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [issuer, setIssuer] = useState("")
  const [secret, setSecret] = useState("")

  function reset() {
    setAccountName("")
    setError("")
    setIssuer("")
    setSecret("")
  }

  function changeOpen(nextOpen) {
    if (!nextOpen && !isSaving) reset()
    onOpenChange(nextOpen)
  }

  async function submit(event) {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    try {
      const created = await createPasscode({ accountName, issuer, secret })
      onCreate(created)
      reset()
      onOpenChange(false)
    } catch (createError) {
      setError(createError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Win7Dialog
      description="Add a rolling authenticator code to PixelPass."
      open={open}
      title="Add authenticator passcode"
      onOpenChange={changeOpen}
      footer={
        <>
          <button disabled={isSaving} type="button" onClick={() => changeOpen(false)}>Cancel</button>
          <button className="default" disabled={isSaving} form={formId} type="submit">
            {isSaving ? "Adding…" : "Add passcode"}
          </button>
        </>
      }
    >
      <form className="pixelpass-passcode-form" id={formId} onSubmit={submit}>
        <div className="pixelpass-dialog-heading">
          <span className="pixelpass-dialog-icon" aria-hidden="true"><Clock3 /></span>
          <div>
            <h2>Keep the code beside its login.</h2>
            <p>The frontend demo keeps this entry in memory only. The backend handoff will encrypt the authenticator secret.</p>
          </div>
        </div>
        {error && <div className="pixelpass-error-panel" role="alert"><strong>Could not add this passcode</strong><p>{error}</p></div>}
        <div className="pixelpass-form-grid">
          <label htmlFor="passcode-issuer">Issuer</label>
          <input autoFocus id="passcode-issuer" maxLength={80} placeholder="GitHub" required value={issuer} onChange={(event) => setIssuer(event.target.value)} />
          <label htmlFor="passcode-account">Account</label>
          <input id="passcode-account" maxLength={160} placeholder="you@example.com" required value={accountName} onChange={(event) => setAccountName(event.target.value)} />
          <label htmlFor="passcode-secret">Authenticator secret</label>
          <input autoComplete="off" id="passcode-secret" minLength={8} placeholder="Base32 secret" required type="password" value={secret} onChange={(event) => setSecret(event.target.value)} />
        </div>
        <p className="pixelpass-form-note"><ShieldCheck aria-hidden="true" />Never store the rolling six-digit code. The encrypted vault stores the secret used to produce it.</p>
      </form>
    </Win7Dialog>
  )
}

function PasscodeDial({ passcode, now }) {
  const periodMilliseconds = passcode.periodSeconds * 1000
  const remainingMilliseconds = Math.max(0, passcode.expiresAt - now)
  const remainingSeconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000))
  const progress = Math.max(0, Math.min(1, remainingMilliseconds / periodMilliseconds))
  const circumference = 2 * Math.PI * 15

  return (
    <div className={`pixelpass-passcode-dial${remainingSeconds <= 10 ? " is-expiring" : ""}`} aria-label={`${remainingSeconds} seconds remaining`}>
      <svg aria-hidden="true" viewBox="0 0 36 36">
        <circle className="pixelpass-dial-track" cx="18" cy="18" r="15" />
        <circle
          className="pixelpass-dial-progress"
          cx="18"
          cy="18"
          r="15"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <strong>{remainingSeconds}</strong>
    </div>
  )
}

export default function PasscodeVault({ addOpen, onAddOpenChange, onStatusChange }) {
  const refreshingIds = useRef(new Set())
  const [copiedId, setCopiedId] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [passcodes, setPasscodes] = useState([])
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setIsLoading(true)
        const loaded = await listPasscodes()
        if (active) setPasscodes(loaded)
      } catch (loadError) {
        if (active) setError(loadError.message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    passcodes.forEach((passcode) => {
      if (now < passcode.expiresAt || refreshingIds.current.has(passcode.id)) return
      refreshingIds.current.add(passcode.id)

      requestCurrentPasscode(passcode)
        .then((refreshed) => {
          setPasscodes((current) => current.map((item) => item.id === refreshed.id ? refreshed : item))
        })
        .catch((refreshError) => setError(refreshError.message))
        .finally(() => refreshingIds.current.delete(passcode.id))
    })
  }, [now, passcodes])

  async function copyCode(passcode) {
    const text = passcode.code
    if (window.pixelPassBackend?.copyText) await window.pixelPassBackend.copyText(text)
    else await navigator.clipboard.writeText(text)

    setCopiedId(passcode.id)
    onStatusChange?.(`Copied the ${passcode.issuer} passcode.`)
    window.setTimeout(() => setCopiedId((current) => current === passcode.id ? null : current), 1800)
  }

  function receiveCreated(created) {
    setPasscodes((current) => [created, ...current])
    onStatusChange?.(`Added ${created.issuer} passcode in frontend demo mode.`)
  }

  async function remove(record) {
    try {
      setRemovingId(record.id)
      await removePasscode(record.id)
      setPasscodes((current) => current.filter(({ id }) => id !== record.id))
      onStatusChange?.(`Removed ${record.issuer} passcode.`)
    } catch (removeError) {
      setError(removeError.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <>
      <section className="pixelpass-passcodes" aria-labelledby="passcodes-heading">
        <header className="pixelpass-passcodes-heading">
          <div>
            <h1 id="passcodes-heading">Rolling passcodes</h1>
            <p>Authenticator codes refresh together every 30 seconds.</p>
          </div>
          <span className="pixelpass-demo-badge">Demo data</span>
        </header>

        <div className="pixelpass-passcode-explainer">
          <Clock3 aria-hidden="true" />
          <div>
            <strong>The number rolls; the secret stays encrypted.</strong>
            <span>Copy the current six-digit code before its timer reaches zero.</span>
          </div>
          <button type="button" onClick={() => onAddOpenChange(true)}><Plus aria-hidden="true" /> Add passcode</button>
        </div>

        {error && <div className="pixelpass-inline-error" role="alert">{error}</div>}

        {isLoading ? (
          <div className="pixelpass-loading" aria-busy="true"><RefreshCw aria-hidden="true" /><strong>Loading rolling codes…</strong><div className="marquee" /></div>
        ) : passcodes.length === 0 ? (
          <div className="pixelpass-empty-state"><KeyRound aria-hidden="true" /><h2>No passcodes yet</h2><p>Add an authenticator secret to see its rolling code here.</p><button className="default" type="button" onClick={() => onAddOpenChange(true)}>Add passcode</button></div>
        ) : (
          <div className="pixelpass-passcode-list">
            {passcodes.map((passcode) => (
              <article className={`pixelpass-passcode-row tone-${passcode.tone || "blue"}`} key={passcode.id}>
                <div className="pixelpass-passcode-issuer" aria-hidden="true">{passcode.issuer.slice(0, 2).toUpperCase()}</div>
                <div className="pixelpass-passcode-identity">
                  <strong>{passcode.issuer}</strong>
                  <span>{passcode.accountName}</span>
                </div>
                <button className="pixelpass-passcode-value" type="button" onClick={() => copyCode(passcode)}>
                  <span>{passcode.code.slice(0, 3)}</span><span>{passcode.code.slice(3)}</span>
                  <small>{copiedId === passcode.id ? <><Check aria-hidden="true" /> Copied</> : <><Copy aria-hidden="true" /> Copy code</>}</small>
                </button>
                <PasscodeDial now={now} passcode={passcode} />
                <button
                  aria-label={`Remove ${passcode.issuer} passcode`}
                  className="pixelpass-passcode-remove"
                  disabled={removingId === passcode.id}
                  title="Remove passcode"
                  type="button"
                  onClick={() => remove(passcode)}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <AddPasscodeDialog open={addOpen} onCreate={receiveCreated} onOpenChange={onAddOpenChange} />
    </>
  )
}
