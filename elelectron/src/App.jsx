import { Route, Routes } from "react-router-dom"
import Dashboard from "@/pages/dashboard"
import Home from "@/pages/home"
import NotFound from "@/pages/notfound"

export default function App() {
  return (
    <div className="win7 pixelpass-desktop">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
