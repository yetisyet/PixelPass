import { KeyRound, PawPrint, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <main className="pixelpass-page pixelpass-home-page">
      <section className="window active glass pixelpass-home-window">
        <div className="title-bar">
          <div className="title-bar-text">Welcome to PixelPass</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize" disabled type="button" />
            <button aria-label="Maximize" disabled type="button" />
            <button aria-label="Close" disabled type="button" />
          </div>
        </div>

        <div className="window-body has-space pixelpass-home-body">
          <div className="pixelpass-home-art" aria-hidden="true">
            <ShieldCheck />
            <PawPrint className="pixelpass-home-paw pixelpass-home-paw-one" />
            <PawPrint className="pixelpass-home-paw pixelpass-home-paw-two" />
          </div>

          <div className="pixelpass-home-copy">
            <p className="pixelpass-eyebrow">ur cozy password den</p>
            <h1>Hi this is meow&apos;s house</h1>
            <p>
              keep ur logins tucked away, then reveal and copy them only when
              u need them nyah ^w^
            </p>

            <div className="pixelpass-home-actions">
              <button
                className="default"
                type="button"
                onClick={() => navigate("/dashboard")}
              >
                <KeyRound aria-hidden="true" />
                Open the vault &gt;w&lt;
              </button>
            </div>
          </div>
        </div>

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
      </section>
    </main>
  )
}
