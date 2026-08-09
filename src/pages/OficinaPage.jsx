import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/oficina.css'

// ─── Helpers ─────────────────────────────────────────────────

const TYPE_MAP = {
  preventive: { label: 'Preventiva', cls: 'avail'  },
  corrective: { label: 'Corretiva',  cls: 'rented' },
  revision:   { label: 'Revisão',    cls: 'shop'   },
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

function isOverdue(date) {
  return date && new Date(date) < new Date(new Date().toDateString())
}

const EMPTY = {
  vehicle_id: '',
  type: 'preventive',
  description: '',
  cost: '',
  date: new Date().toISOString().slice(0, 10),
  mileage: '',
  completed: false,
}

// ─── Component ───────────────────────────────────────────────

export default function OficinaPage() {
  const { userData } = useUser()
  const [maintenances, setMaintenances] = useState([])
  const [vehicles, setVehicles]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('pending')
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(null) // null | 'add' | 'edit'
  const [form, setForm]                 = useState(EMPTY)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [delConfirm, setDelConfirm]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: m }, { data: v }] = await Promise.all([
      supabase
        .from('maintenances')
        .select('*, vehicles(plate, brand, model)')
        .order('date', { ascending: false }),
      supabase.from('vehicles').select('id, plate, brand, model').order('plate'),
    ])
    setMaintenances(m || [])
    setVehicles(v || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal('add')
  }

  function openEdit(m) {
    setForm({
      vehicle_id:  m.vehicle_id,
      type:        m.type,
      description: m.description || '',
      cost:        m.cost ?? '',
      date:        m.date || '',
      mileage:     m.mileage ?? '',
      completed:   m.completed,
      _id:         m.id,
    })
    setError('')
    setDelConfirm(false)
    setModal('edit')
  }

  function closeModal() { setModal(null) }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.vehicle_id) { setError('Selecione um veículo.'); return }
    if (!form.description.trim()) { setError('Informe a descrição.'); return }
    setSaving(true)
    const payload = {
      vehicle_id:  form.vehicle_id,
      type:        form.type,
      description: form.description.trim(),
      cost:        form.cost !== '' ? Number(form.cost) : null,
      date:        form.date,
      mileage:     form.mileage !== '' ? Number(form.mileage) : null,
      completed:   form.completed,
      company_id:  userData.company.id,
    }
    if (modal === 'add') {
      await supabase.from('maintenances').insert(payload)
    } else {
      await supabase.from('maintenances').update(payload).eq('id', form._id)
    }
    setSaving(false)
    closeModal()
    load()
  }

  async function del() {
    await supabase.from('maintenances').delete().eq('id', form._id)
    closeModal()
    load()
  }

  async function toggleComplete(m) {
    await supabase.from('maintenances').update({ completed: !m.completed }).eq('id', m.id)
    load()
  }

  // ── Filters ─────────────────────────────────────────────
  const byFilter = filter === 'all'
    ? maintenances
    : filter === 'pending'
    ? maintenances.filter(m => !m.completed)
    : maintenances.filter(m => m.completed)

  const filtered = search.trim()
    ? byFilter.filter(m => {
        const v = m.vehicles
        return `${v?.plate || ''} ${v?.brand || ''} ${v?.model || ''} ${m.description || ''}`
          .toLowerCase().includes(search.toLowerCase())
      })
    : byFilter

  const counts = {
    all:       maintenances.length,
    pending:   maintenances.filter(m => !m.completed).length,
    completed: maintenances.filter(m => m.completed).length,
  }

  // ── Cost by vehicle ──────────────────────────────────────
  const costByVehicle = {}
  maintenances.filter(m => m.completed && m.cost).forEach(m => {
    const id = m.vehicle_id
    if (!costByVehicle[id]) costByVehicle[id] = { vehicle: m.vehicles, total: 0 }
    costByVehicle[id].total += Number(m.cost)
  })
  const topCosts = Object.values(costByVehicle)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxCost = topCosts[0]?.total || 1

  const topbarLeft = (
    <div className="greet">
      <h1>Oficina</h1>
      <p>{loading ? '…' : `${counts.pending} pendente${counts.pending !== 1 ? 's' : ''} · ${counts.completed} concluída${counts.completed !== 1 ? 's' : ''}`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Nova OS
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'pending',   label: 'Pendentes',   count: counts.pending   },
            { key: 'completed', label: 'Concluídas',  count: counts.completed },
            { key: 'all',       label: 'Todas',       count: counts.all       },
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
            placeholder="Buscar por veículo ou descrição…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando ordens de serviço…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {maintenances.length === 0 ? 'Nenhuma OS registrada ainda.' : 'Nenhuma OS corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="otable-head">
              <span>Data</span>
              <span>Veículo</span>
              <span>Tipo</span>
              <span>Descrição</span>
              <span>Km</span>
              <span>Custo</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map(m => {
              const t = TYPE_MAP[m.type] || { label: m.type, cls: 'shop' }
              const overdue = !m.completed && isOverdue(m.date)
              return (
                <div
                  key={m.id}
                  className={`otable-row gtable-row${m.completed ? ' completed-row' : ''}`}
                  onClick={() => openEdit(m)}
                >
                  <div className="gtable-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {formatDate(m.date)}
                    {overdue && <span className="late-badge">atrasada</span>}
                  </div>
                  <div>
                    <div className="plate" style={{ fontSize: 11 }}>{m.vehicles?.plate || '—'}</div>
                    <div className="gtable-muted">{m.vehicles ? `${m.vehicles.brand} ${m.vehicles.model}` : ''}</div>
                  </div>
                  <span className={`badge ${t.cls}`}>{t.label}</span>
                  <div className="gtable-cell os-desc">{m.description}</div>
                  <div className="gtable-muted">{m.mileage ? `${Number(m.mileage).toLocaleString('pt-BR')} km` : '—'}</div>
                  <div className="gtable-cell num" style={{ fontSize: 13 }}>{formatMoney(m.cost)}</div>
                  <button
                    className={`os-check${m.completed ? ' done' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleComplete(m) }}
                    title={m.completed ? 'Marcar pendente' : 'Marcar concluída'}
                  >
                    {m.completed
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                    }
                  </button>
                  <button className="row-btn" onClick={e => { e.stopPropagation(); openEdit(m) }} title="Editar">
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

      {/* ── Custos por veículo ─────────────────────────────── */}
      {topCosts.length > 0 && (
        <div className="dash-card glass" style={{ marginTop: 20 }}>
          <div className="card-head">
            <div>
              <h3 className="card-title">Custo por veículo</h3>
              <div className="card-subtitle">Baseado em OS concluídas com custo registrado</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {topCosts.map((vc, i) => (
              <div key={i} className="top-vehicle-row">
                <div className="top-vehicle-rank">{i + 1}</div>
                <span className="plate" style={{ fontSize: 11 }}>{vc.vehicle?.plate || '—'}</span>
                <div className="top-vehicle-name">
                  <div>{vc.vehicle ? `${vc.vehicle.brand} ${vc.vehicle.model}` : '—'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="occu-bar" style={{ height: 6 }}>
                    <div className="occu-fill" style={{ width: `${(vc.total / maxCost) * 100}%`, background: 'var(--danger)' }} />
                  </div>
                </div>
                <div className="top-vehicle-total num">{formatMoney(vc.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────── */}
      <Modal open={!!modal} onClose={closeModal} title={modal === 'add' ? 'Nova ordem de serviço' : 'Editar OS'}>
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
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Tipo *</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              >
                <option value="preventive">Preventiva</option>
                <option value="corrective">Corretiva</option>
                <option value="revision">Revisão</option>
              </select>
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Descrição *</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Troca de óleo + filtros"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Data</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Quilometragem</label>
              <input
                type="number"
                value={form.mileage}
                onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))}
                placeholder="Ex: 45000"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Custo (R$)</label>
              <input
                type="number"
                value={form.cost}
                onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-field" style={{ justifyContent: 'flex-end' }}>
              <label className="toggle-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.completed}
                  onChange={e => setForm(p => ({ ...p, completed: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13 }}>Marcar como concluída</span>
              </label>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {modal === 'edit' && (
              delConfirm ? (
                <div className="delete-confirm">
                  Excluir OS?
                  <button type="button" className="btn-danger-sm" onClick={del}>Sim, excluir</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setDelConfirm(false)}>Não</button>
                </div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setDelConfirm(true)}>
                  Excluir
                </button>
              )
            )}
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : modal === 'add' ? 'Criar OS' : 'Salvar'}
              </button>
            </div>
          </div>

        </form>
      </Modal>

    </DashboardLayout>
  )
}
