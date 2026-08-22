import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
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
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import background from "@/lib/background.jpg"
import logo from "@/lib/logo.png"
import { sendBackendRequest } from "@/lib/backend-client"
import {
  createDemoRecoveryFiles,
  initializeGuidedVault,
  inspectRecoveryImages,
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
  const recoveryInputRef = useRef(null)
  const [backendMode, setBackendMode] = useState(null)
  const [ceremonyKind, setCeremonyKind] = useState("setup")
  const [ceremonyStage, setCeremonyStage] = useState(0)
  const [confirmMasterKey, setConfirmMasterKey] = useState("")
  const [error, setError] = useState("")
  const [inspection, setInspection] = useState(null)
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
        setStatusMessage("Backend unavailable — recovery and passcode prototypes remain available.")
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

  useEffect(
    () => () => {
      recoveryFiles.forEach((file) => {
        if (file.preview?.startsWith("blob:")) URL.revokeObjectURL(file.preview)
      })
    },
    [recoveryFiles],
  )

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

  function receiveRecoveryFiles(event) {
    recoveryFiles.forEach((file) => {
      if (file.preview?.startsWith("blob:")) URL.revokeObjectURL(file.preview)
    })

    const files = Array.from(event.target.files ?? []).map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      preview: URL.createObjectURL(file),
      source: file,
    }))

    setRecoveryFiles(files)
    setInspection(null)
    setError("")
  }

  function loadRecoveryDemo() {
    setRecoveryFiles(createDemoRecoveryFiles())
    setInspection(null)
    setError("")
    setStatusMessage("Five demo recovery images are ready to inspect.")
  }

  async function inspectRecovery() {
    try {
      setIsBusy(true)
      setError("")
      setStatusMessage("Inspecting images for PixelPass shares…")
      const result = await inspectRecoveryImages(recoveryFiles.map((file) => file.source || file))
      setInspection(result)
      setStatusMessage(
        result.hasMixedVaults
          ? "These images contain shares from different vaults — choose one matching set."
          : result.validShares >= result.requiredShares
          ? `${result.validShares} valid shares found — recovery is ready.`
          : `${result.validShares} valid shares found — ${result.requiredShares} are required.`,
      )
    } catch (inspectionError) {
      setInspection(null)
      setError(inspectionError.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function completeRecovery(event) {
    event.preventDefault()
    setError("")

    try {
      setIsBusy(true)
      setStatusMessage("Rebuilding the vault from image shares…")
      const recoveryPromise = recoverVault({ inspection, masterKey: recoveryMasterKey })

      await runCeremony("recovery", async () => {
        const result = await recoveryPromise
        navigate("/dashboard", {
          state: {
            demoMode: result.isStub,
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
            <button disabled={isBusy} type="button" onClick={() => goTo("recovery")}>
              Recover another vault
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
                  <Images aria-hidden="true" /><strong>Sample pack</strong><small>Fastest for a demo</small>
                </button>
                <button aria-pressed={setupSource === "files"} className={setupSource === "files" ? "is-selected" : ""} type="button" onClick={chooseSetupFiles}>
                  <Upload aria-hidden="true" /><strong>Choose files</strong><small>Use your own images</small>
                </button>
                <button aria-pressed={setupSource === "paste"} className={setupSource === "paste" ? "is-selected" : ""} type="button" onClick={() => setSetupSource("paste")}>
                  <ImageIcon aria-hidden="true" /><strong>Paste image</strong><small>Repeat it as covers</small>
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
              <div className="pixelpass-survival-note">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Any {threshold} images can rebuild this vault.</strong>
                  <span>You can lose {setupTotal - threshold} {setupTotal - threshold === 1 ? "image" : "images"} and still recover it.</span>
                </div>
              </div>
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
    const isReady = inspection && !inspection.hasMixedVaults && inspection.validShares >= inspection.requiredShares

    return (
      <div className="pixelpass-guided-flow">
        <div className="pixelpass-flow-heading">
          <button aria-label="Back to start" className="pixelpass-icon-button" type="button" onClick={() => goTo(backendMode === -1 ? "choice" : "unlock")}>
            <ArrowLeft aria-hidden="true" />
          </button>
          <div>
            <h1>Recover a vault from images</h1>
            <p>PixelPass will inspect the pictures, collect matching shares, and rebuild the encrypted vault.</p>
          </div>
          <span className="pixelpass-demo-badge">Frontend demo</span>
        </div>

        <form className="pixelpass-recovery-layout" onSubmit={completeRecovery}>
          <section className="pixelpass-recovery-picker">
            <div className="pixelpass-step-copy">
              <h2>Bring back the images that carried the vault.</h2>
              <p>Choose as many as you have. PixelPass only needs the original recovery threshold.</p>
            </div>
            <input
              accept="image/*"
              className="sr-only"
              multiple
              ref={recoveryInputRef}
              type="file"
              onChange={receiveRecoveryFiles}
            />
            <div className="pixelpass-picker-actions">
              <button className="default" type="button" onClick={() => recoveryInputRef.current?.click()}>
                <Upload aria-hidden="true" /> Choose recovery images
              </button>
              <button type="button" onClick={loadRecoveryDemo}>
                <PawPrint aria-hidden="true" /> Load cat-image demo
              </button>
            </div>
            {recoveryFiles.length > 0 ? (
              <PreviewStrip files={recoveryFiles} variant="recovery" />
            ) : (
              <div className="pixelpass-recovery-empty"><Images aria-hidden="true" /><span>No recovery images selected yet.</span></div>
            )}
            <button disabled={isBusy || recoveryFiles.length === 0} type="button" onClick={inspectRecovery}>
              <RefreshCw aria-hidden="true" /> {isBusy ? "Inspecting images…" : "Inspect selected images"}
            </button>
          </section>

          <section className="pixelpass-recovery-result" aria-live="polite">
            {!inspection ? (
              <div className="pixelpass-result-placeholder">
                <ShieldCheck aria-hidden="true" />
                <strong>Share check waiting</strong>
                <span>Select images, then inspect them before entering the master key.</span>
              </div>
            ) : (
              <>
                <div className={`pixelpass-share-verdict${isReady ? " is-ready" : " is-blocked"}`}>
                  {isReady ? <CheckCircle2 aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                  <div>
                    <strong>{inspection.hasMixedVaults ? "Images from different vaults" : `${inspection.validShares} valid shares found`}</strong>
                    <span>{inspection.hasMixedVaults ? "Choose shares with one matching fingerprint" : `${inspection.requiredShares} matching shares are required`}</span>
                  </div>
                </div>
                <div className="pixelpass-share-meter">
                  {Array.from({ length: inspection.totalShares }, (_, index) => (
                    <span className={index < inspection.validShares ? "is-found" : ""} key={index} />
                  ))}
                </div>
                <dl className="pixelpass-recovery-facts">
                  <div><dt>Vault fingerprint</dt><dd>{inspection.vaultFingerprint || "Mixed vaults"}</dd></div>
                  <div><dt>Invalid images</dt><dd>{inspection.invalidCount}</dd></div>
                  <div><dt>Backend</dt><dd>{inspection.isStub ? "Demo fixture" : "Connected"}</dd></div>
                </dl>
                <label htmlFor="recovery-master-key">Master key</label>
                <input
                  autoComplete="current-password"
                  disabled={!isReady || isBusy}
                  id="recovery-master-key"
                  type="password"
                  value={recoveryMasterKey}
                  onChange={(event) => setRecoveryMasterKey(event.target.value)}
                />
                <button className="default" disabled={!isReady || isBusy || recoveryMasterKey.length < 8} type="submit">
                  <KeyRound aria-hidden="true" /> {isBusy ? "Rebuilding vault…" : "Rebuild my vault"}
                </button>
              </>
            )}
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
