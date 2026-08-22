import { useState, useRef, useCallback, useEffect } from "react"
import { KeyRound, PawPrint, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import logo from "../lib/logo.png"
import border from "../lib/pfp_border.png"
import background from "../lib/background.jpg"

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

const PNG_FILE_REGEX = /\.png$/i

function filterPngFiles(fileList) {
    return Array.from(fileList).filter((f) => PNG_FILE_REGEX.test(f.name))
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
    const masterkeyRegex =
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/

    const handleUnlock = (e) => {
        e.preventDefault()
        if (!masterkeyRegex.test(masterkey)) {
            setMasterkeyError(
                "Masterkey must be 8–16 characters and include an uppercase letter, lowercase letter, number, and special character."
            )
            return
        }
        setMasterkeyError("")
        navigate("/dashboard")
    }

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
        } else if (value === "Paste Image") {
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

                                <div className="pixelpass-home-actions">
                                    <button
                                        className="default"
                                        type="submit"
                                    >
                                        <KeyRound aria-hidden="true" />
                                        Open the vault &gt;w&lt;
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
                            ready for headpats & passwords &gt;///&lt;
                        </p>
                    </div>
                )}
            </section>

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
                        <label
                            role="button"
                            tabIndex={0}
                            className="default"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <input
                                type="file"
                                webkitdirectory=""
                                directory=""
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    const files = e.target.files
                                    if (files && files.length > 0) {
                                        const relPath =
                                            files[0].webkitRelativePath ||
                                            files[0].name
                                        const folderName =
                                            relPath.split("/")[0]
                                        // Browsers don't expose the real absolute
                                        // path - this is a best-effort guess the
                                        // user can correct below.
                                        const fakePath = `C:\\Users\\You\\${folderName}`
                                        setCustomDirPath(fakePath)
                                        setCustomDirValid(
                                            WINDOWS_PATH_REGEX.test(fakePath)
                                        )
                                        setAvatarPath(fakePath)
                                    }
                                }}
                            />
                            Browse...
                        </label>

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
                                        value === "" ||
                                        WINDOWS_PATH_REGEX.test(value)
                                    setCustomDirValid(valid)
                                    if (valid && value !== "")
                                        setAvatarPath(value)
                                }}
                                placeholder="C:\Users\You\Pictures"
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
                                    That doesn't look like a valid Windows path.
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
                        <label
                            role="button"
                            tabIndex={0}
                            className="default"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <input
                                type="file"
                                accept=".png,image/png"
                                multiple
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    const files = e.target.files
                                    if (!files) return
                                    const valid = filterPngFiles(files)
                                    const rejected = files.length - valid.length
                                    setUploadedFiles(valid.map((f) => f.name))
                                    setUploadError(
                                        rejected > 0
                                            ? `${rejected} file(s) skipped - only .png files are allowed.`
                                            : ""
                                    )
                                }}
                            />
                            Browse...
                        </label>

                        {uploadedFiles.length > 0 && (
                            <ul
                                className="tree-view has-container"
                                style={{ maxHeight: 160, overflow: "auto" }}
                            >
                                {uploadedFiles.map((name) => (
                                    <li key={name}>{name}</li>
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
