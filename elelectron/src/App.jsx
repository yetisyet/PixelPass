import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { HomeIcon, KeyRound, PawPrint } from "lucide-react"
import logo from "./lib/logo.png"
import Dashboard from "@/pages/dashboard"
import Home from "@/pages/home"
import NotFound from "@/pages/notfound"

const navigation = [
  { label: "Home", path: "/", Icon: HomeIcon },
  { label: "Vault", path: "/dashboard", Icon: KeyRound },
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="win7 pixelpass-desktop">
      <nav aria-label="Primary" className="pixelpass-global-nav">
        <div className="pixelpass-brand">
          <img src={logo} aria-hidden="true" style={{ width: 50, height: 50, objectFit: "contain" }}></img>
          <span>
            <strong>PixelPass</strong>
            <small>meow edition ^w^</small>
          </span>
        </div>

        <div className="pixelpass-route-buttons">
          {navigation.map(({ Icon, label, path }) => (
            <button
              aria-current={location.pathname === path ? "page" : undefined}
              className={location.pathname === path ? "default" : undefined}
              key={path}
              type="button"
              onClick={() => navigate(path)}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
