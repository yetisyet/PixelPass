import { Route, Routes, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import Dashboard from "@/pages/dashboard"
import Home from "@/pages/home"
import NotFound from "@/pages/notfound"

export default function App() {
  const navigate = useNavigate()

  return (
    <div>
      <nav className="flex gap-2 p-4">
        <Button onClick={() => navigate("/")}>Home</Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Dashboard
        </Button>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
