import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/login.css'

export default function NotFoundPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <div className="orbs">
        <div className="orb a1" />
        <div className="orb i1" />
        <div className="orb a2" />
      </div>
      <div className="grid-bg" />
      <div className="noise" />

      <header className="login-topbar">
        <div />
        <div className="topbar-right">
          <button className="icon-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="login-stage">
        <div className="login-logo-block">
          <img src="/assets/wmove-logo.png" alt="WMove" />
        </div>

        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--amber)', lineHeight: 1, marginBottom: 12 }}>
            404
          </div>
          <h2 style={{ marginBottom: 8 }}>Página não encontrada</h2>
          <p className="lead" style={{ marginBottom: 28 }}>
            O endereço que você acessou não existe ou foi movido.
          </p>
          <Link to="/" className="login-submit" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span>Voltar para o início</span>
          </Link>
        </div>

        <div className="legal">
          © 2026 WMove · <a href="/termos">Termos</a> · <a href="/privacidade">Privacidade</a>
        </div>
      </div>
    </>
  )
}
