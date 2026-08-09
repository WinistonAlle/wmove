import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import '../styles/inner.css'
import '../styles/configuracoes.css'

const PLAN_LABELS = { wgo: 'WGo', wpro: 'WPro', wmax: 'WMax' }

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

export default function ConfiguracoesPage() {
  const { userData, refresh } = useUser()
  const toast = useToast()
  const [tab, setTab] = useState('empresa')

  // ── Empresa ──────────────────────────────────────────────
  const [empresa, setEmpresa] = useState({
    name: '', cnpj: '', phone: '', cep: '',
    address: '', address_num: '', complement: '', city: '', uf: '',
  })
  const [savingEmpresa, setSavingEmpresa] = useState(false)
  const [fetchingCep, setFetchingCep]     = useState(false)

  // ── Perfil ───────────────────────────────────────────────
  const [fullName, setFullName]     = useState('')
  const [savingPerfil, setSavingPerfil] = useState(false)

  // ── Senha ────────────────────────────────────────────────
  const [pwNew, setPwNew]           = useState('')
  const [pwConfirm, setPwConfirm]   = useState('')
  const [savingPw, setSavingPw]     = useState(false)
  const [pwError, setPwError]       = useState('')

  useEffect(() => {
    if (!userData) return
    const c = userData.company || {}
    setEmpresa({
      name:        c.name        || '',
      cnpj:        c.cnpj        || '',
      phone:       c.phone       || '',
      cep:         c.cep         || '',
      address:     c.address     || '',
      address_num: c.address_num || '',
      complement:  c.complement  || '',
      city:        c.city        || '',
      uf:          c.uf          || '',
    })
    setFullName(userData.profile?.full_name || '')
  }, [userData])

  async function lookupCep(cep) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setFetchingCep(true)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setEmpresa(p => ({
          ...p,
          address:    data.logradouro  || p.address,
          complement: data.complemento || p.complement,
          city:       data.localidade  || p.city,
          uf:         data.uf          || p.uf,
        }))
      }
    } catch { /* ignore network errors */ }
    finally { setFetchingCep(false) }
  }

  async function saveEmpresa(e) {
    e.preventDefault()
    setSavingEmpresa(true)
    await supabase.from('companies').update(empresa).eq('id', userData.company.id)
    await refresh()
    setSavingEmpresa(false)
    toast('Dados da empresa atualizados.')
  }

  async function savePerfil(e) {
    e.preventDefault()
    setSavingPerfil(true)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', userData.user.id)
    await refresh()
    setSavingPerfil(false)
    toast('Perfil atualizado.')
  }

  async function saveSenha(e) {
    e.preventDefault()
    setPwError('')
    if (pwNew.length < 6) { setPwError('A senha deve ter ao menos 6 caracteres.'); return }
    if (pwNew !== pwConfirm) { setPwError('As senhas não coincidem.'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    setSavingPw(false)
    if (error) { setPwError(error.message); return }
    setPwNew(''); setPwConfirm('')
    toast('Senha alterada com sucesso.')
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Configurações</h1>
      <p>Gerencie sua locadora e conta</p>
    </div>
  )

  const company = userData?.company
  const planLabel = PLAN_LABELS[company?.plan] || company?.plan || '—'
  const trialEnds = company?.trial_ends_at
    ? new Date(company.trial_ends_at).toLocaleDateString('pt-BR')
    : null

  return (
    <DashboardLayout topbarLeft={topbarLeft}>

      <div className="cfg-tabs">
        {[
          { key: 'empresa', label: 'Empresa' },
          { key: 'perfil',  label: 'Perfil'  },
          { key: 'senha',   label: 'Senha'   },
        ].map(t => (
          <button
            key={t.key}
            className={`cfg-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Plano pill ─────────────────────────────────────── */}
      {tab === 'empresa' && (
        <div className="cfg-plan-row glass">
          <div>
            <div className="cfg-plan-label">Plano atual</div>
            <div className="cfg-plan-name">{planLabel}</div>
            {trialEnds && (
              <div className="cfg-plan-trial">Trial até {trialEnds}</div>
            )}
          </div>
          <Link to="/billing" className="btn-add" style={{ textDecoration: 'none' }}>
            Gerenciar plano
          </Link>
        </div>
      )}

      {/* ── Tab: Empresa ───────────────────────────────────── */}
      {tab === 'empresa' && (
        <div className="dash-card glass" style={{ marginTop: 20 }}>
          <div className="card-head" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">Dados da locadora</h3>
              <div className="card-subtitle">Estas informações aparecem nos contratos</div>
            </div>
          </div>
          <form className="dash-form" onSubmit={saveEmpresa}>
            <div className="form-row">
              <Field label="Nome da empresa *">
                <input
                  value={empresa.name}
                  onChange={e => setEmpresa(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Locadora Silva"
                  required
                />
              </Field>
              <Field label="CNPJ">
                <input
                  value={empresa.cnpj}
                  onChange={e => setEmpresa(p => ({ ...p, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Telefone / WhatsApp">
                <input
                  value={empresa.phone}
                  onChange={e => setEmpresa(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(00) 90000-0000"
                />
              </Field>
              <Field label={`CEP${fetchingCep ? ' — buscando…' : ''}`}>
                <input
                  value={empresa.cep}
                  onChange={e => {
                    const v = e.target.value
                    setEmpresa(p => ({ ...p, cep: v }))
                    lookupCep(v)
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Logradouro">
                <input
                  value={empresa.address}
                  onChange={e => setEmpresa(p => ({ ...p, address: e.target.value }))}
                  placeholder="Rua, Av., etc."
                />
              </Field>
              <Field label="Número">
                <input
                  value={empresa.address_num}
                  onChange={e => setEmpresa(p => ({ ...p, address_num: e.target.value }))}
                  placeholder="123"
                />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Complemento">
                <input
                  value={empresa.complement}
                  onChange={e => setEmpresa(p => ({ ...p, complement: e.target.value }))}
                  placeholder="Sala, Bloco, etc."
                />
              </Field>
              <Field label="Cidade">
                <input
                  value={empresa.city}
                  onChange={e => setEmpresa(p => ({ ...p, city: e.target.value }))}
                  placeholder="Belo Horizonte"
                />
              </Field>
            </div>
            <div className="form-row">
              <Field label="UF">
                <input
                  value={empresa.uf}
                  onChange={e => setEmpresa(p => ({ ...p, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="MG"
                  maxLength={2}
                  style={{ maxWidth: 80 }}
                />
              </Field>
              <div />
            </div>
            <div className="form-actions">
              <div className="form-actions-end">
                <button className="btn-save" type="submit" disabled={savingEmpresa}>
                  {savingEmpresa ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Perfil ────────────────────────────────────── */}
      {tab === 'perfil' && (
        <div className="dash-card glass" style={{ marginTop: 20 }}>
          <div className="card-head" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">Dados pessoais</h3>
              <div className="card-subtitle">Seu nome de exibição no sistema</div>
            </div>
          </div>
          <form className="dash-form" onSubmit={savePerfil}>
            <div className="form-row">
              <Field label="Nome completo">
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </Field>
              <Field label="E-mail (conta)">
                <input value={userData?.user?.email || ''} disabled style={{ opacity: 0.5 }} />
              </Field>
            </div>
            <div className="form-actions">
              <div className="form-actions-end">
                <button className="btn-save" type="submit" disabled={savingPerfil}>
                  {savingPerfil ? 'Salvando…' : 'Salvar nome'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Senha ─────────────────────────────────────── */}
      {tab === 'senha' && (
        <div className="dash-card glass" style={{ marginTop: 20 }}>
          <div className="card-head" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">Alterar senha</h3>
              <div className="card-subtitle">Use ao menos 6 caracteres</div>
            </div>
          </div>
          <form className="dash-form" onSubmit={saveSenha}>
            <div className="form-row single">
              <Field label="Nova senha">
                <input
                  type="password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>
            </div>
            <div className="form-row single">
              <Field label="Confirmar nova senha">
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>
            </div>
            {pwError && <p className="form-error">{pwError}</p>}
            <div className="form-actions">
              <div className="form-actions-end">
                <button className="btn-save" type="submit" disabled={savingPw}>
                  {savingPw ? 'Salvando…' : 'Alterar senha'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

    </DashboardLayout>
  )
}
