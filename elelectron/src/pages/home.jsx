import { useState, useRef, useCallback, useEffect } from "react"
import { KeyRound, PawPrint, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import logo from "../lib/logo.png"
import border from "../lib/pfp_border.png"
import background from "../lib/background.jpg"
import { sendBackendRequest } from "@/lib/backend-client"

// ---------------------------------------------------------------------------
// Draggable window hook (from the 7.css prototype)
// ---------------------------------------------------------------------------
function useDraggable(initialPos = { x: 0, y: 0 }) {
    const [pos, setPos] = useState(initialPos)
    const dragging = useRef(false)
    const offset = useRef({ x: 0, y: 0 })

    const onMouseDown = useCallback(
        (e) => {
            dragging.current = true
            offset.current = {
                x: e.clientX - pos.x,
                y: e.clientY - pos.y,
            }
        },
        [pos]
    )

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current) return
            setPos({
                x: e.clientX - offset.current.x,
                y: e.clientY - offset.current.y,
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

// Simplified JS-compatible Windows path validator (drive-letter and UNC paths).
const WINDOWS_PATH_REGEX =
    /^(?:[a-zA-Z]:\\|\\\\)(?:[^<>:"/\\|?*\r\n]+\\)*[^<>:"/\\|?*\r\n]*$/

function isValidPath(value) {
    return WINDOWS_PATH_REGEX.test(value) || value.startsWith("/")
}

const METHOD_TO_MODE = {
    "Paste Image": 1,
    "Custom Directory": 2,
    "Image/s Upload": 3,
    "Randomly Selected": 4,
    "Recovery Mode": 5,
}

function pastedImagePayload(dataUrl) {
    if (typeof dataUrl !== "string" || !dataUrl.includes(",")) return null

    const [metadata, dataBase64] = dataUrl.split(",", 2)
    const mimeType = metadata.match(/^data:([^;]+)/)?.[1] ?? "image/png"
    return {
        dataBase64,
        mimeType,
        name: "pasted-image.png",
    }
}

// ---------------------------------------------------------------------------
// Generic movable / minimizable window shell, styled to match the
// pixelpass "glass" window used on the home page.
// ---------------------------------------------------------------------------
// Fixed anchor point for the side-panel picker windows. Using `position:
// fixed` (rather than `relative` + translate) takes them out of document
// flow entirely, so opening one never pushes or offsets the main window -
// drag deltas from useDraggable are then layered on top as a pure visual
// offset from this anchor.
const SIDE_PANEL_ANCHOR = { top: 96, left: "min(72vw, 640px)" }

function PixelPassWindow({
    title,
    pos,
    onMouseDown,
    isMinimized,
    onMinimize,
    onClose,
    width = 320,
    className = "",
    statusBar,
    children,
}) {
    return (
        <section
            className={`window active glass pixelpass-floating-window ${className}`}
            style={{
                width,
                maxWidth: "90vw",
                position: "fixed",
                top: SIDE_PANEL_ANCHOR.top,
                left: SIDE_PANEL_ANCHOR.left,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
            }}
        >
            <div
                className="title-bar"
                onMouseDown={onMouseDown}
                style={{ cursor: "grab" }}
            >
                <div className="title-bar-text">{title}</div>
                <div
                    className="title-bar-controls"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <button
                        aria-label="Minimize"
                        type="button"
                        onClick={onMinimize}
                    />
                    <button aria-label="Maximize" disabled type="button" />
                    <button
                        aria-label="Close"
                        type="button"
                        onClick={onClose}
                    />
                </div>
            </div>
            {!isMinimized && (
                <div className="window-body has-space">{children}</div>
            )}
            {!isMinimized && statusBar && (
                <div className="status-bar">{statusBar}</div>
            )}
        </section>
    )
}

export default function Home() {


  const navigate = useNavigate()

    // --- Main "Welcome to PixelPass" window state ---
    const [isMinimized, setIsMinimized] = useState(false)
    const { pos, onMouseDown } = useDraggable({ x: 0, y: 0 })

    // --- Masterkey input state ---
    const [showMasterkey, setShowMasterkey] = useState(false)
    const [masterkey, setMasterkey] = useState("")
    const [masterkeyError, setMasterkeyError] = useState("")
    const [backendMode, setBackendMode] = useState(null)
    const [isBackendLoading, setIsBackendLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [majority, setMajority] = useState("20")
    const [startupError, setStartupError] = useState("")
    const [statusMessage, setStatusMessage] = useState("checking backend config…")
    const [total, setTotal] = useState("24")
    const masterkeyRegex =
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/

    // --- Vault avatar method dropdown ---
    const [avatarMethod, setAvatarMethod] = useState("N/A")
    const [avatarPath, setAvatarPath] = useState("")

    // --- Custom Directory window state ---
    const [showCustomDirWindow, setShowCustomDirWindow] = useState(false)
    const [customDirMinimized, setCustomDirMinimized] = useState(false)
    const [customDirPath, setCustomDirPath] = useState("")
    const [customDirValid, setCustomDirValid] = useState(true)
    const { pos: customDirPos, onMouseDown: onCustomDirMouseDown } =
        useDraggable({ x: 0, y: 0 })

    // --- Upload window state ---
    const [showUploadWindow, setShowUploadWindow] = useState(false)
    const [uploadMinimized, setUploadMinimized] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [uploadError, setUploadError] = useState("")
    const { pos: uploadPos, onMouseDown: onUploadMouseDown } = useDraggable({
        x: 0,
        y: 0,
    })

    // --- Paste window state ---
    const [showPasteWindow, setShowPasteWindow] = useState(false)
    const [pasteMinimized, setPasteMinimized] = useState(false)
    const [pastedImage, setPastedImage] = useState(null)
    const { pos: pastePos, onMouseDown: onPasteMouseDown } = useDraggable({
        x: 0,
        y: 0,
    })

    // --- Missing-config notification window state ---
    const [showNoConfigWindow, setShowNoConfigWindow] = useState(false)
    const [noConfigMinimized, setNoConfigMinimized] = useState(false)
    const { pos: noConfigPos, onMouseDown: onNoConfigMouseDown } =
        useDraggable({ x: -260, y: 130 })

    function initializationData() {
        const selectedMode = METHOD_TO_MODE[avatarMethod]

        if (selectedMode === 1 || selectedMode === 5) {
            const image = pastedImagePayload(pastedImage)
            if (!image) throw new Error("Paste an image before initializing.")
            return {
                data: [image.dataBase64],
                mode: selectedMode,
            }
        }

        if (selectedMode === 2) {
            if (!customDirPath || !isValidPath(customDirPath)) {
                throw new Error("Choose or enter a valid directory path.")
            }
            return {
                mode: selectedMode,
                path: customDirPath,
            }
        }

        if (selectedMode === 3) {
            if (uploadedFiles.length === 0) {
                throw new Error("Choose at least one image path.")
            }
            return {
                mode: selectedMode,
                paths: uploadedFiles,
            }
        }

        if (selectedMode === 4) {
            return { mode: selectedMode }
        }

        throw new Error("Choose a vault avatar method first.")
    }

    async function handleUnlock(event) {
        event.preventDefault()
        setMasterkeyError("")

        if (isBackendLoading || backendMode === null) {
            setMasterkeyError("Wait for the backend config check to finish.")
            return
        }

        if (!masterkeyRegex.test(masterkey)) {
            setMasterkeyError(
                "Masterkey must be 8–16 characters and include an uppercase letter, lowercase letter, number, and special character."
            )
            return
        }

        try {
            setIsSubmitting(true)
            let response

            if (backendMode === -1) {
                const initialization = initializationData()
                const parsedMajority = Number(majority)
                const parsedTotal = Number(total)

                if (!Number.isInteger(parsedMajority) || parsedMajority < 2) {
                    throw new Error("Majority must be a whole number of at least 2.")
                }
                if (!Number.isInteger(parsedTotal) || parsedTotal < 2) {
                    throw new Error("Total must be a whole number of at least 2.")
                }
                if (parsedTotal > 24) {
                    throw new Error("Total cannot exceed 24.")
                }
                if (parsedMajority > parsedTotal) {
                    throw new Error("Majority cannot be greater than Total.")
                }

                response = await sendBackendRequest({
                    ...initialization,
                    majority: parsedMajority,
                    password: masterkey,
                    total: parsedTotal,
                })
            } else {
                response = await sendBackendRequest({
                    password: masterkey,
                })
            }

            if (!response.success) {
                throw new Error(response.error ?? "The backend rejected the request.")
            }

            console.info(
                backendMode === -1
                    ? `works — initialized mode ${response.Mode}`
                    : `works — config found for mode ${backendMode}`
            )
            setStatusMessage("works — backend received the request ^w^")
            navigate("/dashboard")
        } catch (error) {
            setMasterkeyError(error.message)
            setStatusMessage("backend request failed T~T")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function chooseDirectory() {
        const selectedPath = await window.pixelPassBackend?.selectDirectory?.()
        if (!selectedPath) return

        setCustomDirPath(selectedPath)
        setCustomDirValid(true)
        setAvatarPath(selectedPath)
    }

    async function chooseImagePaths() {
        const selectedPaths =
            await window.pixelPassBackend?.selectImagePaths?.()
        if (!Array.isArray(selectedPaths) || selectedPaths.length === 0) return

        setUploadedFiles(selectedPaths)
        setUploadError("")
    }

    const handleAvatarMethodChange = (e) => {
        const value = e.target.value
        setAvatarMethod(value)

        // close any picker window that might already be open
        setShowCustomDirWindow(false)
        setShowUploadWindow(false)
        setShowPasteWindow(false)

        if (value === "Custom Directory") {
            setShowCustomDirWindow(true)
            setCustomDirMinimized(false)
        } else if (value === "Image/s Upload") {
            setShowUploadWindow(true)
            setUploadMinimized(false)
        } else if (value === "Paste Image" || value === "Recovery Mode") {
            setShowPasteWindow(true)
            setPasteMinimized(false)
        } else if (value === "Randomly Selected") {
            setAvatarPath("/avatars")
        } else {
            // N/A
            setAvatarPath("")
        }
    }
    useEffect(() => {
        let active = true

        async function receiveStartupMode() {
            try {
                const startup = await window.pixelPassBackend?.startup?.()
                if (
                    !startup ||
                    !Number.isInteger(startup.mode) ||
                    (startup.mode !== -1 &&
                        (startup.mode < 1 || startup.mode > 5))
                ) {
                    throw new Error("Backend returned an invalid startup mode.")
                }
                if (!active) return

                setBackendMode(startup.mode)
                setShowNoConfigWindow(startup.mode === -1)
                setStatusMessage(
                    startup.mode === -1
                        ? "no config found — initialization required"
                        : `config found — mode ${startup.mode}`
                )

                if (startup.mode !== -1) {
                    console.info(`Config found — mode ${startup.mode}`)
                }
            } catch (error) {
                if (!active) return
                setStartupError(error.message)
                setStatusMessage("could not read backend config T~T")
            } finally {
                if (active) setIsBackendLoading(false)
            }
        }

        receiveStartupMode()
        return () => {
            active = false
        }
    }, [])
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
            {/* Main window */}
            <section
                className="window active glass pixelpass-home-window"
                style={{
                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                    position: "relative",
                }}
            >
                <div
                    className="title-bar"
                    onMouseDown={onMouseDown}
                    style={{ cursor: "grab" }}
                >
                    <div className="title-bar-text">Welcome to PixelPass</div>
                    <div
                        className="title-bar-controls"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <button
                            aria-label="Minimize"
                            type="button"
                            onClick={() => setIsMinimized((prev) => !prev)}
                        />
                        <button aria-label="Maximize" disabled type="button" />
                        <button aria-label="Close" disabled type="button" />
                    </div>
                </div>

                {!isMinimized && (
                    <div className="window-body has-space pixelpass-home-body">
                        <div className="pixelpass-home-art" aria-hidden="true">
                            <img
                                src={logo}
                                alt=""
                                className="pixelpass-home-logo"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                  objectFit: "contain",
                                  marginRight: "3em",
                                }}
                            />
                        </div>
                        <div className="pixelpass-home-copy">
                            <p className="pixelpass-eyebrow">ur cozy password den</p>
                            <h1>Hi this is meow's house</h1>
                            <p>
                                keep ur logins tucked away, then reveal and copy
                                them only when u need them nyah ^w^
                            </p>

                            {startupError && (
                                <p className="text-sm text-red-500" role="alert">
                                    {startupError}
                                </p>
                            )}

                            {!isBackendLoading && !startupError && backendMode !== null && (
                                <p className="text-sm" role="status">
                                    {backendMode === -1
                                        ? "No config found — choose an initialization method below."
                                        : `Config found — mode ${backendMode}. Enter your masterkey to continue.`}
                                </p>
                            )}

                            <form
                                onSubmit={handleUnlock}
                                className="space-y-4 pixelpass-masterkey-form"
                            >
                                <div className="space-y-2">
                                    <label
                                        htmlFor="masterkey"
                                        className="text-sm font-medium"
                                    >
                                        Masterkey
                                    </label>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <input
                                            disabled={isBackendLoading || isSubmitting || Boolean(startupError)}
                                            id="masterkey"
                                            type={
                                                showMasterkey
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={masterkey}
                                            onChange={(e) => {
                                                setMasterkey(e.target.value)
                                                setMasterkeyError("")
                                            }}
                                            placeholder="Enter your masterkey"
                                            autoComplete="current-password"
                                            style={{ flex: 1, minWidth: 0 }}
                                        />
                                        <button
                                            disabled={isBackendLoading || isSubmitting || Boolean(startupError)}
                                            type="button"
                                            onClick={() =>
                                                setShowMasterkey(
                                                    (prev) => !prev
                                                )
                                            }
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "none",
                                                border: "none",
                                                padding: 2,
                                                minWidth: 0,
                                                flexShrink: 0,
                                                boxShadow: "none",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {showMasterkey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">
                                                {showMasterkey
                                                    ? "Hide masterkey"
                                                    : "Show masterkey"}
                                            </span>
                                        </button>
                                    </div>
                                    {masterkeyError && (
                                        <p
                                            className="text-sm text-red-500"
                                            style={{
                                                overflowWrap: "break-word",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {masterkeyError}
                                        </p>
                                    )}
                                </div>

                                {backendMode === -1 && (
                                    <div
                                        className="space-y-2"
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 8,
                                        }}
                                    >
                                        <label className="text-sm font-medium">
                                            Majority
                                            <input
                                                disabled={isSubmitting}
                                                max="24"
                                                min="2"
                                                required
                                                type="number"
                                                value={majority}
                                                onChange={(event) =>
                                                    setMajority(event.target.value)
                                                }
                                                style={{ display: "block", width: "100%" }}
                                            />
                                        </label>
                                        <label className="text-sm font-medium">
                                            Total
                                            <input
                                                disabled={isSubmitting}
                                                max="24"
                                                min="2"
                                                required
                                                type="number"
                                                value={total}
                                                onChange={(event) =>
                                                    setTotal(event.target.value)
                                                }
                                                style={{ display: "block", width: "100%" }}
                                            />
                                        </label>
                                    </div>
                                )}

                                {backendMode === -1 && (
                                    <div className="space-y-2">
                                        <label
                                            htmlFor="avatar-method"
                                            className="text-sm font-medium"
                                            style={{ display: "block" }}
                                        >
                                            Vault avatar
                                        </label>
                                        <select
                                            id="avatar-method"
                                            value={avatarMethod}
                                            onChange={handleAvatarMethodChange}
                                        >
                                            <option value="N/A">N/A</option>
                                            <option value="Paste Image">
                                                Paste Image
                                            </option>
                                            <option value="Custom Directory">
                                                Custom Directory
                                            </option>
                                            <option value="Image/s Upload">
                                                Image/s Upload
                                            </option>
                                            <option value="Randomly Selected">
                                                Randomly Selected
                                            </option>
                                            <option value="Recovery Mode">
                                                Recovery Mode
                                            </option>
                                        </select>
                                        {avatarPath && (
                                            <p
                                                className="text-sm"
                                                style={{
                                                    overflowWrap: "break-word",
                                                    wordBreak: "break-word",
                                                }}
                                            >
                                                Path: {avatarPath}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="pixelpass-home-actions">
                                    <button
                                        className="default"
                                        disabled={isBackendLoading || isSubmitting || Boolean(startupError)}
                                        type="submit"
                                    >
                                        <KeyRound aria-hidden="true" />
                                        {isSubmitting
                                            ? "Sending…"
                                            : backendMode === -1
                                                ? "Initialize the vault"
                                                : "Open the vault >w<"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {!isMinimized && (
                    <div className="status-bar">
                        <p
                            aria-live="polite"
                            className="status-bar-field pixelpass-status-message"
                            role="status"
                        >
                            <PawPrint aria-hidden="true" />
                            {statusMessage}
                        </p>
                    </div>
                )}
            </section>

            {/* First-run configuration notice */}
            {showNoConfigWindow && (
                <PixelPassWindow
                    title="PixelPass setup required"
                    pos={noConfigPos}
                    onMouseDown={onNoConfigMouseDown}
                    isMinimized={noConfigMinimized}
                    onMinimize={() => setNoConfigMinimized((prev) => !prev)}
                    onClose={() => setShowNoConfigWindow(false)}
                    width={360}
                    statusBar={
                        <p className="status-bar-field">
                            backend returned mode -1
                        </p>
                    }
                >
                    <div className="space-y-4">
                        <strong>No config found</strong>
                        <p>
                            Choose a vault avatar method in the main window.
                            Each dropdown option tests one initialization mode.
                        </p>
                        <ul>
                            <li>Paste Image — mode 1</li>
                            <li>Custom Directory — mode 2</li>
                            <li>Image/s Upload — mode 3</li>
                            <li>Randomly Selected — mode 4</li>
                            <li>Recovery Mode — mode 5</li>
                        </ul>
                        <button
                            className="default"
                            type="button"
                            onClick={() => setShowNoConfigWindow(false)}
                        >
                            Choose a mode
                        </button>
                    </div>
                </PixelPassWindow>
            )}

            {/* Custom Directory picker window */}
            {showCustomDirWindow && (
                <PixelPassWindow
                    title="Choose custom directory"
                    pos={customDirPos}
                    onMouseDown={onCustomDirMouseDown}
                    isMinimized={customDirMinimized}
                    onMinimize={() => setCustomDirMinimized((prev) => !prev)}
                    onClose={() => setShowCustomDirWindow(false)}
                    width={380}
                >
                    <div className="space-y-4">
                        <button
                            type="button"
                            className="default"
                            onClick={chooseDirectory}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            Browse...
                        </button>

                        <div className="space-y-2">
                            <label
                                htmlFor="custom-dir-path"
                                className="text-sm font-medium"
                                style={{ display: "block" }}
                            >
                                Or enter a path manually
                            </label>
                            <input
                                id="custom-dir-path"
                                type="text"
                                value={customDirPath}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setCustomDirPath(value)
                                    const valid =
                                        value === "" || isValidPath(value)
                                    setCustomDirValid(valid)
                                    if (valid && value !== "")
                                        setAvatarPath(value)
                                }}
                                placeholder="C:\\Users\\You\\Pictures"
                                style={{ width: "100%" }}
                            />
                            {!customDirValid && (
                                <p
                                    className="text-sm text-red-500"
                                    style={{
                                        overflowWrap: "break-word",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    That doesn't look like a valid directory path.
                                </p>
                            )}
                        </div>
                    </div>
                </PixelPassWindow>
            )}

            {/* Image upload picker window */}
            {showUploadWindow && (
                <PixelPassWindow
                    title="Upload image(s)"
                    pos={uploadPos}
                    onMouseDown={onUploadMouseDown}
                    isMinimized={uploadMinimized}
                    onMinimize={() => setUploadMinimized((prev) => !prev)}
                    onClose={() => setShowUploadWindow(false)}
                    width={380}
                >
                    <div className="space-y-4">
                        <button
                            type="button"
                            className="default"
                            onClick={chooseImagePaths}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            Browse...
                        </button>

                        {uploadedFiles.length > 0 && (
                            <ul
                                className="tree-view has-container"
                                style={{ maxHeight: 160, overflow: "auto" }}
                            >
                                {uploadedFiles.map((path) => (
                                    <li key={path}>{path}</li>
                                ))}
                            </ul>
                        )}
                        {uploadError && (
                            <p
                                className="text-sm text-red-500"
                                style={{
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                }}
                            >
                                {uploadError}
                            </p>
                        )}
                    </div>
                </PixelPassWindow>
            )}

            {/* Paste picker window */}
            {showPasteWindow && (
                <PixelPassWindow
                    title="Paste image"
                    pos={pastePos}
                    onMouseDown={onPasteMouseDown}
                    isMinimized={pasteMinimized}
                    onMinimize={() => setPasteMinimized((prev) => !prev)}
                    onClose={() => setShowPasteWindow(false)}
                    width={340}
                >
                    <div className="space-y-4">
                        <label
                            htmlFor="paste-box"
                            className="text-sm font-medium"
                            style={{ display: "block" }}
                        >
                            Click below, then press Ctrl+V to paste an image
                        </label>
                        <div
                            id="paste-box"
                            tabIndex={0}
                            onPaste={(e) => {
                                const items = e.clipboardData?.items
                                if (!items) return
                                for (const item of items) {
                                    if (item.type.startsWith("image/")) {
                                        const file = item.getAsFile()
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onload = () =>
                                                setPastedImage(reader.result)
                                            reader.readAsDataURL(file)
                                        }
                                        break
                                    }
                                }
                            }}
                            style={{
                                border: "1px dashed #999",
                                borderRadius: 2,
                                minHeight: 120,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 8,
                                outline: "none",
                            }}
                        >
                            {pastedImage ? (
                                <img
                                    src={pastedImage}
                                    alt="Pasted"
                                    style={{ maxWidth: "100%", maxHeight: 200 }}
                                />
                            ) : (
                                <span
                                    className="text-sm"
                                    style={{ color: "#666" }}
                                >
                                    No image pasted yet
                                </span>
                            )}
                        </div>
                    </div>
                </PixelPassWindow>
            )}
        </main>
    )
}
