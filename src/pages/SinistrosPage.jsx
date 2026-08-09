import { useState, useEffect, useMemo, useCallback } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import '../styles/sinistros.css'

const TYPES = [
  { value: 'accident',  label: 'Acidente',   color: '#ef4444' },
  { value: 'theft',     label: 'Roubo/Furto', color: '#8b5cf6' },
  { value: 'vandalism', label: 'Vandalismo',  color: '#f59e0b' },
  { value: 'flood',     label: 'Alagamento',  color: '#0ea5e9' },
  { value: 'fire',      label: 'Incêndio',    color: '#f97316' },
  { value: 'other',     label: 'Outro',       color: '#6b7280' },
]
const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.value, t]))

const STATUSES = [
  { value: 'open',        label: 'Aberto',       color: '#ef4444' },
  { value: 'in_progress', label: 'Em andamento',  color: '#f59e0b' },
  { value: 'resolved',    label: 'Resolvido',     color: '#10b981' },
  { value: 'cancelled',   label: 'Cancelado',     color: '#6b7280' },
]
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.value, s]))

const STATUS_TABS = ['Todos', 'Aberto', 'Em andamento', 'Resolvido']

const BLANK = {
  vehicle_id: '', rental_id: '', customer_id: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'accident', description: '', location: '',
  third_party: false, third_party_info: '',
  police_report: '', insurance_claim: '',
  status: 'open', repair_cost: '', franchise: '',
  franchise_paid: false, resolution_notes: '', resolved_at: '', notes: '',
}

const fmtR    = n  => n == null || n === '' ? '—' : `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const fmtDate = str => { if (!str) return '—'; const [y,m,d] = str.split('-'); return `${d}/${m}/${y}` }

export default function SinistrosPage() {
  const { userData } = useUser()
  const companyId = userData?.company?.id

  const [rows, setRows]         = useState([])
  const [vehicles, setVehicles] = useState([])
  const [rentals, setRentals]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('Todos')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)
  const [delConfirm, setDelConfirm] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: v }, { data: r }, { data: c }] = await Promise.all([
      supabase.from('sinistros').select('*').order('date', { ascending: false }),
      supabase.from('vehicles').select('id, plate, model'),
      supabase.from('rentals').select('id, vehicle_id, customer_id, start_date').eq('status', 'active'),
      supabase.from('customers').select('id, name'),
    ])
    setRows(s ?? [])
    setVehicles(v ?? [])
    setRentals(r ?? [])
    setCustomers(c ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const open    = rows.filter(r => r.status === 'open').length
    const ongoing = rows.filter(r => r.status === 'in_progress').length
    const totalRepair = rows.reduce((s, r) => s + (Number(r.repair_cost) || 0), 0)
    const franchisePending = rows
      .filter(r => r.franchise && !r.franchise_paid)
      .reduce((s, r) => s + Number(r.franchise), 0)
    return { open, ongoing, totalRepair, franchisePending }
  }, [rows])

  const filtered = useMemo(() => {
    if (tab === 'Todos') return rows
    const s = STATUSES.find(s => s.label === tab)
    return s ? rows.filter(r => r.status === s.value) : rows
  }, [rows, tab])

  // ── modal ──────────────────────────────────────────────
  function openNew() {
    setEditing(null)
    setForm({ ...BLANK, vehicle_id: vehicles[0]?.id ?? '' })
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      vehicle_id: row.vehicle_id, rental_id: row.rental_id ?? '',
      customer_id: row.customer_id ?? '',
      date: row.date, type: row.type,
      description: row.description, location: row.location ?? '',
      third_party: row.third_party, third_party_info: row.third_party_info ?? '',
      police_report: row.police_report ?? '', insurance_claim: row.insurance_claim ?? '',
      status: row.status, repair_cost: row.repair_cost ?? '',
      franchise: row.franchise ?? '', franchise_paid: row.franchise_paid,
      resolution_notes: row.resolution_notes ?? '',
      resolved_at: row.resolved_at ?? '', notes: row.notes ?? '',
    })
    setModal(true)
  }

  // auto-fill customer when rental is selected
  function handleRentalChange(rentalId) {
    const rental = rentals.find(r => r.id === rentalId)
    setForm(f => ({
      ...f,
      rental_id: rentalId,
      vehicle_id: rental?.vehicle_id ?? f.vehicle_id,
      customer_id: rental?.customer_id ?? f.customer_id,
    }))
  }

  async function handleSave() {
    if (!form.vehicle_id || !form.date || !form.description || !companyId) return
    setSaving(true)
    const payload = {
      company_id:       companyId,
      vehicle_id:       form.vehicle_id,
      rental_id:        form.rental_id || null,
      customer_id:      form.customer_id || null,
      date:             form.date,
      type:             form.type,
      description:      form.description,
      location:         form.location || null,
      third_party:      form.third_party,
      third_party_info: form.third_party_info || null,
      police_report:    form.police_report || null,
      insurance_claim:  form.insurance_claim || null,
      status:           form.status,
      repair_cost:      form.repair_cost !== '' ? parseFloat(form.repair_cost) : null,
      franchise:        form.franchise !== '' ? parseFloat(form.franchise) : null,
      franchise_paid:   form.franchise_paid,
      resolution_notes: form.resolution_notes || null,
      resolved_at:      form.resolved_at || null,
      notes:            form.notes || null,
    }
    if (editing) {
      await supabase.from('sinistros').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('sinistros').insert(payload)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('sinistros').delete().eq('id', id)
    setDelConfirm(null)
    load()
  }

  const plateof    = id => vehicles.find(v => v.id === id)?.plate ?? '—'
  const customerof = id => customers.find(c => c.id === id)?.name ?? '—'

  return (
    <DashboardLayout
      topbarLeft={<h1 className="page-title">Sinistros</h1>}
      topbarRight={
        <button className="btn-add" onClick={openNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}><path d="M12 5v14M5 12h14"/></svg>
          Novo sinistro
        </button>
      }
    >
      <div className="page-content">

        {/* KPIs */}
        <div className="sin-kpis">
          <div className="metric-card">
            <span className="metric-label">Em aberto</span>
            <span className="metric-val" style={{ color: 'var(--danger)' }}>{loading ? '—' : kpis.open}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Em andamento</span>
            <span className="metric-val" style={{ color: 'var(--amber)' }}>{loading ? '—' : kpis.ongoing}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Custo total reparo</span>
            <span className="metric-val">{loading ? '—' : fmtR(kpis.totalRepair)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Franquia a receber</span>
            <span className="metric-val" style={{ color: 'var(--amber)' }}>{loading ? '—' : fmtR(kpis.franchisePending)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="period-tabs">
          {STATUS_TABS.map(t => (
            <button key={t} className={`period-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sin-head">
            <span>Data</span>
            <span>Veículo</span>
            <span>Tipo</span>
            <span>Descrição</span>
            <span>Locatário</span>
            <span>Reparo</span>
            <span>Franquia</span>
            <span>Status</span>
            <span></span>
          </div>

          {loading ? (
            <div className="loading-state">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>Nenhum sinistro{tab !== 'Todos' ? ` ${tab.toLowerCase()}` : ''}.</p></div>
          ) : filtered.map(row => {
            const tp  = TYPE_MAP[row.type]   ?? TYPE_MAP.other
            const st  = STATUS_MAP[row.status] ?? STATUS_MAP.open
            return (
              <div key={row.id} className="sin-row">
                <span className="sin-date">{fmtDate(row.date)}</span>
                <span className="sin-plate">{plateof(row.vehicle_id)}</span>
                <span>
                  <span className="sin-type-pill" style={{ color: tp.color, background: tp.color + '18' }}>
                    {tp.label}
                  </span>
                </span>
                <span className="sin-desc">{row.description}</span>
                <span className="sin-customer">
                  {row.customer_id ? customerof(row.customer_id) : '—'}
                </span>
                <span className="sin-val">{fmtR(row.repair_cost)}</span>
                <span>
                  {row.franchise ? (
                    <span className={`sin-franchise${row.franchise_paid ? ' paid' : ''}`}>
                      {fmtR(row.franchise)}
                      {row.franchise_paid ? ' ✓' : ''}
                    </span>
                  ) : '—'}
                </span>
                <span>
                  <span className="sin-status-pill" style={{ color: st.color, background: st.color + '18' }}>
                    {st.label}
                  </span>
                </span>
                <span className="row-actions">
                  {delConfirm === row.id ? (
                    <span className="del-confirm-inline">
                      Excluir?
                      <button className="btn-danger-sm" onClick={() => handleDelete(row.id)}>Sim</button>
                      <button className="btn-ghost-sm" onClick={() => setDelConfirm(null)}>Não</button>
                    </span>
                  ) : (
                    <>
                      <button className="icon-btn" onClick={() => openEdit(row)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="icon-btn danger" onClick={() => setDelConfirm(row.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar sinistro' : 'Novo sinistro'} wide>
        <div className="modal-form-grid">

          {/* Rental lookup */}
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Locação vinculada (opcional — preenche veículo e cliente automaticamente)</label>
            <select className="form-input" value={form.rental_id} onChange={e => handleRentalChange(e.target.value)}>
              <option value="">— nenhuma —</option>
              {rentals.map(r => (
                <option key={r.id} value={r.id}>
                  {vehicles.find(v => v.id === r.vehicle_id)?.plate} · {customers.find(c => c.id === r.customer_id)?.name} · desde {fmtDate(r.start_date)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Veículo *</label>
            <select className="form-input" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">Selecione…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Data do sinistro *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Tipo *</label>
            <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Descrição *</label>
            <textarea className="form-input" rows={2} placeholder="Descreva o ocorrido…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Local do sinistro</label>
            <input className="form-input" placeholder="Rua, cidade ou ponto de referência" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>B.O. / Número do registro</label>
            <input className="form-input" placeholder="Ex.: BO-2026/123" value={form.police_report} onChange={e => setForm(f => ({ ...f, police_report: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Nº apólice / sinistro seguro</label>
            <input className="form-input" placeholder="Ex.: SNS-00123" value={form.insurance_claim} onChange={e => setForm(f => ({ ...f, insurance_claim: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Custo do reparo (R$)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0,00" value={form.repair_cost} onChange={e => setForm(f => ({ ...f, repair_cost: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Franquia cobrada do locatário (R$)</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="0,00" value={form.franchise} onChange={e => setForm(f => ({ ...f, franchise: e.target.value }))} />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <div className="sin-checks-row">
              <label className="sin-check-label">
                <input type="checkbox" checked={form.third_party} onChange={e => setForm(f => ({ ...f, third_party: e.target.checked }))} />
                Envolveu terceiros
              </label>
              <label className="sin-check-label">
                <input type="checkbox" checked={form.franchise_paid} onChange={e => setForm(f => ({ ...f, franchise_paid: e.target.checked }))} />
                Franquia recebida
              </label>
            </div>
          </div>

          {form.third_party && (
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Dados do terceiro</label>
              <textarea className="form-input" rows={2} placeholder="Nome, placa, contato…" value={form.third_party_info} onChange={e => setForm(f => ({ ...f, third_party_info: e.target.value }))} />
            </div>
          )}

          {form.status === 'resolved' && (
            <>
              <div className="form-group">
                <label>Data de resolução</label>
                <input type="date" className="form-input" value={form.resolved_at} onChange={e => setForm(f => ({ ...f, resolved_at: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Observações da resolução</label>
                <input className="form-input" value={form.resolution_notes} onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))} />
              </div>
            </>
          )}

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Notas internas</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving || !form.vehicle_id || !form.description}
          >
            {saving ? 'Salvando…' : 'Salvar sinistro'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
