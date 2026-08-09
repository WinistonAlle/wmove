import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/seguro.css'

// ─── Helpers ─────────────────────────────────────────────────

const COVERAGE_LABELS = {
  comprehensive: 'Compreensivo',
  third_party:   'Terceiros',
  basic:         'Básico (DPVAT)',
  premium:       'Premium',
}

const PERIOD_LABELS = {
  annual:    'anual',
  monthly:   'mensal',
  semiannual:'semestral',
}

function formatMoney(v) {
  if (!v && v !== 0) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null
  const today = new Date(new Date().toDateString())
  return Math.ceil((new Date(dateStr) - today) / 86400000)
}

function expiryStatus(dateStr) {
  const days = daysUntilExpiry(dateStr)
  if (days === null) return 'active'
  if (days < 0)   return 'expired'
  if (days <= 30) return 'expiring'
  return 'active'
}

function ExpiryCell({ dateStr }) {
  const days = daysUntilExpiry(dateStr)
  if (days === null) return <span className="expiry-ok">—</span>
  if (days < 0)   return <span className="expiry-gone">{formatDate(dateStr)} <span style={{ fontSize: 10 }}>({Math.abs(days)}d vencida)</span></span>
  if (days <= 30) return <span className="expiry-soon">{formatDate(dateStr)} <span style={{ fontSize: 10 }}>({days}d)</span></span>
  return <span className="expiry-ok">{formatDate(dateStr)}</span>
}

const EMPTY = {
  vehicle_id:     '',
  insurer:        '',
  policy_number:  '',
  coverage_type:  'comprehensive',
  coverage_value: '',
  premium:        '',
  premium_period: 'annual',
  start_date:     '',
  end_date:       '',
  deductible:     '',
  notes:          '',
}

// ─── Component ───────────────────────────────────────────────

export default function SeguroPage() {
  const { userData }    = useUser()
  const [insurances, setInsurances] = useState([])
  const [vehicles, setVehicles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('active')
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [delConfirm, setDelConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ins }, { data: v }] = await Promise.all([
      supabase
        .from('insurances')
        .select('*, vehicles(plate, brand, model)')
        .order('end_date', { ascending: true }),
      supabase.from('vehicles').select('id, plate, brand, model').order('plate'),
    ])
    setInsurances(ins || [])
    setVehicles(v || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active   = insurances.filter(i => expiryStatus(i.end_date) === 'active')
    const expiring = insurances.filter(i => expiryStatus(i.end_date) === 'expiring')
    const expired  = insurances.filter(i => expiryStatus(i.end_date) === 'expired')
    const annualCost = insurances
      .filter(i => expiryStatus(i.end_date) !== 'expired')
      .reduce((s, i) => {
        if (!i.premium) return s
        const v = Number(i.premium)
        if (i.premium_period === 'monthly')    return s + v * 12
        if (i.premium_period === 'semiannual') return s + v * 2
        return s + v
      }, 0)
    return { active: active.length, expiring: expiring.length, expired: expired.length, annualCost }
  }, [insurances])

  // ── Alert banner ──────────────────────────────────────────
  const alertItems = useMemo(() =>
    insurances.filter(i => expiryStatus(i.end_date) === 'expiring')
      .map(i => `${i.vehicles?.plate || '—'} (${i.insurer}) vence em ${daysUntilExpiry(i.end_date)}d`)
  , [insurances])

  // ── Filters ───────────────────────────────────────────────
  const byFilter = useMemo(() => {
    if (filter === 'all')      return insurances
    if (filter === 'expiring') return insurances.filter(i => expiryStatus(i.end_date) === 'expiring')
    if (filter === 'expired')  return insurances.filter(i => expiryStatus(i.end_date) === 'expired')
    return insurances.filter(i => expiryStatus(i.end_date) === 'active')
  }, [insurances, filter])

  const filtered = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(i =>
      `${i.vehicles?.plate || ''} ${i.vehicles?.brand || ''} ${i.vehicles?.model || ''} ${i.insurer} ${i.policy_number || ''}`.toLowerCase().includes(q)
    )
  }, [byFilter, search])

  const counts = useMemo(() => ({
    active:   insurances.filter(i => expiryStatus(i.end_date) === 'active').length,
    expiring: insurances.filter(i => expiryStatus(i.end_date) === 'expiring').length,
    expired:  insurances.filter(i => expiryStatus(i.end_date) === 'expired').length,
    all:      insurances.length,
  }), [insurances])

  // ── Modal ─────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal('add')
  }

  function openEdit(ins) {
    setForm({
      vehicle_id:     ins.vehicle_id     || '',
      insurer:        ins.insurer        || '',
      policy_number:  ins.policy_number  || '',
      coverage_type:  ins.coverage_type  || 'comprehensive',
      coverage_value: ins.coverage_value ?? '',
      premium:        ins.premium        ?? '',
      premium_period: ins.premium_period || 'annual',
      start_date:     ins.start_date     || '',
      end_date:       ins.end_date       || '',
      deductible:     ins.deductible     ?? '',
      notes:          ins.notes          || '',
      _id:            ins.id,
    })
    setError('')
    setDelConfirm(false)
    setModal('edit')
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.vehicle_id)   { setError('Selecione o veículo.'); return }
    if (!form.insurer.trim()) { setError('Informe a seguradora.'); return }
    if (!form.start_date || !form.end_date) { setError('Informe o período de vigência.'); return }
    if (form.start_date >= form.end_date) { setError('Data de início deve ser anterior ao vencimento.'); return }
    setSaving(true)
    const payload = {
      company_id:     userData.company.id,
      vehicle_id:     form.vehicle_id,
      insurer:        form.insurer.trim(),
      policy_number:  form.policy_number.trim()  || null,
      coverage_type:  form.coverage_type,
      coverage_value: form.coverage_value !== '' ? Number(form.coverage_value) : null,
      premium:        form.premium        !== '' ? Number(form.premium)        : null,
      premium_period: form.premium_period,
      start_date:     form.start_date,
      end_date:       form.end_date,
      deductible:     form.deductible     !== '' ? Number(form.deductible)     : null,
      notes:          form.notes.trim()           || null,
    }
    if (modal === 'add') {
      const { error: err } = await supabase.from('insurances').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('insurances').update(payload).eq('id', form._id)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function del() {
    await supabase.from('insurances').delete().eq('id', form._id)
    setModal(null)
    load()
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Seguro</h1>
      <p>{loading ? '…' : `${kpis.active} apólice${kpis.active !== 1 ? 's' : ''} ativa${kpis.active !== 1 ? 's' : ''}${kpis.expiring > 0 ? ` · ${kpis.expiring} vencendo` : ''}`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Nova apólice
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* KPIs */}
      <div className="seg-kpis">
        <div className="seg-kpi glass">
          <div className="seg-kpi-label">Apólices ativas</div>
          <div className="seg-kpi-value emerald">{kpis.active}</div>
          <div className="seg-kpi-sub">veículos cobertos</div>
        </div>
        <div className="seg-kpi glass">
          <div className="seg-kpi-label">Vencendo em 30 dias</div>
          <div className={`seg-kpi-value${kpis.expiring > 0 ? ' amber' : ''}`}>{kpis.expiring}</div>
          <div className="seg-kpi-sub">{kpis.expiring === 0 ? 'tudo em dia' : 'requer renovação'}</div>
        </div>
        <div className="seg-kpi glass">
          <div className="seg-kpi-label">Vencidas</div>
          <div className={`seg-kpi-value${kpis.expired > 0 ? ' danger' : ''}`}>{kpis.expired}</div>
          <div className="seg-kpi-sub">{kpis.expired === 0 ? 'nenhuma' : 'sem cobertura'}</div>
        </div>
        <div className="seg-kpi glass">
          <div className="seg-kpi-label">Custo anual estimado</div>
          <div className="seg-kpi-value num" style={{ fontSize: kpis.annualCost >= 10000 ? 18 : 22 }}>{formatMoney(kpis.annualCost)}</div>
          <div className="seg-kpi-sub">apólices vigentes</div>
        </div>
      </div>

      {/* Alert banner */}
      {alertItems.length > 0 && (
        <div className="seg-alert-banner">
          <div className="seg-alert-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="seg-alert-title">Apólices próximas do vencimento</div>
            <div className="seg-alert-items">{alertItems.join(' · ')}</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'active',   label: 'Ativas',     count: counts.active   },
            { key: 'expiring', label: 'A vencer',   count: counts.expiring },
            { key: 'expired',  label: 'Vencidas',   count: counts.expired  },
            { key: 'all',      label: 'Todas',      count: counts.all      },
          ].map(f => (
            <button
              key={f.key}
              className={`filter-tab${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="filter-count">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="page-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Placa, seguradora ou nº apólice…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando apólices…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {insurances.length === 0 ? 'Nenhuma apólice cadastrada.' : 'Nenhuma apólice corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="sgtable-head">
              <span>Veículo</span>
              <span>Seguradora</span>
              <span>Cobertura</span>
              <span>Prêmio</span>
              <span>Valor segurado</span>
              <span>Vencimento</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map(ins => {
              const status = expiryStatus(ins.end_date)
              return (
                <div key={ins.id} className="sgtable-row gtable-row" onClick={() => openEdit(ins)}>
                  <div>
                    <div className="plate" style={{ fontSize: 11 }}>{ins.vehicles?.plate || '—'}</div>
                    <div className="gtable-muted">{ins.vehicles ? `${ins.vehicles.brand} ${ins.vehicles.model}` : ''}</div>
                  </div>
                  <div>
                    <div className="gtable-cell">{ins.insurer}</div>
                    {ins.policy_number && <div className="gtable-muted">Apólice {ins.policy_number}</div>}
                  </div>
                  <span className="cov-type">{COVERAGE_LABELS[ins.coverage_type] || ins.coverage_type}</span>
                  <div>
                    {ins.premium
                      ? <><div className="gtable-cell num" style={{ fontSize: 13 }}>{formatMoney(ins.premium)}</div>
                          <div className="gtable-muted">/{PERIOD_LABELS[ins.premium_period] || ins.premium_period}</div></>
                      : <span className="gtable-muted">—</span>
                    }
                  </div>
                  <div className="gtable-cell num" style={{ fontSize: 13 }}>{formatMoney(ins.coverage_value)}</div>
                  <ExpiryCell dateStr={ins.end_date} />
                  <span className={`seg-status ${status}`}>
                    {status === 'active' ? 'Ativa' : status === 'expiring' ? 'A vencer' : 'Vencida'}
                  </span>
                  <button className="row-btn" onClick={e => { e.stopPropagation(); openEdit(ins) }} title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Nova apólice' : 'Editar apólice'} wide>
        <form className="dash-form" onSubmit={save}>

          <div className="form-row">
            <div className="form-field">
              <label>Veículo *</label>
              <select
                value={form.vehicle_id}
                onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}
                required
              >
                <option value="">Selecionar…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Seguradora *</label>
              <input
                value={form.insurer}
                onChange={e => setForm(p => ({ ...p, insurer: e.target.value }))}
                placeholder="Ex: Porto Seguro, Bradesco Seguros…"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Nº da apólice</label>
              <input
                value={form.policy_number}
                onChange={e => setForm(p => ({ ...p, policy_number: e.target.value }))}
                placeholder="Ex: 034.209.874-1"
              />
            </div>
            <div className="form-field">
              <label>Tipo de cobertura</label>
              <select
                value={form.coverage_type}
                onChange={e => setForm(p => ({ ...p, coverage_type: e.target.value }))}
              >
                <option value="comprehensive">Compreensivo</option>
                <option value="third_party">Terceiros</option>
                <option value="basic">Básico (DPVAT)</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Início da vigência *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Vencimento *</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Valor segurado (R$)</label>
              <input
                type="number"
                value={form.coverage_value}
                onChange={e => setForm(p => ({ ...p, coverage_value: e.target.value }))}
                placeholder="Ex: 80000"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-field">
              <label>Franquia (R$)</label>
              <input
                type="number"
                value={form.deductible}
                onChange={e => setForm(p => ({ ...p, deductible: e.target.value }))}
                placeholder="Ex: 3500"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Prêmio (R$)</label>
              <input
                type="number"
                value={form.premium}
                onChange={e => setForm(p => ({ ...p, premium: e.target.value }))}
                placeholder="Valor pago pelo seguro"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-field">
              <label>Periodicidade do prêmio</label>
              <select
                value={form.premium_period}
                onChange={e => setForm(p => ({ ...p, premium_period: e.target.value }))}
              >
                <option value="annual">Anual</option>
                <option value="semiannual">Semestral</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Observações</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Coberturas adicionais, contato do corretor, sinistros anteriores…"
                rows={2}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {modal === 'edit' && (
              delConfirm ? (
                <div className="delete-confirm">
                  Excluir apólice?
                  <button type="button" className="btn-danger-sm" onClick={del}>Sim</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setDelConfirm(false)}>Não</button>
                </div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setDelConfirm(true)}>Excluir</button>
              )
            )}
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : modal === 'add' ? 'Cadastrar' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}
