import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useTheme } from '../hooks/useTheme'
import '../styles/login.css'
import '../styles/signup.css'
import '../styles/onboarding.css'

const FUEL_OPTS = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico', 'Híbrido']

const BLANK = {
  plate: '', brand: '', model: '',
  year: '', color: '', fuel_type: 'Flex', daily_rate: '',
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { userData } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.plate.trim() || !form.brand.trim() || !form.model.trim() || !form.daily_rate) {
      setError('Preencha placa, marca, modelo e valor da diária.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('vehicles').insert({
      plate:      form.plate.toUpperCase().replace(/\s/g, ''),
      brand:      form.brand.trim(),
      model:      form.model.trim(),
      year:       form.year ? parseInt(form.year) : null,
      color:      form.color.trim() || null,
      fuel_type:  form.fuel_type,
      daily_rate: parseFloat(form.daily_rate),
      mileage:    0,
      status:     'available',
      company_id: userData.company.id,
    })
    setSaving(false)
    if (err) {
      setError(err.message.includes('unique') ? 'Placa já cadastrada.' : err.message)
      return
    }
    navigate('/billing')
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

        <div className="login-card signup-card">
          <div className="ob-header">
            <div className="ob-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 14h14l-1.4-4.2a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.3L5 14z"/>
                <rect x="3.5" y="14" width="17" height="4" rx="1.2"/>
                <circle cx="7.5" cy="18" r="1.2" fill="currentColor"/>
                <circle cx="16.5" cy="18" r="1.2" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>
                {userData?.profile ? `Bem-vindo, ${userData.profile.full_name.trim().split(' ')[0]}!` : 'Bem-vindo!'}
              </h2>
              <p className="lead" style={{ margin: '4px 0 0' }}>
                Adicione o primeiro veículo da sua frota para começar.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="signup-row">
              <div className="field">
                <div className="field-head"><label>Placa <span style={{ color: 'var(--danger)' }}>*</span></label></div>
                <div className="input-wrap">
                  <input
                    className="login-input no-icon"
                    type="text"
                    placeholder="ABC1D23"
                    maxLength={8}
                    value={form.plate}
                    onChange={e => setField('plate', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div className="field">
                <div className="field-head"><label>Combustível</label></div>
                <div className="input-wrap">
                  <select
                    className="login-input no-icon"
                    value={form.fuel_type}
                    onChange={e => setField('fuel_type', e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {FUEL_OPTS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="signup-row">
              <div className="field">
                <div className="field-head"><label>Marca <span style={{ color: 'var(--danger)' }}>*</span></label></div>
                <div className="input-wrap">
                  <input
                    className="login-input no-icon"
                    type="text"
                    placeholder="Toyota"
                    value={form.brand}
                    onChange={e => setField('brand', e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <div className="field-head"><label>Modelo <span style={{ color: 'var(--danger)' }}>*</span></label></div>
                <div className="input-wrap">
                  <input
                    className="login-input no-icon"
                    type="text"
                    placeholder="Corolla XEi"
                    value={form.model}
                    onChange={e => setField('model', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="signup-row">
              <div className="field">
                <div className="field-head"><label>Ano</label></div>
                <div className="input-wrap">
                  <input
                    className="login-input no-icon"
                    type="number"
                    placeholder={new Date().getFullYear()}
                    min="1990"
                    max="2030"
                    value={form.year}
                    onChange={e => setField('year', e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <div className="field-head"><label>Cor</label></div>
                <div className="input-wrap">
                  <input
                    className="login-input no-icon"
                    type="text"
                    placeholder="Prata"
                    value={form.color}
                    onChange={e => setField('color', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <div className="field-head"><label>Valor da diária (R$) <span style={{ color: 'var(--danger)' }}>*</span></label></div>
              <div className="input-wrap">
                <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <input
                  className="login-input"
                  type="number"
                  placeholder="120,00"
                  min="0"
                  step="0.01"
                  value={form.daily_rate}
                  onChange={e => setField('daily_rate', e.target.value)}
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={saving} style={{ marginTop: 8 }}>
              <span>{saving ? 'Adicionando...' : 'Adicionar veículo e entrar'}</span>
              {!saving && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </form>

          <div className="signup" style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', font: 'inherit', fontSize: 12.5, cursor: 'pointer' }}
            >
              Pular por enquanto, ir para o dashboard →
            </button>
          </div>
        </div>

        <div className="legal">
          © 2026 WMove · <a href="#">Termos</a> · <a href="#">Privacidade</a>
        </div>
      </div>
    </>
  )
}
