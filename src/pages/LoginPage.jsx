import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import '../styles/login.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    sessionStorage.setItem('wmove_remember', rememberMe ? 'true' : 'false')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      const msg = authError.message.toLowerCase().includes('email not confirmed')
        ? 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
        : 'E-mail ou senha inválidos.'
      setError(msg)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setResetLoading(false)
    setMode('sent')
  }

  function goToForgot() {
    setResetEmail(email)
    setError('')
    setMode('forgot')
  }

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
          <a className="link-btn" href="#">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>
            </svg>
            <span>Ajuda</span>
          </a>
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

        <div className="login-card">

          {/* ── Login ── */}
          {mode === 'login' && (<>
            <h2>Bem-vindo de volta</h2>
            <p className="lead">Acesse sua conta para gerenciar sua frota.</p>

            <div className="sso">
              <button className="sso-btn" type="button" onClick={handleGoogleLogin}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.76h3.57c2.08-1.92 3.22-4.74 3.22-8.31z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                <span>Continuar com Google</span>
              </button>
            </div>

            <div className="divider">ou com e-mail</div>

            <form onSubmit={handleSubmit} autoComplete="on">
              <div className="field">
                <div className="field-head">
                  <label htmlFor="email">E-mail</label>
                </div>
                <div className="input-wrap">
                  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                  </svg>
                  <input
                    id="email"
                    className="login-input"
                    type="email"
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <div className="field-head">
                  <label htmlFor="password">Senha</label>
                  <button type="button" className="help" onClick={goToForgot}>Esqueci minha senha</button>
                </div>
                <div className="input-wrap">
                  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                  </svg>
                  <input
                    id="password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 46 }}
                  />
                  <button type="button" className="toggle-pwd" onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 4.22-5.34M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12A3 3 0 1 1 9.88 9.88"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <div className="row-between">
                <label className="check">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  <span className="box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12 10 17 19 7"/>
                    </svg>
                  </span>
                  <span>Manter conectado</span>
                </label>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </form>

            <div className="signup">
              Ainda não tem conta? <a href="/cadastro">Criar conta gratuita</a>
            </div>
          </>)}

          {/* ── Forgot password ── */}
          {mode === 'forgot' && (<>
            <button className="back-link" onClick={() => setMode('login')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Voltar ao login
            </button>
            <h2>Recuperar senha</h2>
            <p className="lead">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
            <form onSubmit={handleReset}>
              <div className="field">
                <div className="field-head"><label>E-mail</label></div>
                <div className="input-wrap">
                  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                  </svg>
                  <input
                    className="login-input"
                    type="email"
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="login-submit" disabled={resetLoading} style={{ marginTop: 8 }}>
                <span>{resetLoading ? 'Enviando...' : 'Enviar link de recuperação'}</span>
                {!resetLoading && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            </form>
          </>)}

          {/* ── Email sent ── */}
          {mode === 'sent' && (<>
            <div className="reset-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
              </svg>
            </div>
            <h2>E-mail enviado</h2>
            <p className="lead">Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes. Verifique também a pasta de spam.</p>
            <button type="button" className="login-submit" onClick={() => setMode('login')} style={{ marginTop: 8 }}>
              <span>Voltar ao login</span>
            </button>
          </>)}

        </div>

        <div className="legal">
          © 2026 WMove · <a href="/termos">Termos</a> · <a href="/termos#privacidade">Privacidade</a> · <a href="#">Status</a>
        </div>
      </div>
    </>
  )
}
