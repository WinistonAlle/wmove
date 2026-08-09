import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import '../styles/login.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('A senha deve ter no mínimo 8 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => navigate('/dashboard'), 2500)
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
          {done ? (
            <>
              <div className="reset-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2>Senha redefinida</h2>
              <p className="lead">Sua senha foi atualizada com sucesso. Redirecionando para o dashboard…</p>
            </>
          ) : !ready ? (
            <>
              <h2>Verificando link…</h2>
              <p className="lead">Aguarde um instante enquanto validamos seu link de recuperação.</p>
            </>
          ) : (
            <>
              <h2>Nova senha</h2>
              <p className="lead">Escolha uma senha forte com pelo menos 8 caracteres.</p>

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <div className="field-head"><label>Nova senha</label></div>
                  <div className="input-wrap">
                    <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                    </svg>
                    <input
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: 46 }}
                    />
                    <button type="button" className="toggle-pwd" onClick={() => setShowPassword(v => !v)}>
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

                <div className="field">
                  <div className="field-head"><label>Confirmar nova senha</label></div>
                  <div className="input-wrap">
                    <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                    </svg>
                    <input
                      className="login-input"
                      type="password"
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="login-error">{error}</div>}

                <button type="submit" className="login-submit" disabled={loading} style={{ marginTop: 8 }}>
                  <span>{loading ? 'Salvando...' : 'Definir nova senha'}</span>
                  {!loading && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 5l7 7-7 7"/>
                    </svg>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="legal">
          © 2026 WMove · <a href="#">Termos</a> · <a href="#">Privacidade</a>
        </div>
      </div>
    </>
  )
}
