import { Route, Routes, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import Dashboard from "@/pages/dashboard"
import Home from "@/pages/home"
import NotFound from "@/pages/notfound"

const navigation = [
  { label: "Home", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div>
      <nav aria-label="Primary" className="flex flex-wrap gap-2 border-b p-4">
        {navigation.map(({ label, path }) => (
          <Button
            key={path}
            variant={location.pathname === path ? "default" : "outline"}
            onClick={() => navigate(path)}
          >
            {label}
          </Button>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
