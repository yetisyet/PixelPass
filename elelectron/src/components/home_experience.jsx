import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Images,
  KeyRound,
  LockKeyhole,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "@/components/win7_icons"
import { useNavigate } from "react-router-dom"

import background from "@/lib/background.jpg"
import logo from "@/lib/logo.png"
import { sendBackendRequest } from "@/lib/backend-client"
import {
  initializeGuidedVault,
  recoverVault,
} from "@/lib/vault-feature-client"

const MASTER_KEY_REGEX =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/

const setupSteps = ["Choose images", "Recovery strength", "Seal the vault"]
const ceremonyStages = {
  recovery: [
    "Scanning images for hidden shares",
    "Combining the recovery threshold",
    "Decrypting your reconstructed vault",
  ],
  setup: [
    "Encrypting the new vault",
    "Splitting it into recovery shares",
    "Hiding each share inside an image",
  ],
}

function pause(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function basename(path) {
  return path?.split(/[\\/]/).pop() || "Selected image"
}

function PreviewStrip({ files, total = 5, variant = "setup" }) {
  const visibleFiles = files.length > 0 ? files.slice(0, 5) : Array.from({ length: total })

  return (
    <div className={`pixelpass-image-strip is-${variant}`} aria-label={`${visibleFiles.length} selected images`}>
      {visibleFiles.map((file, index) => (
        <div
          aria-label={`${file?.name || basename(file?.path) || `sample-${index + 1}.png`}, ${variant === "recovery" ? `share ${index + 1}` : "cover image"}`}
          className="pixelpass-image-tile"
          key={file?.id || file?.name || file?.path || index}
          style={file?.preview ? { backgroundImage: `url(${file.preview})` } : undefined}
        >
          {file?.preview ? (
            <span className="sr-only">Preview of {file.name || `sample ${index + 1}`}</span>
          ) : (
            <>
              <ImageIcon aria-hidden="true" />
              <span>{file?.name || basename(file?.path) || `sample-${index + 1}.png`}</span>
              <small>{variant === "recovery" ? `share ${index + 1}` : "cover image"}</small>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function FlowProgress({ currentStep }) {
  return (
    <ol className="pixelpass-flow-progress" aria-label="Setup progress">
      {setupSteps.map((label, index) => {
        const step = index + 1
        const isComplete = currentStep > step
        const isCurrent = currentStep === step

        return (
          <li className={isComplete ? "is-complete" : isCurrent ? "is-current" : ""} key={label}>
            <span>{isComplete ? <Check aria-hidden="true" /> : step}</span>
            <strong>{label}</strong>
          </li>
        )
      })}
    </ol>
  )
}

export default function HomeExperience() {
  const navigate = useNavigate()
  const [backendMode, setBackendMode] = useState(null)
  const [ceremonyKind, setCeremonyKind] = useState("setup")
  const [ceremonyStage, setCeremonyStage] = useState(0)
  const [confirmMasterKey, setConfirmMasterKey] = useState("")
  const [error, setError] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [masterKey, setMasterKey] = useState("")
  const [pastedImage, setPastedImage] = useState("")
  const [recoveryFiles, setRecoveryFiles] = useState([])
  const [recoveryMasterKey, setRecoveryMasterKey] = useState("")
  const [screen, setScreen] = useState("loading")
  const [selectedPaths, setSelectedPaths] = useState([])
  const [setupSource, setSetupSource] = useState("sample")
  const [setupStep, setSetupStep] = useState(1)
  const [statusMessage, setStatusMessage] = useState("Checking the vault configuration…")
  const [threshold, setThreshold] = useState(3)

  const setupTotal = useMemo(() => {
    if (setupSource === "files") return Math.max(2, selectedPaths.length)
    return 5
  }, [selectedPaths.length, setupSource])

  useEffect(() => {
    let active = true

    async function loadStartup() {
      try {
        const startup = await window.pixelPassBackend?.startup?.()
        if (!startup || !Number.isInteger(startup.mode)) {
          throw new Error("The backend did not report a valid startup mode.")
        }
        if (!active) return

        setBackendMode(startup.mode)
        setScreen(startup.mode === -1 ? "choice" : "unlock")
        setStatusMessage(
          startup.mode === -1
            ? "No vault found — create one or recover from PixelPass images."
            : `Vault configuration found — storage mode ${startup.mode}.`,
        )
      } catch (startupError) {
        if (!active) return
        setBackendMode(-1)
        setError(startupError.message)
        setScreen("choice")
        setStatusMessage("Backend unavailable — reconnect it to create, unlock, or recover a vault.")
      }
    }

    loadStartup()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setThreshold((current) => Math.min(Math.max(2, current), setupTotal))
  }, [setupTotal])

  function goTo(nextScreen) {
    setError("")
    setScreen(nextScreen)
  }

  async function chooseSetupFiles() {
    const paths = await window.pixelPassBackend?.selectImagePaths?.()
    if (!Array.isArray(paths) || paths.length === 0) return

    setSelectedPaths(paths)
    setSetupSource("files")
    setError("")
  }

  function readPastedImage(event) {
    const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
      item.type.startsWith("image/"),
    )
    const file = imageItem?.getAsFile()
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPastedImage(String(reader.result))
      setSetupSource("paste")
      setError("")
    }
    reader.readAsDataURL(file)
  }

  function validateSetupStep() {
    if (setupStep === 1) {
      if (setupSource === "paste" && !pastedImage) {
        setError("Paste an image into the selected source panel before continuing.")
        return false
      }
      if (setupSource === "files" && selectedPaths.length < 2) {
        setError("Choose at least two images so the vault can be split into shares.")
        return false
      }
      if (setupSource === "files" && selectedPaths.length > 24) {
        setError("Choose no more than 24 images for this vault.")
        return false
      }
    }

    if (setupStep === 3) {
      if (!MASTER_KEY_REGEX.test(masterKey)) {
        setError("Use 8–16 characters with uppercase, lowercase, number, and symbol.")
        return false
      }
      if (masterKey !== confirmMasterKey) {
        setError("The two master keys do not match.")
        return false
      }
    }

    setError("")
    return true
  }

  function nextSetupStep() {
    if (!validateSetupStep()) return
    setSetupStep((step) => Math.min(3, step + 1))
  }

  function setupBackendRequest() {
    const common = {
      majority: threshold,
      password: masterKey,
      total: setupTotal,
    }

    if (setupSource === "paste") {
      return {
        ...common,
        data: [pastedImage.split(",", 2)[1]],
        mode: 1,
      }
    }
    if (setupSource === "files") return { ...common, mode: 3, paths: selectedPaths }
    return { ...common, mode: "frontend-sample", sampleImageUrl: logo }
  }

  async function runCeremony(kind, finalAction) {
    setCeremonyKind(kind)
    setCeremonyStage(0)
    setScreen("ceremony")
    await pause(520)
    setCeremonyStage(1)
    await pause(620)
    setCeremonyStage(2)
    await pause(720)
    await finalAction()
  }

  async function initializeVault(event) {
    event.preventDefault()
    if (!validateSetupStep()) return

    try {
      setIsBusy(true)
      setStatusMessage("Creating the encrypted image vault…")
      const response = await initializeGuidedVault({ backendRequest: setupBackendRequest() })
      if (!response.success) throw new Error(response.error || "The vault could not be initialized.")

      await runCeremony("setup", async () => {
        setStatusMessage("Vault sealed inside the selected images.")
        navigate("/dashboard")
      })
    } catch (setupError) {
      setScreen("setup")
      setError(setupError.message)
      setStatusMessage("Vault setup did not complete. Review the highlighted step.")
    } finally {
      setIsBusy(false)
    }
  }

  async function unlockVault(event) {
    event.preventDefault()
    setError("")

    if (!MASTER_KEY_REGEX.test(masterKey)) {
      setError("Enter the master key used when this vault was created.")
      return
    }

    try {
      setIsBusy(true)
      setStatusMessage("Unlocking the image vault…")
      const response = await sendBackendRequest({ password: masterKey })
      if (!response.success) throw new Error(response.error || "The master key was rejected.")
      navigate("/dashboard")
    } catch (unlockError) {
      setError(unlockError.message)
      setStatusMessage("The vault is still locked.")
    } finally {
      setIsBusy(false)
    }
  }

  async function chooseRecoveryFiles() {
    try {
      const paths = await window.pixelPassBackend?.selectImagePaths?.()
      if (!Array.isArray(paths)) {
        throw new Error("The recovery image picker is not available.")
      }
      if (paths.length === 0) return

      const files = paths.map((path, index) => ({
        id: `${path}-${index}`,
        name: basename(path),
        path,
      }))

      setRecoveryFiles(files)
      setError("")
      setStatusMessage(
        `${files.length} recovery ${files.length === 1 ? "image" : "images"} selected.`,
      )
    } catch (selectionError) {
      setError(selectionError.message)
      setStatusMessage("Recovery images could not be selected.")
    }
  }

  async function completeRecovery(event) {
    event.preventDefault()
    setError("")

    try {
      setIsBusy(true)
      setStatusMessage("Rebuilding the vault from image shares…")
      const result = await recoverVault({
        masterKey: recoveryMasterKey,
        paths: recoveryFiles.map((file) => file.path),
      })

      await runCeremony("recovery", async () => {
        setStatusMessage(
          result.readOnly
            ? "Vault recovered in read-only mode from the available shares."
            : "Vault recovered with full access.",
        )
        navigate("/dashboard", {
          state: {
            readOnly: result.readOnly,
            recoverySummary: result,
          },
        })
      })
    } catch (recoveryError) {
      setScreen("recovery")
      setError(recoveryError.message)
      setStatusMessage("Recovery stopped before the vault was opened.")
    } finally {
      setIsBusy(false)
    }
  }

  const setupFiles = useMemo(() => {
    if (setupSource === "sample") {
      return Array.from({ length: 5 }, (_, index) => ({
        id: `sample-${index}`,
        name: `pixelpass-sample-${index + 1}.png`,
        preview: logo,
      }))
    }
    if (setupSource === "paste" && pastedImage) {
      return Array.from({ length: 5 }, (_, index) => ({
        id: `pasted-${index}`,
        name: `pasted-copy-${index + 1}.png`,
        preview: pastedImage,
      }))
    }
    if (setupSource === "files") {
      return selectedPaths.map((path, index) => ({ id: `${path}-${index}`, name: basename(path), path }))
    }
    return []
  }, [pastedImage, selectedPaths, setupSource])

  function renderChoice() {
    return (
      <div className="pixelpass-choice-layout">
        <div className="pixelpass-choice-story">
          <img className="pixelpass-choice-logo" src={logo} alt="PixelPass" />
          <h1>Your photos can be the vault.</h1>
          <p>
            PixelPass encrypts your secrets, splits them into recovery shares, and hides those shares inside ordinary images.
          </p>
          <div className="pixelpass-proof-line">
            <ShieldCheck aria-hidden="true" />
            <span>No separate vault file sitting in plain sight.</span>
          </div>
        </div>

        <div className="pixelpass-choice-actions">
          <button className="pixelpass-path-button is-primary" type="button" onClick={() => goTo("setup")}>
            <span className="pixelpass-path-icon"><Images aria-hidden="true" /></span>
            <span>
              <strong>Create a new vault</strong>
              <small>Choose images, set the recovery threshold, then seal it.</small>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
          <button className="pixelpass-path-button" type="button" onClick={() => goTo("recovery")}>
            <span className="pixelpass-path-icon"><RefreshCw aria-hidden="true" /></span>
            <span>
              <strong>Recover from images</strong>
              <small>Bring back an existing vault from its PixelPass shares.</small>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  function renderUnlock() {
    return (
      <div className="pixelpass-unlock-layout">
        <div className="pixelpass-unlock-art">
          <img src={logo} alt="" />
          <div className="pixelpass-unlock-seal"><LockKeyhole aria-hidden="true" /></div>
        </div>
        <form className="pixelpass-unlock-form" onSubmit={unlockVault}>
          <h1>Welcome back to your image vault.</h1>
          <p>Enter the master key to reconstruct and decrypt the secrets hidden across your images.</p>
          <label htmlFor="unlock-master-key">Master key</label>
          <input
            autoFocus
            autoComplete="current-password"
            disabled={isBusy}
            id="unlock-master-key"
            type="password"
            value={masterKey}
            onChange={(event) => setMasterKey(event.target.value)}
          />
          {error && <div className="pixelpass-inline-error" role="alert">{error}</div>}
          <div className="pixelpass-form-actions">
            <button className="default" disabled={isBusy} type="submit">
              <KeyRound aria-hidden="true" />
              {isBusy ? "Opening vault…" : "Open the vault"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  function renderSetup() {
    return (
      <div className="pixelpass-guided-flow">
        <div className="pixelpass-flow-heading">
          <button aria-label="Back to start" className="pixelpass-icon-button" type="button" onClick={() => goTo(backendMode === -1 ? "choice" : "unlock")}>
            <ArrowLeft aria-hidden="true" />
          </button>
          <div>
            <h1>Create an image vault</h1>
            <p>Three clear choices, then PixelPass does the hiding.</p>
          </div>
        </div>
        <FlowProgress currentStep={setupStep} />

        <form className="pixelpass-step-panel" onSubmit={initializeVault}>
          {setupStep === 1 && (
            <div className="pixelpass-step-content">
              <div className="pixelpass-step-copy">
                <h2>Choose the images that will carry your vault.</h2>
                <p>Their appearance stays the same after PixelPass embeds the encrypted shares.</p>
              </div>
              <div className="pixelpass-source-rail" role="group" aria-label="Image source">
                <button aria-pressed={setupSource === "sample"} className={setupSource === "sample" ? "is-selected" : ""} type="button" onClick={() => setSetupSource("sample")}>
                  <strong>Sample pack</strong><small>Fastest for a demo</small>
                </button>
                <button aria-pressed={setupSource === "files"} className={setupSource === "files" ? "is-selected" : ""} type="button" onClick={chooseSetupFiles}>
                  <strong>Choose files</strong><small>Use your own images</small>
                </button>
                <button aria-pressed={setupSource === "paste"} className={setupSource === "paste" ? "is-selected" : ""} type="button" onClick={() => setSetupSource("paste")}>
                  <strong>Paste image</strong><small>Repeat it as covers</small>
                </button>
              </div>
              {setupSource === "paste" ? (
                <div className="pixelpass-paste-zone" tabIndex={0} onPaste={readPastedImage}>
                  {pastedImage ? <img src={pastedImage} alt="Pasted vault cover" /> : <><ImageIcon aria-hidden="true" /><span>Click here and press Ctrl+V</span></>}
                </div>
              ) : (
                <PreviewStrip files={setupFiles} total={setupTotal} />
              )}
            </div>
          )}

          {setupStep === 2 && (
            <div className="pixelpass-step-content pixelpass-threshold-step">
              <div className="pixelpass-step-copy">
                <h2>How many images should be required?</h2>
                <p>A higher threshold demands more images. A lower threshold gives you more room to lose one.</p>
              </div>
              <div className="pixelpass-threshold-visual" aria-hidden="true">
                {Array.from({ length: setupTotal }, (_, index) => (
                  <span className={index < threshold ? "is-required" : ""} key={index}>
                    <ImageIcon />
                    <small>{index + 1}</small>
                  </span>
                ))}
              </div>
              <label className="pixelpass-threshold-control" htmlFor="vault-threshold">
                <span>Required images</span>
                <strong>{threshold} of {setupTotal}</strong>
                <input
                  id="vault-threshold"
                  max={setupTotal}
                  min="2"
                  type="range"
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                />
              </label>
            </div>
          )}

          {setupStep === 3 && (
            <div className="pixelpass-step-content pixelpass-seal-step">
              <div className="pixelpass-step-copy">
                <h2>Seal the vault with your master key.</h2>
                <p>This key protects the encrypted data reconstructed from your images.</p>
              </div>
              <div className="pixelpass-seal-layout">
                <div className="pixelpass-master-key-fields">
                  <label htmlFor="setup-master-key">Master key</label>
                  <input
                    autoFocus
                    autoComplete="new-password"
                    id="setup-master-key"
                    type="password"
                    value={masterKey}
                    onChange={(event) => setMasterKey(event.target.value)}
                  />
                  <label htmlFor="confirm-master-key">Confirm master key</label>
                  <input
                    autoComplete="new-password"
                    id="confirm-master-key"
                    type="password"
                    value={confirmMasterKey}
                    onChange={(event) => setConfirmMasterKey(event.target.value)}
                  />
                  <small>8–16 characters with uppercase, lowercase, number, and symbol.</small>
                </div>
                <div className="pixelpass-vault-summary">
                  <LockKeyhole aria-hidden="true" />
                  <strong>{threshold}-of-{setupTotal} image vault</strong>
                  <span>{setupSource === "sample" ? "PixelPass sample pack" : `${setupTotal} selected covers`}</span>
                  <span>AES-protected before sharing</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="pixelpass-inline-error" role="alert">{error}</div>}
          <div className="pixelpass-step-actions">
            <button disabled={setupStep === 1 || isBusy} type="button" onClick={() => { setError(""); setSetupStep((step) => step - 1) }}>
              <ChevronLeft aria-hidden="true" /> Back
            </button>
            {setupStep < 3 ? (
              <button className="default" type="button" onClick={nextSetupStep}>
                Continue <ChevronRight aria-hidden="true" />
              </button>
            ) : (
              <button className="default" disabled={isBusy} type="submit">
                <LockKeyhole aria-hidden="true" />
                {isBusy ? "Sealing vault…" : "Hide vault inside images"}
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  function renderRecovery() {
    const isReady = recoveryFiles.length >= 2 && recoveryMasterKey.length > 0

    return (
      <div className="pixelpass-guided-flow">
        <div className="pixelpass-flow-heading">
          <button aria-label="Back to start" className="pixelpass-icon-button" type="button" onClick={() => goTo(backendMode === -1 ? "choice" : "unlock")}>
            <ArrowLeft aria-hidden="true" />
          </button>
          <div>
            <h1>Recover a vault from images</h1>
            <p>Choose matching PixelPass PNG shares and use the vault's original master key.</p>
          </div>
        </div>

        <form className="pixelpass-recovery-layout" onSubmit={completeRecovery}>
          <section className="pixelpass-recovery-picker">
            <div className="pixelpass-step-copy">
              <h2>Bring back the images that carried the vault.</h2>
              <p>Choose at least the original recovery threshold. Select every share you still have for the best chance of restoring write access.</p>
            </div>
            <div className="pixelpass-picker-actions">
              <button className="default" disabled={isBusy} type="button" onClick={chooseRecoveryFiles}>
                <Upload aria-hidden="true" /> Choose recovery images
              </button>
            </div>
            {recoveryFiles.length > 0 ? (
              <>
                <PreviewStrip files={recoveryFiles} variant="recovery" />
                <p className="pixelpass-recovery-count">
                  {recoveryFiles.length} PNG {recoveryFiles.length === 1 ? "share" : "shares"} selected
                </p>
              </>
            ) : (
              <div className="pixelpass-recovery-empty"><Images aria-hidden="true" /><span>No recovery images selected yet.</span></div>
            )}
          </section>

          <section className="pixelpass-recovery-result" aria-live="polite">
            <div className={`pixelpass-recovery-readiness${recoveryFiles.length >= 2 ? " is-ready" : ""}`}>
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>{recoveryFiles.length >= 2 ? "Ready to attempt recovery" : "Choose at least two shares"}</strong>
                <span>
                  PixelPass verifies the images and master key together. If fewer than all original shares are available, the recovered vault may be read-only.
                </span>
              </div>
            </div>
            <label htmlFor="recovery-master-key">Master key</label>
            <input
              aria-describedby="recovery-master-key-help"
              autoComplete="current-password"
              disabled={isBusy}
              id="recovery-master-key"
              required
              type="password"
              value={recoveryMasterKey}
              onChange={(event) => setRecoveryMasterKey(event.target.value)}
            />
            <small id="recovery-master-key-help">Enter the existing key exactly as it was created.</small>
            <button className="default" disabled={!isReady || isBusy} type="submit">
              <KeyRound aria-hidden="true" /> {isBusy ? "Rebuilding vault…" : "Rebuild my vault"}
            </button>
          </section>
        </form>
        {error && <div className="pixelpass-inline-error" role="alert">{error}</div>}
      </div>
    )
  }

  function renderCeremony() {
    const stages = ceremonyStages[ceremonyKind]

    return (
      <div className="pixelpass-ceremony" aria-live="polite">
        <div className="pixelpass-ceremony-scene" aria-hidden="true">
          <div className="pixelpass-data-capsule"><LockKeyhole /></div>
          <div className="pixelpass-share-flight">
            {Array.from({ length: 5 }, (_, index) => <span key={index}>{index + 1}</span>)}
          </div>
          <div className="pixelpass-ceremony-images">
            {Array.from({ length: 5 }, (_, index) => <span key={index}><ImageIcon /></span>)}
          </div>
        </div>
        <h1>{ceremonyKind === "setup" ? "Your vault is disappearing into the images." : "Your vault is coming back from the images."}</h1>
        <ol className="pixelpass-ceremony-steps">
          {stages.map((stage, index) => (
            <li className={index < ceremonyStage ? "is-complete" : index === ceremonyStage ? "is-current" : ""} key={stage}>
              <span>{index < ceremonyStage ? <Check /> : index + 1}</span>{stage}
            </li>
          ))}
        </ol>
      </div>
    )
  }

  return (
    <main
      className="pixelpass-page pixelpass-home-page"
      style={{ backgroundImage: `url(${background})`, backgroundPosition: "center", backgroundSize: "cover" }}
    >
      <section className="window active glass pixelpass-flow-window">
        <div className="title-bar">
          <div className="title-bar-text">PixelPass — {screen === "recovery" ? "Image recovery" : screen === "setup" ? "New image vault" : "Welcome"}</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" disabled type="button" />
            <button aria-label="Maximize" disabled type="button" />
            <button aria-label="Close" disabled type="button" />
          </div>
        </div>
        <div className="window-body pixelpass-flow-body">
          {screen === "loading" && <div className="pixelpass-flow-loading"><PawPrint aria-hidden="true" /><strong>Finding your image vault…</strong><div className="marquee" /></div>}
          {screen === "choice" && renderChoice()}
          {screen === "unlock" && renderUnlock()}
          {screen === "setup" && renderSetup()}
          {screen === "recovery" && renderRecovery()}
          {screen === "ceremony" && renderCeremony()}
        </div>
        <div className="status-bar">
          <p className="status-bar-field pixelpass-status-message" role="status" aria-live="polite">
            <PawPrint aria-hidden="true" /> {statusMessage}
          </p>
          <p className="status-bar-field">{backendMode === -1 ? "No local vault" : backendMode === null ? "Checking" : `Mode ${backendMode}`}</p>
        </div>
      </section>
    </main>
  )
}
