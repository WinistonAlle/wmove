import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/multas.css'

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_MAP = {
  pending:   { cls: 'rented',  label: 'Pendente'   },
  paid:      { cls: 'avail',   label: 'Paga'        },
  contested: { cls: 'shop',    label: 'Contestada'  },
}

const RESP_MAP = {
  company: { cls: 'company', label: 'Empresa'   },
  driver:  { cls: 'driver',  label: 'Locatário' },
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatMoney(v) {
  if (!v && v !== 0) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date(new Date().toDateString())
  const due   = new Date(dateStr)
  return Math.ceil((due - today) / 86400000)
}

function DueCell({ dateStr }) {
  const days = daysUntil(dateStr)
  if (days === null) return <span className="due-ok">—</span>
  if (days < 0)   return <span className="overdue">{formatDate(dateStr)} <span style={{ fontSize: 10 }}>({Math.abs(days)}d atr.)</span></span>
  if (days <= 7)  return <span className="due-soon">{formatDate(dateStr)} <span style={{ fontSize: 10 }}>({days}d)</span></span>
  return <span className="due-ok">{formatDate(dateStr)}</span>
}

const EMPTY = {
  vehicle_id:      '',
  plate:           '',
  rental_id:       '',
  infraction:      '',
  infraction_code: '',
  amount:          '',
  infraction_date: '',
  due_date:        '',
  status:          'pending',
  responsibility:  'company',
  notes:           '',
}

// ─── Component ───────────────────────────────────────────────

export default function MultasPage() {
  const { userData } = useUser()
  const [fines, setFines]       = useState([])
  const [vehicles, setVehicles] = useState([])
  const [rentals, setRentals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [delConfirm, setDelConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: f }, { data: v }, { data: r }] = await Promise.all([
      supabase
        .from('fines')
        .select('*, vehicles(plate, brand, model)')
        .order('due_date', { ascending: true }),
      supabase.from('vehicles').select('id, plate, brand, model').order('plate'),
      supabase.from('rentals')
        .select('id, start_date, customers(name)')
        .eq('status', 'active')
        .order('start_date', { ascending: false }),
    ])
    setFines(f || [])
    setVehicles(v || [])
    setRentals(r || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const pending   = fines.filter(f => f.status === 'pending')
    const paid      = fines.filter(f => f.status === 'paid')
    const contested = fines.filter(f => f.status === 'contested')
    const soon      = pending.filter(f => {
      const d = daysUntil(f.due_date)
      return d !== null && d >= 0 && d <= 7
    })
    return {
      pendingTotal:   pending.reduce((s, f) => s + Number(f.amount), 0),
      paidTotal:      paid.reduce((s, f) => s + Number(f.amount), 0),
      soonCount:      soon.length,
      contestedCount: contested.length,
    }
  }, [fines])

  // ── Filters ───────────────────────────────────────────────
  const byFilter = useMemo(() => {
    if (filter === 'all')       return fines
    if (filter === 'soon')      return fines.filter(f => f.status === 'pending' && daysUntil(f.due_date) !== null && daysUntil(f.due_date) >= 0 && daysUntil(f.due_date) <= 7)
    if (filter === 'contested') return fines.filter(f => f.status === 'contested')
    if (filter === 'paid')      return fines.filter(f => f.status === 'paid')
    return fines.filter(f => f.status === 'pending')
  }, [fines, filter])

  const filtered = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(f =>
      `${f.plate} ${f.infraction} ${f.infraction_code || ''}`.toLowerCase().includes(q)
    )
  }, [byFilter, search])

  const counts = useMemo(() => ({
    pending:   fines.filter(f => f.status === 'pending').length,
    soon:      fines.filter(f => f.status === 'pending' && daysUntil(f.due_date) !== null && daysUntil(f.due_date) >= 0 && daysUntil(f.due_date) <= 7).length,
    paid:      fines.filter(f => f.status === 'paid').length,
    contested: fines.filter(f => f.status === 'contested').length,
    all:       fines.length,
  }), [fines])

  // ── Modal ─────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal('add')
  }

  function openEdit(fine) {
    setForm({
      vehicle_id:      fine.vehicle_id      || '',
      plate:           fine.plate           || '',
      rental_id:       fine.rental_id       || '',
      infraction:      fine.infraction      || '',
      infraction_code: fine.infraction_code || '',
      amount:          fine.amount          ?? '',
      infraction_date: fine.infraction_date || '',
      due_date:        fine.due_date        || '',
      status:          fine.status          || 'pending',
      responsibility:  fine.responsibility  || 'company',
      notes:           fine.notes           || '',
      _id:             fine.id,
    })
    setError('')
    setDelConfirm(false)
    setModal('edit')
  }

  // Quando seleciona veículo, preenche placa automaticamente
  function handleVehicleChange(id) {
    const v = vehicles.find(v => v.id === id)
    setForm(p => ({ ...p, vehicle_id: id, plate: v?.plate || p.plate }))
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.plate.trim())      { setError('Informe a placa.'); return }
    if (!form.infraction.trim()) { setError('Informe a infração.'); return }
    if (!form.amount)            { setError('Informe o valor.'); return }
    if (!form.due_date)          { setError('Informe o vencimento.'); return }
    setSaving(true)
    const payload = {
      company_id:      userData.company.id,
      vehicle_id:      form.vehicle_id      || null,
      rental_id:       form.rental_id       || null,
      plate:           form.plate.trim().toUpperCase(),
      infraction:      form.infraction.trim(),
      infraction_code: form.infraction_code.trim() || null,
      amount:          Number(form.amount),
      infraction_date: form.infraction_date || null,
      due_date:        form.due_date,
      status:          form.status,
      responsibility:  form.responsibility,
      notes:           form.notes.trim() || null,
    }
    if (modal === 'add') {
      const { error: err } = await supabase.from('fines').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('fines').update(payload).eq('id', form._id)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function del() {
    await supabase.from('fines').delete().eq('id', form._id)
    setModal(null)
    load()
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Multas</h1>
      <p>
        {loading ? '…' : `${counts.pending} pendente${counts.pending !== 1 ? 's' : ''} · ${formatMoney(kpis.pendingTotal)} em aberto`}
      </p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Registrar multa
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* KPIs */}
      <div className="fine-kpis">
        <div className="fine-kpi glass">
          <div className="fine-kpi-label">Total pendente</div>
          <div className="fine-kpi-value danger num">{formatMoney(kpis.pendingTotal)}</div>
          <div className="fine-kpi-sub">{counts.pending} multa{counts.pending !== 1 ? 's' : ''}</div>
        </div>
        <div className="fine-kpi glass">
          <div className="fine-kpi-label">A vencer em 7 dias</div>
          <div className="fine-kpi-value amber num">{kpis.soonCount}</div>
          <div className="fine-kpi-sub">{kpis.soonCount === 0 ? 'Nenhuma urgente' : 'requer atenção'}</div>
        </div>
        <div className="fine-kpi glass">
          <div className="fine-kpi-label">Total pago</div>
          <div className="fine-kpi-value emerald num">{formatMoney(kpis.paidTotal)}</div>
          <div className="fine-kpi-sub">{counts.paid} quitada{counts.paid !== 1 ? 's' : ''}</div>
        </div>
        <div className="fine-kpi glass">
          <div className="fine-kpi-label">Contestadas</div>
          <div className="fine-kpi-value num">{kpis.contestedCount}</div>
          <div className="fine-kpi-sub">em recurso</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'pending',   label: 'Pendentes',     count: counts.pending   },
            { key: 'soon',      label: 'A vencer',      count: counts.soon      },
            { key: 'contested', label: 'Contestadas',   count: counts.contested },
            { key: 'paid',      label: 'Pagas',         count: counts.paid      },
            { key: 'all',       label: 'Todas',         count: counts.all       },
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
            placeholder="Placa, infração ou código AIT…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando multas…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {fines.length === 0 ? 'Nenhuma multa registrada.' : 'Nenhuma multa corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="ftable-head">
              <span>Data infração</span>
              <span>Placa / Veículo</span>
              <span>Infração</span>
              <span>Vencimento</span>
              <span>Valor</span>
              <span>Responsável</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map(fine => {
              const s = STATUS_MAP[fine.status] || { cls: 'shop', label: fine.status }
              const r = RESP_MAP[fine.responsibility] || { cls: 'company', label: fine.responsibility }
              return (
                <div key={fine.id} className="ftable-row gtable-row" onClick={() => openEdit(fine)}>
                  <div className="gtable-muted">{formatDate(fine.infraction_date)}</div>
                  <div>
                    <div className="plate" style={{ fontSize: 11 }}>{fine.plate}</div>
                    {fine.vehicles && (
                      <div className="gtable-muted">{fine.vehicles.brand} {fine.vehicles.model}</div>
                    )}
                  </div>
                  <div>
                    <div className="gtable-cell" style={{ fontSize: 13 }}>{fine.infraction}</div>
                    {fine.infraction_code && (
                      <div className="gtable-muted">AIT {fine.infraction_code}</div>
                    )}
                  </div>
                  <DueCell dateStr={fine.due_date} />
                  <div className="gtable-cell num" style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {formatMoney(fine.amount)}
                  </div>
                  <span className={`resp-badge ${r.cls}`}>{r.label}</span>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  <button
                    className="row-btn"
                    onClick={e => { e.stopPropagation(); openEdit(fine) }}
                    title="Editar"
                  >
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
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Registrar multa' : 'Editar multa'} wide>
        {/* API stub */}
        <div className="api-stub">
          <div className="api-stub-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <div className="api-stub-title">Consulta automática por placa</div>
            <div className="api-stub-desc">
              Configure uma chave de API de consulta de multas em <strong>Configurações → Integrações</strong> para buscar infrações automaticamente via placa.
            </div>
          </div>
        </div>

        <form className="dash-form" onSubmit={save}>
          <div className="form-row">
            <div className="form-field">
              <label>Veículo da frota</label>
              <select
                value={form.vehicle_id}
                onChange={e => handleVehicleChange(e.target.value)}
              >
                <option value="">Veículo externo / manual</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Placa *</label>
              <input
                value={form.plate}
                onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))}
                placeholder="ABC1D23"
                required
              />
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Descrição da infração *</label>
              <input
                value={form.infraction}
                onChange={e => setForm(p => ({ ...p, infraction: e.target.value }))}
                placeholder="Ex: Excesso de velocidade até 20% acima do limite"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Nº AIT / Código</label>
              <input
                value={form.infraction_code}
                onChange={e => setForm(p => ({ ...p, infraction_code: e.target.value }))}
                placeholder="Ex: 5541321"
              />
            </div>
            <div className="form-field">
              <label>Valor (R$) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Data da infração</label>
              <input
                type="date"
                value={form.infraction_date}
                onChange={e => setForm(p => ({ ...p, infraction_date: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Vencimento *</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Responsabilidade</label>
              <select
                value={form.responsibility}
                onChange={e => setForm(p => ({ ...p, responsibility: e.target.value }))}
              >
                <option value="company">Empresa</option>
                <option value="driver">Locatário</option>
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Paga</option>
                <option value="contested">Contestada</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Locação associada</label>
              <select
                value={form.rental_id}
                onChange={e => setForm(p => ({ ...p, rental_id: e.target.value }))}
              >
                <option value="">Nenhuma / não identificada</option>
                {rentals.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.customers?.name} — desde {formatDate(r.start_date)}
                  </option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Observações</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Recurso protocolado, prazo, contato do locatário…"
                rows={2}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {modal === 'edit' && (
              delConfirm ? (
                <div className="delete-confirm">
                  Excluir multa?
                  <button type="button" className="btn-danger-sm" onClick={del}>Sim</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setDelConfirm(false)}>Não</button>
                </div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setDelConfirm(true)}>
                  Excluir
                </button>
              )
            )}
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : modal === 'add' ? 'Registrar' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}
