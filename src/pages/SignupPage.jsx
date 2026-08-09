import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import '../styles/signup.css'

const PLANS = [
  { id: 'wgo',   name: 'WGo',   price: 89,  label: 'Até 10 veículos', range: '1–10'  },
  { id: 'wplus', name: 'WPlus', price: 209, label: 'Até 30 veículos', range: '11–30' },
  { id: 'wpro',  name: 'WPro',  price: 419, label: 'Até 80 veículos', range: '31–80' },
  { id: 'wmax',  name: 'WMax',  price: 849, label: 'Frota ilimitada', range: '80+', custom: true },
]

const FLEET_OPTIONS = [
  { label: 'Até 10 veículos', range: '1–10',  plan: PLANS[0] },
  { label: 'Até 30 veículos', range: '11–30', plan: PLANS[1] },
  { label: 'Até 80 veículos', range: '31–80', plan: PLANS[2] },
  { label: 'Frota ilimitada', range: '80+',   plan: PLANS[3] },
]

const STEP_LABELS = ['Sua conta', 'Sua locadora', 'Sua frota']

function maskCNPJ(v) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
}

function maskPhone(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskCEP(v) {
  return v.replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

const IconPerson = () => (
  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconMail = () => (
  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
  </svg>
)
const IconLock = () => (
  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
)
const IconBriefcase = () => (
  <svg className="lead-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
)
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 12 10 17 19 7"/>
  </svg>
)
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 4.22-5.34M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-2.16 3.19M1 1l22 22M14.12 14.12A3 3 0 1 1 9.88 9.88"/>
  </svg>
)
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const PLAN_TO_FLEET_IDX = { wgo: 0, wplus: 1, wpro: 2, wmax: 3 }

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme, toggleTheme } = useTheme()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Step 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Step 2
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [phone, setPhone] = useState('')
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState('')
  const [addressNum, setAddressNum] = useState('')
  const [complement, setComplement] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  // Step 3
  const [fleetIdx, setFleetIdx] = useState(() => {
    const planParam = new URLSearchParams(window.location.search).get('plan')
    return PLAN_TO_FLEET_IDX[planParam] ?? 0
  })
  const [terms, setTerms] = useState(false)

  const plan = FLEET_OPTIONS[fleetIdx].plan

  async function lookupCEP(raw) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setAddress(data.logradouro || '')
        setCity(data.localidade || '')
        setUf(data.uf || '')
      }
    } catch {}
    setCepLoading(false)
  }

  function goNext() {
    setError('')
    if (step === 1) {
      if (!name || !email || !password || !confirmPassword) return setError('Preencha todos os campos.')
      if (password.length < 8) return setError('A senha deve ter no mínimo 8 caracteres.')
      if (password !== confirmPassword) return setError('As senhas não coincidem.')
    }
    if (step === 2) {
      if (!companyName || !cnpj || !phone || !cep || !address || !addressNum || !city || !uf)
        return setError('Preencha todos os campos obrigatórios.')
      if (cnpj.replace(/\D/g, '').length !== 14) return setError('CNPJ inválido.')
    }
    setStep(s => s + 1)
  }

  function goBack() {
    setError('')
    setStep(s => s - 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!terms) return setError('Aceite os Termos de Uso para continuar.')
    setLoading(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          company_name: companyName,
          cnpj: cnpj.replace(/\D/g, ''),
          phone: phone.replace(/\D/g, ''),
          cep: cep.replace(/\D/g, ''),
          address, address_num: addressNum, complement, city, uf,
          fleet_option: FLEET_OPTIONS[fleetIdx].range,
          plan: plan.id,
        },
      },
    })
    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'Este e-mail já está em uso.'
        : 'Erro ao criar conta. Tente novamente.'
      setError(msg)
      setLoading(false)
    } else if (!data.session) {
      setInfo('Conta criada! Verifique seu e-mail e clique no link de confirmação para acessar.')
      setLoading(false)
    } else {
      navigate('/onboarding')
    }
    // Se veio de um plano específico, leva para billing após onboarding
    // (o onboarding redireciona para /dashboard que já tem o banner de trial)
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

          {/* Step indicator */}
          <div className="signup-steps">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="signup-step-wrap">
                <div className={`signup-step${step === i + 1 ? ' active' : ''}${step > i + 1 ? ' done' : ''}`}>
                  <div className="step-dot">
                    {step > i + 1 ? <IconCheck /> : <span>{i + 1}</span>}
                  </div>
                  <span className="step-label">{label}</span>
                </div>
                {i < 2 && <div className={`step-line${step > i + 1 ? ' done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 1: Conta ── */}
          {step === 1 && (
            <>
              <h2>Crie sua conta</h2>
              <p className="lead">14 dias grátis. Sem cartão de crédito.</p>

              <div className="field">
                <div className="field-head"><label>Nome completo</label></div>
                <div className="input-wrap">
                  <IconPerson />
                  <input className="login-input" type="text" placeholder="João Silva" autoComplete="name"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>

              <div className="field">
                <div className="field-head"><label>E-mail profissional</label></div>
                <div className="input-wrap">
                  <IconMail />
                  <input className="login-input" type="email" placeholder="joao@locadora.com" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="field">
                <div className="field-head"><label>Senha</label></div>
                <div className="input-wrap">
                  <IconLock />
                  <input className="login-input" type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 46 }} />
                  <button type="button" className="toggle-pwd" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div className="field">
                <div className="field-head"><label>Confirmar senha</label></div>
                <div className="input-wrap">
                  <IconLock />
                  <input className="login-input" type="password" placeholder="Repita a senha" autoComplete="new-password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="button" className="login-submit" onClick={goNext}>
                <span>Continuar</span>
                <IconArrowRight />
              </button>
            </>
          )}

          {/* ── Step 2: Locadora ── */}
          {step === 2 && (
            <>
              <h2>Sua locadora</h2>
              <p className="lead">Dados da empresa para contratos e documentos.</p>

              <div className="field">
                <div className="field-head"><label>Nome da locadora</label></div>
                <div className="input-wrap">
                  <IconBriefcase />
                  <input className="login-input" type="text" placeholder="Locadora Exemplo Ltda"
                    value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
              </div>

              <div className="signup-row">
                <div className="field">
                  <div className="field-head"><label>CNPJ</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="00.000.000/0000-00"
                      value={cnpj} onChange={e => setCnpj(maskCNPJ(e.target.value))} />
                  </div>
                </div>
                <div className="field">
                  <div className="field-head"><label>WhatsApp / Telefone</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="(11) 99999-9999"
                      value={phone} onChange={e => setPhone(maskPhone(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="signup-row">
                <div className="field signup-cep">
                  <div className="field-head"><label>CEP</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="00000-000"
                      value={cep}
                      onChange={e => {
                        const v = maskCEP(e.target.value)
                        setCep(v)
                        lookupCEP(v)
                      }} />
                    {cepLoading && <div className="cep-spinner" />}
                  </div>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <div className="field-head"><label>Endereço</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="Rua, Av..."
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="signup-row">
                <div className="field signup-num">
                  <div className="field-head"><label>Número</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="123"
                      value={addressNum} onChange={e => setAddressNum(e.target.value)} />
                  </div>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <div className="field-head">
                    <label>Complemento <span className="opt-tag">(opcional)</span></label>
                  </div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="Sala, andar..."
                      value={complement} onChange={e => setComplement(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="signup-row">
                <div className="field" style={{ flex: 1 }}>
                  <div className="field-head"><label>Cidade</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="São Paulo"
                      value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                </div>
                <div className="field signup-uf">
                  <div className="field-head"><label>UF</label></div>
                  <div className="input-wrap">
                    <input className="login-input no-icon" type="text" placeholder="SP" maxLength={2}
                      value={uf} onChange={e => setUf(e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <div className="signup-nav">
                <button type="button" className="back-btn" onClick={goBack}>
                  <IconArrowLeft /> Voltar
                </button>
                <button type="button" className="login-submit step-next" onClick={goNext}>
                  <span>Continuar</span>
                  <IconArrowRight />
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Frota ── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2>Sua frota</h2>
              <p className="lead">Selecione o tamanho da sua frota atual.</p>

              <div className="fleet-options">
                {FLEET_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`fleet-opt${fleetIdx === i ? ' selected' : ''}`}
                    onClick={() => setFleetIdx(i)}
                  >
                    <span className="fo-range">{opt.range}</span>
                    <span className="fo-label">{opt.label}</span>
                  </button>
                ))}
              </div>

              <div className="plan-pill">
                <div className="plan-pill-left">
                  <span className="plan-rec-badge">Plano recomendado</span>
                  <span className="plan-rec-name">{plan.name}</span>
                  <span className="plan-rec-fleet">{plan.label}</span>
                </div>
                <div className="plan-pill-right">
                  <span className="plan-rec-price">
                    R$ {plan.price}{plan.custom ? '+' : ''}
                    <span>/mês</span>
                  </span>
                  <span className="plan-rec-trial">14 dias grátis</span>
                </div>
              </div>

              {info  && <div className="login-info">{info}</div>}
              {error && <div className="login-error">{error}</div>}

              <label className="check terms-check">
                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
                <span className="box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="5 12 10 17 19 7"/>
                  </svg>
                </span>
                <span>Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Termos de Uso</a> e a <a href="/termos#privacidade" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Política de Privacidade</a></span>
              </label>

              <div className="signup-nav">
                <button type="button" className="back-btn" onClick={goBack}>
                  <IconArrowLeft /> Voltar
                </button>
                <button type="submit" className="login-submit step-next" disabled={loading}>
                  <span>{loading ? 'Criando conta...' : 'Criar conta grátis'}</span>
                  {!loading && <IconArrowRight />}
                </button>
              </div>
            </form>
          )}

          <div className="signup" style={{ marginTop: 20 }}>
            Já tem conta? <a href="/login">Entrar</a>
          </div>
        </div>

        <div className="legal">
          © 2026 WMove · <a href="/termos">Termos</a> · <a href="/termos#privacidade">Privacidade</a> · <a href="#">Status</a>
        </div>
      </div>
    </>
  )
}
