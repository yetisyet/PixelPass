import { PawPrint } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="pixelpass-page pixelpass-not-found-page">
      <section className="window active glass pixelpass-not-found-window">
        <div className="title-bar">
          <div className="title-bar-text">PixelPass</div>
        </div>
        <div className="window-body has-space pixelpass-empty-state">
          <PawPrint aria-hidden="true" />
          <h1>this page ran away T~T</h1>
          <p>let&apos;s bring u back to meow&apos;s house nyah</p>
          <button className="default" type="button" onClick={() => navigate("/")}>
            Go home ^w^
          </button>
        </div>
      </section>
    </main>
  )
}
