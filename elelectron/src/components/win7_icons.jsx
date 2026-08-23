import { forwardRef, useId } from "react"

function IconArtwork({ name, gradients }) {
  const commonStroke = {
    stroke: "#244c63",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 1.25,
  }

  switch (name) {
    case "home":
      return (
        <>
          <path d="M4 14.5 16 4l12 10.5-2.5 2.6L16 8.8l-9.5 8.3Z" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <path d="M7.5 15.2 16 8l8.5 7.2V27h-6v-7h-5v7h-6Z" fill={`url(#${gradients.gold})`} {...commonStroke} />
          <path d="M9.2 16.2 16 10.4l6.8 5.8" fill="none" stroke="#fff" strokeOpacity=".72" />
        </>
      )
    case "key":
      return (
        <>
          <circle cx="10.5" cy="12" r="6.2" fill={`url(#${gradients.gold})`} {...commonStroke} />
          <circle cx="10.5" cy="12" r="2.5" fill="#fff7c7" stroke="#8f650b" strokeWidth="1.1" />
          <path d="m15 16 12 11M20 21l3-3M23 24l3-3" fill="none" stroke="#94620a" strokeLinecap="round" strokeWidth="4.2" />
          <path d="m15.4 15.4 11.8 11.8" fill="none" stroke="#ffe889" strokeLinecap="round" strokeWidth="1.4" />
        </>
      )
    case "paw":
      return (
        <>
          <ellipse cx="16" cy="20.5" rx="7.5" ry="6.2" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="7.3" cy="13" r="3.1" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="13" cy="8.4" r="3.2" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="20" cy="8.4" r="3.2" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="25.3" cy="13.3" r="3" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <path d="M11 19c2.8-2.6 7.2-2.8 10 0" fill="none" stroke="#fff" strokeOpacity=".72" strokeWidth="1.3" />
        </>
      )
    case "back":
      return <path d="M14 5 3.5 16 14 27v-6h14V11H14Z" fill={`url(#${gradients.blue})`} {...commonStroke} />
    case "next":
      return <path d="m10 5 11 11-11 11-3.2-3.2 7.7-7.8-7.7-7.8Z" fill={`url(#${gradients.blue})`} {...commonStroke} />
    case "check":
      return (
        <>
          <circle cx="16" cy="16" r="12.3" fill={`url(#${gradients.green})`} {...commonStroke} />
          <path d="m9.2 16.3 4.2 4.3 9.5-10" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.3" />
        </>
      )
    case "image":
      return (
        <>
          <rect x="4" y="5" width="24" height="22" rx="2" fill="#f8fbfd" {...commonStroke} />
          <rect x="6.5" y="7.5" width="19" height="16.5" fill={`url(#${gradients.blue})`} stroke="#6f96a9" />
          <circle cx="20.7" cy="11.5" r="2.2" fill={`url(#${gradients.gold})`} />
          <path d="m7 22 6.1-7 3.8 3.5 3-2.6 5.5 6.1Z" fill={`url(#${gradients.green})`} stroke="#39734a" strokeWidth=".8" />
        </>
      )
    case "images":
      return (
        <>
          <rect x="7" y="3" width="21" height="19" rx="2" fill="#d9e8ef" stroke="#7895a5" strokeWidth="1.1" />
          <rect x="3.5" y="8" width="22" height="20" rx="2" fill="#f8fbfd" {...commonStroke} />
          <rect x="6" y="10.5" width="17" height="14.5" fill={`url(#${gradients.blue})`} stroke="#6f96a9" />
          <circle cx="18.5" cy="14" r="2" fill={`url(#${gradients.gold})`} />
          <path d="m6.5 23 5-6 3.5 3 2.7-2.2 4.8 5.2Z" fill={`url(#${gradients.green})`} />
        </>
      )
    case "refresh":
      return (
        <>
          <path d="M25.5 14A10 10 0 0 0 8.4 8.6L5 5.5v9h9l-3-3a6.2 6.2 0 0 1 10.8 2.5Z" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <path d="M6.5 18A10 10 0 0 0 23.6 23.4l3.4 3.1v-9h-9l3 3A6.2 6.2 0 0 1 10.2 18Z" fill={`url(#${gradients.green})`} {...commonStroke} />
        </>
      )
    case "lock":
      return (
        <>
          <path d="M9 14V9.5a7 7 0 0 1 14 0V14h-3.5V9.7a3.5 3.5 0 0 0-7 0V14Z" fill={`url(#${gradients.steel})`} {...commonStroke} />
          <rect x="6" y="13" width="20" height="15" rx="2.5" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="16" cy="19.3" r="2.2" fill="#fff5a6" stroke="#76530b" strokeWidth=".9" />
          <path d="M16 21v3.3" stroke="#76530b" strokeLinecap="round" strokeWidth="1.8" />
        </>
      )
    case "shield":
      return (
        <>
          <path d="M16 3.5c4.4 3.1 8 3.6 11 3.8v8.4c0 6.5-4.3 10.7-11 13-6.7-2.3-11-6.5-11-13V7.3c3-.2 6.6-.7 11-3.8Z" fill="#eaf5fa" {...commonStroke} />
          <path d="M15.5 6.4v9.1H7.8V9.4c2.5-.4 5.1-1.3 7.7-3Z" fill={`url(#${gradients.blue})`} />
          <path d="M16.5 6.4v9.1h7.7V9.4c-2.5-.4-5.1-1.3-7.7-3Z" fill={`url(#${gradients.green})`} />
          <path d="M15.5 16.5v8.9c-4.6-2.1-7.2-5-7.6-8.9Z" fill={`url(#${gradients.gold})`} />
          <path d="M16.5 16.5v8.9c4.6-2.1 7.2-5 7.6-8.9Z" fill={`url(#${gradients.red})`} />
        </>
      )
    case "upload":
      return (
        <>
          <path d="M3.5 10h9l2-3h14v19h-25Z" fill={`url(#${gradients.gold})`} {...commonStroke} />
          <path d="m16 22V11m-5 5 5-5 5 5" fill="none" stroke="#167344" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <path d="m16 21V12" stroke="#dfffe7" strokeLinecap="round" strokeWidth="1" />
        </>
      )
    case "book":
      return (
        <>
          <path d="M5 5.5h10.8v22H6.5A2.5 2.5 0 0 1 4 25V7a1.5 1.5 0 0 1 1-1.5Z" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <path d="M16.2 5.5H27A1.5 1.5 0 0 1 28 7v18a2.5 2.5 0 0 0-2.5-2.5h-9.3Z" fill="#eff9fd" {...commonStroke} />
          <path d="M18.5 10h6M18.5 14h6M18.5 18h5" stroke="#80a9bb" />
        </>
      )
    case "eye":
    case "eye-off":
      return (
        <>
          <path d="M3.5 16S8.2 8.3 16 8.3 28.5 16 28.5 16 23.8 23.7 16 23.7 3.5 16 3.5 16Z" fill="#edf9fd" {...commonStroke} />
          <circle cx="16" cy="16" r="5.5" fill={`url(#${gradients.blue})`} stroke="#285b77" />
          <circle cx="16" cy="16" r="2.3" fill="#153a4e" />
          <circle cx="14.3" cy="14.2" r="1" fill="#fff" />
          {name === "eye-off" && <path d="M5 5 27 27" stroke="#b52e24" strokeLinecap="round" strokeWidth="3" />}
        </>
      )
    case "flask":
      return (
        <>
          <path d="M11 4h10M13 4v8L6.5 25a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L19 12V4" fill="#eef9fd" {...commonStroke} />
          <path d="M9.2 23h13.6l-3.2-6.4h-7.2Z" fill={`url(#${gradients.green})`} stroke="#3f7c4d" />
          <circle cx="17" cy="21" r="1.2" fill="#eaffd7" />
        </>
      )
    case "pencil":
      return (
        <>
          <path d="m6 23 2.3-7L21 3.3a2.3 2.3 0 0 1 3.2 0l4.5 4.5a2.3 2.3 0 0 1 0 3.2L16 23.7 9 26Z" fill={`url(#${gradients.gold})`} {...commonStroke} />
          <path d="m19 5.5 7.5 7.5M8.3 16l7.7 7.7" stroke="#aa6a12" strokeWidth="1.2" />
          <path d="m6 23 3 3-4.2 1.2Z" fill="#445b68" />
        </>
      )
    case "plus":
      return (
        <>
          <circle cx="16" cy="16" r="12" fill={`url(#${gradients.green})`} {...commonStroke} />
          <path d="M16 9v14M9 16h14" stroke="#fff" strokeLinecap="round" strokeWidth="3.5" />
        </>
      )
    case "search":
      return (
        <>
          <circle cx="13.5" cy="13.5" r="8.5" fill="#eaf8fd" stroke="#317797" strokeWidth="2.5" />
          <path d="m19.8 19.8 8 8" stroke="#31576b" strokeLinecap="round" strokeWidth="4" />
          <path d="M8.8 10.5a6 6 0 0 1 4.7-2.2" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.7" />
        </>
      )
    case "star":
      return <path d="m16 3.2 4 8 8.8 1.3-6.4 6.2 1.5 8.8-7.9-4.2-7.9 4.2 1.5-8.8-6.4-6.2 8.8-1.3Z" fill={`url(#${gradients.gold})`} stroke="#94620a" strokeLinejoin="round" strokeWidth="1.3" />
    case "x":
      return (
        <>
          <circle cx="16" cy="16" r="12" fill={`url(#${gradients.red})`} {...commonStroke} />
          <path d="m10 10 12 12m0-12L10 22" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
        </>
      )
    case "clock":
      return (
        <>
          <circle cx="16" cy="16" r="12" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="16" cy="16" r="8.6" fill="#f9fdff" stroke="#6d9bb1" />
          <path d="M16 10v6l4.3 3" fill="none" stroke="#28536a" strokeLinecap="round" strokeWidth="2" />
          <circle cx="16" cy="16" r="1.5" fill="#28536a" />
        </>
      )
    case "copy":
      return (
        <>
          <rect x="9" y="5" width="17" height="20" rx="1.8" fill="#dbeaf1" stroke="#7893a1" />
          <rect x="5" y="9" width="17" height="19" rx="1.8" fill="#fff" {...commonStroke} />
          <path d="M8.5 14h10M8.5 18h10M8.5 22h7" stroke="#79a6b9" />
        </>
      )
    case "trash":
      return (
        <>
          <path d="M8 10h16l-1.5 18h-13Z" fill={`url(#${gradients.steel})`} {...commonStroke} />
          <path d="M6 8h20M12 8V4h8v4M12 13v10M16 13v10M20 13v10" fill="none" stroke="#315a6e" strokeLinecap="round" strokeWidth="1.5" />
        </>
      )
    case "warning":
      return (
        <>
          <path d="M16 3 29 27H3Z" fill={`url(#${gradients.gold})`} stroke="#8e5f0e" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M16 10v9" stroke="#704b08" strokeLinecap="round" strokeWidth="3" />
          <circle cx="16" cy="23" r="1.7" fill="#704b08" />
        </>
      )
    case "info":
      return (
        <>
          <circle cx="16" cy="16" r="12" fill={`url(#${gradients.blue})`} {...commonStroke} />
          <circle cx="16" cy="10" r="1.8" fill="#fff" />
          <path d="M16 14v9" stroke="#fff" strokeLinecap="round" strokeWidth="3" />
        </>
      )
    case "loader":
      return (
        <>
          <circle cx="16" cy="16" r="10" fill="none" stroke="#c7dce6" strokeWidth="4" />
          <path d="M16 6a10 10 0 0 1 9.5 7" fill="none" stroke="#287da5" strokeLinecap="round" strokeWidth="4" />
        </>
      )
    default:
      return <IconArtwork name="shield" gradients={gradients} />
  }
}

const Win7Icon = forwardRef(function Win7Icon(
  { className = "", fill: _fill, name, size = 24, ...props },
  ref,
) {
  const iconId = useId().replaceAll(":", "")
  const gradients = {
    blue: `win7-blue-${iconId}`,
    gold: `win7-gold-${iconId}`,
    green: `win7-green-${iconId}`,
    red: `win7-red-${iconId}`,
    steel: `win7-steel-${iconId}`,
  }

  return (
    <svg
      className={`pixelpass-win7-icon${className ? ` ${className}` : ""}`}
      fill="none"
      height={size}
      ref={ref}
      viewBox="0 0 32 32"
      width={size}
      {...props}
    >
      <defs>
        <linearGradient id={gradients.blue} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#d9f7ff" />
          <stop offset=".48" stopColor="#55b7df" />
          <stop offset=".52" stopColor="#2486b7" />
          <stop offset="1" stopColor="#0c5d90" />
        </linearGradient>
        <linearGradient id={gradients.green} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#e7ffd7" />
          <stop offset=".48" stopColor="#78c965" />
          <stop offset=".52" stopColor="#4c9b54" />
          <stop offset="1" stopColor="#2d713c" />
        </linearGradient>
        <linearGradient id={gradients.gold} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#fff8b8" />
          <stop offset=".48" stopColor="#f3c54c" />
          <stop offset=".52" stopColor="#dc981c" />
          <stop offset="1" stopColor="#a6630b" />
        </linearGradient>
        <linearGradient id={gradients.red} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#ffd7cf" />
          <stop offset=".48" stopColor="#ed7565" />
          <stop offset=".52" stopColor="#c94539" />
          <stop offset="1" stopColor="#92261f" />
        </linearGradient>
        <linearGradient id={gradients.steel} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#f7fdff" />
          <stop offset=".48" stopColor="#b9d0da" />
          <stop offset=".52" stopColor="#829daa" />
          <stop offset="1" stopColor="#526d7b" />
        </linearGradient>
      </defs>
      <IconArtwork gradients={gradients} name={name} />
    </svg>
  )
})

function icon(name) {
  return forwardRef(function NamedWin7Icon(props, ref) {
    return <Win7Icon name={name} ref={ref} {...props} />
  })
}

export const AlertTriangle = icon("warning")
export const ArrowLeft = icon("back")
export const BookOpen = icon("book")
export const Check = icon("check")
export const ChevronLeft = icon("back")
export const ChevronRight = icon("next")
export const CircleCheckIcon = icon("check")
export const Clock3 = icon("clock")
export const Copy = icon("copy")
export const Eye = icon("eye")
export const EyeOff = icon("eye-off")
export const FlaskConical = icon("flask")
export const HomeIcon = icon("home")
export const ImageIcon = icon("image")
export const Images = icon("images")
export const InfoIcon = icon("info")
export const KeyRound = icon("key")
export const Loader2Icon = icon("loader")
export const Lock = icon("lock")
export const LockKeyhole = icon("lock")
export const OctagonXIcon = icon("x")
export const PawPrint = icon("paw")
export const Pencil = icon("pencil")
export const Plus = icon("plus")
export const RefreshCw = icon("refresh")
export const Search = icon("search")
export const ShieldCheck = icon("shield")
export const Star = icon("star")
export const Trash2 = icon("trash")
export const TriangleAlertIcon = icon("warning")
export const Upload = icon("upload")
export const X = icon("x")
export const XIcon = icon("x")
