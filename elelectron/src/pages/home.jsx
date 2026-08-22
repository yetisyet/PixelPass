import { useState, useRef, useCallback, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import "7.css/dist/7.scoped.css"

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

// Simplified JS-compatible Windows path validator.
// The original PCRE regex uses atomic groups (?>...) and subroutine calls
// (?&name), neither of which JavaScript's RegExp engine supports - it would
// throw a SyntaxError if compiled as-is. This covers the same practical
// cases: drive-letter paths (C:\...) and UNC paths (\\server\share\...).
const WINDOWS_PATH_REGEX =
    /^(?:[a-zA-Z]:\\|\\\\)(?:[^<>:"/\\|?*\r\n]+\\)*[^<>:"/\\|?*\r\n]*$/

const PNG_FILE_REGEX = /\.png$/i

function filterPngFiles(fileList) {
    return Array.from(fileList).filter((f) => PNG_FILE_REGEX.test(f.name))
}

function Win7Window({
    title,
    pos,
    onMouseDown,
    isMinimized,
    onMinimize,
    onClose,
    width = 320,
    children,
}) {
    return (
        <div
            className="window active"
            style={{
                width,
                maxWidth: "90vw",
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                position: "relative",
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
                    <button aria-label="Minimize" onClick={onMinimize}></button>
                    <button aria-label="Maximize"></button>
                    <button aria-label="Close" onClick={onClose}></button>
                </div>
            </div>
            {!isMinimized && (
                <div className="window-body has-space">{children}</div>
            )}
        </div>
    )
}

export default function Home() {
    // --- Sign in window state ---
    const [showPassword, setShowPassword] = useState(false)
    const [userInput, setUserInput] = useState("")
    const [invalid, setInvalid] = useState("")
    const [isMinimized, setIsMinimized] = useState(false)
    const passwordRegex =
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/
    const { pos, onMouseDown } = useDraggable({ x: 0, y: 0 })

    // --- Image method window state ---
    const [isImageMinimized, setIsImageMinimized] = useState(false)
    const { pos: imagePos, onMouseDown: onImageMouseDown } = useDraggable({
        x: 40,
        y: 40,
    })

    const [imageMethod, setImageMethod] = useState("N/A")
    const [imagePath, setImagePath] = useState("")

    // --- Custom Directory window state ---
    const [showCustomDirWindow, setShowCustomDirWindow] = useState(false)
    const [customDirMinimized, setCustomDirMinimized] = useState(false)
    const [customDirPath, setCustomDirPath] = useState("")
    const [customDirValid, setCustomDirValid] = useState(true)
    const { pos: customDirPos, onMouseDown: onCustomDirMouseDown } =
        useDraggable({ x: 80, y: 80 })

    // --- Upload window state ---
    const [showUploadWindow, setShowUploadWindow] = useState(false)
    const [uploadMinimized, setUploadMinimized] = useState(false)
    const [uploadPath, setUploadPath] = useState("")
    const [uploadPathValid, setUploadPathValid] = useState(true)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [uploadError, setUploadError] = useState("")
    const { pos: uploadPos, onMouseDown: onUploadMouseDown } = useDraggable({
        x: 110,
        y: 110,
    })

    // --- Paste window state ---
    const [showPasteWindow, setShowPasteWindow] = useState(false)
    const [pasteMinimized, setPasteMinimized] = useState(false)
    const [pastedImage, setPastedImage] = useState(null)
    const { pos: pastePos, onMouseDown: onPasteMouseDown } = useDraggable({
        x: 140,
        y: 140,
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!passwordRegex.test(userInput)) {
            setInvalid(
                "Password must be 8–16 characters and contain at least one uppercase letter, lowercase letter, number, and special character."
            )
            return
        }
        setInvalid("")
        console.log("Valid password:", userInput)
    }

    const handleMethodChange = (e) => {
        const value = e.target.value
        setImageMethod(value)

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
            setImagePath("/images")
        } else {
            // N/A
            setImagePath("")
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-background">
            <div className="win7">
                {/* Sign in window */}
                <div
                    className="window active"
                    style={{
                        width: 400,
                        maxWidth: "90vw",
                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                        position: "relative",
                    }}
                >
                    <div
                        className="title-bar"
                        onMouseDown={onMouseDown}
                        style={{ cursor: "grab" }}
                    >
                        <div className="title-bar-text">Sign in</div>
                        <div
                            className="title-bar-controls"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                aria-label="Minimize"
                                onClick={() => setIsMinimized((prev) => !prev)}
                            ></button>
                            <button aria-label="Maximize"></button>
                            <button aria-label="Close"></button>
                        </div>
                    </div>
                    {!isMinimized && (
                        <div className="window-body has-space">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium"
                                    >
                                        Password
                                    </label>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={userInput}
                                            onChange={(e) => {
                                                setUserInput(e.target.value)
                                                setInvalid("")
                                            }}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            style={{ flex: 1, minWidth: 0 }}
                                            className={
                                                invalid
                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                    : ""
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
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
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">
                                                {showPassword
                                                    ? "Hide password"
                                                    : "Show password"}
                                            </span>
                                        </button>
                                    </div>
                                    {invalid && (
                                        <p
                                            className="text-sm text-red-500"
                                            style={{
                                                overflowWrap: "break-word",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {invalid}
                                        </p>
                                    )}
                                </div>

                                <button type="submit" className="w-full">
                                    Sign in
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Image method window */}
                <div
                    className="window active"
                    style={{
                        width: 300,
                        maxWidth: "90vw",
                        transform: `translate(${imagePos.x}px, ${imagePos.y}px)`,
                        position: "relative",
                        marginTop: 24,
                    }}
                >
                    <div
                        className="title-bar"
                        onMouseDown={onImageMouseDown}
                        style={{ cursor: "grab" }}
                    >
                        <div className="title-bar-text">Choose image method</div>
                        <div
                            className="title-bar-controls"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                aria-label="Minimize"
                                onClick={() =>
                                    setIsImageMinimized((prev) => !prev)
                                }
                            ></button>
                            <button aria-label="Maximize"></button>
                            <button aria-label="Close"></button>
                        </div>
                    </div>
                    {!isImageMinimized && (
                        <div className="window-body has-space">
                            <label
                                htmlFor="image"
                                className="text-sm font-medium"
                                style={{ display: "block", marginBottom: 6 }}
                            >
                                Method
                            </label>
                            <select
                                id="image"
                                value={imageMethod}
                                onChange={handleMethodChange}
                            >
                                <option value="N/A">N/A</option>
                                <option value="Paste Image">Paste Image</option>
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

                            {imagePath && (
                                <p
                                    className="text-sm"
                                    style={{
                                        marginTop: 8,
                                        overflowWrap: "break-word",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    Path: {imagePath}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Custom Directory picker window */}
                {showCustomDirWindow && (
                    <Win7Window
                        title="Choose custom directory"
                        pos={customDirPos}
                        onMouseDown={onCustomDirMouseDown}
                        isMinimized={customDirMinimized}
                        onMinimize={() =>
                            setCustomDirMinimized((prev) => !prev)
                        }
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
                                            const folderName = relPath.split("/")[0]
                                            // Browsers don't expose the real absolute
                                            // path - this is a best-effort guess the
                                            // user can correct below.
                                            const fakePath = `C:\\Users\\You\\${folderName}`
                                            setCustomDirPath(fakePath)
                                            setCustomDirValid(
                                                WINDOWS_PATH_REGEX.test(fakePath)
                                            )
                                            setImagePath(fakePath)
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
                                            setImagePath(value)
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
                    </Win7Window>
                )}

                {/* Image upload picker window */}
                {showUploadWindow && (
                    <Win7Window
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
                    </Win7Window>
                )}

                {/* Paste picker window */}
                {showPasteWindow && (
                    <Win7Window
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
                    </Win7Window>
                )}
            </div>
        </main>
    )
}
