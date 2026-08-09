import { useState, useEffect, useMemo, useCallback } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import '../styles/combustivel.css'

const FUEL_TYPES = [
  { value: 'gasoline', label: 'Gasolina',  color: '#f59e0b' },
  { value: 'ethanol',  label: 'Etanol',    color: '#10b981' },
  { value: 'diesel',   label: 'Diesel',    color: '#6366f1' },
  { value: 'gnv',      label: 'GNV',       color: '#0ea5e9' },
  { value: 'flex',     label: 'Flex',      color: '#8b5cf6' },
]
const FUEL_MAP = Object.fromEntries(FUEL_TYPES.map(t => [t.value, t]))

const BLANK = {
  vehicle_id: '', date: new Date().toISOString().slice(0, 10),
  liters: '', price_per_liter: '', odometer: '',
  fuel_type: 'gasoline', station: '', full_tank: true, notes: '',
}

const fmt  = (n, d = 2) => n == null ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtR = (n) => n == null ? '—' : `R$ ${fmt(n)}`
const fmtDate = (str) => { if (!str) return '—'; const [y,m,d] = str.split('-'); return `${d}/${m}/${y}` }

// ── bar chart (6 months, cost per month) ─────────────────
function MonthlyChart({ entries }) {
  const months = useMemo(() => {
    const map = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      map[key] = 0
    }
    for (const e of entries) {
      const key = e.date.slice(0, 7)
      if (key in map) map[key] += Number(e.total_cost)
    }
    return Object.entries(map).map(([k, v]) => ({ key: k, val: v, label: k.slice(5) }))
  }, [entries])

  const max = Math.max(...months.map(m => m.val), 1)

  return (
    <div className="fuel-chart">
      {months.map(m => (
        <div key={m.key} className="fuel-col">
          <span className="fuel-col-val">{m.val > 0 ? `R$${Math.round(m.val)}` : ''}</span>
          <div className="fuel-bar-wrap">
            <div className="fuel-bar" style={{ height: `${(m.val / max) * 100}%` }} />
          </div>
          <span className="fuel-col-label">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── top vehicles by cost ──────────────────────────────────
function VehicleRanking({ entries, vehicles }) {
  const ranked = useMemo(() => {
    const map = {}
    for (const e of entries) {
      if (!map[e.vehicle_id]) map[e.vehicle_id] = { cost: 0, liters: 0, fills: 0 }
      map[e.vehicle_id].cost   += Number(e.total_cost)
      map[e.vehicle_id].liters += Number(e.liters)
      map[e.vehicle_id].fills  += 1
    }
    return Object.entries(map)
      .map(([vid, s]) => ({
        ...s,
        plate: vehicles.find(v => v.id === vid)?.plate ?? '—',
        model: vehicles.find(v => v.id === vid)?.model ?? '',
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
  }, [entries, vehicles])

  const max = ranked[0]?.cost ?? 1

  return (
    <div className="fuel-ranking">
      {ranked.length === 0 ? (
        <p className="fuel-ranking-empty">Nenhum dado ainda</p>
      ) : ranked.map((r, i) => (
        <div key={r.plate} className="fuel-rank-row">
          <span className="fuel-rank-num">{i + 1}</span>
          <div className="fuel-rank-info">
            <span className="fuel-rank-plate">{r.plate}</span>
            <span className="fuel-rank-model">{r.model}</span>
          </div>
          <div className="fuel-rank-bar-wrap">
            <div className="fuel-rank-bar" style={{ width: `${(r.cost / max) * 100}%` }} />
          </div>
          <span className="fuel-rank-val">{fmtR(r.cost)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CombustivelPage() {
  const { userData } = useUser()
  const companyId = userData?.company?.id

  const [entries, setEntries]   = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)
  const [filterVeh, setFilterVeh] = useState('')
  const [filterType, setFilterType] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: e }, { data: v }] = await Promise.all([
      supabase.from('fuel_entries').select('*').order('date', { ascending: false }),
      supabase.from('vehicles').select('id, plate, model'),
    ])
    setEntries(e ?? [])
    setVehicles(v ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs (current month) ───────────────────────────────
  const kpis = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    const month = entries.filter(e => e.date.startsWith(thisMonth))
    const totalCost   = month.reduce((s, e) => s + Number(e.total_cost), 0)
    const totalLiters = month.reduce((s, e) => s + Number(e.liters), 0)
    const avgPrice    = totalLiters > 0 ? totalCost / totalLiters : null

    // compute km/L for vehicles with sequential odometer readings
    const byVehicle = {}
    for (const e of [...entries].sort((a,b) => a.date.localeCompare(b.date))) {
      if (!e.odometer || !e.full_tank) continue
      if (!byVehicle[e.vehicle_id]) byVehicle[e.vehicle_id] = []
      byVehicle[e.vehicle_id].push(e)
    }
    let totalKm = 0, totalL = 0
    for (const arr of Object.values(byVehicle)) {
      for (let i = 1; i < arr.length; i++) {
        const km = arr[i].odometer - arr[i-1].odometer
        const l  = Number(arr[i].liters)
        if (km > 0 && km < 3000) { totalKm += km; totalL += l }
      }
    }
    const avgKmL = totalL > 0 ? totalKm / totalL : null

    return { totalCost, totalLiters, avgPrice, avgKmL }
  }, [entries])

  const filtered = useMemo(() => {
    let list = entries
    if (filterVeh)  list = list.filter(e => e.vehicle_id === filterVeh)
    if (filterType) list = list.filter(e => e.fuel_type  === filterType)
    return list
  }, [entries, filterVeh, filterType])

  // ── modal helpers ──────────────────────────────────────
  function openNew() {
    setEditing(null)
    setForm({ ...BLANK, vehicle_id: vehicles[0]?.id ?? '' })
    setModal(true)
  }
  function openEdit(e) {
    setEditing(e)
    setForm({
      vehicle_id: e.vehicle_id, date: e.date,
      liters: e.liters, price_per_liter: e.price_per_liter,
      odometer: e.odometer ?? '', fuel_type: e.fuel_type,
      station: e.station ?? '', full_tank: e.full_tank,
      notes: e.notes ?? '',
    })
    setModal(true)
  }

  const total = useMemo(() => {
    const l = parseFloat(form.liters)
    const p = parseFloat(form.price_per_liter)
    return !isNaN(l) && !isNaN(p) ? l * p : null
  }, [form.liters, form.price_per_liter])

  async function handleSave() {
    if (!form.vehicle_id || !form.date || !form.liters || !form.price_per_liter || !companyId) return
    setSaving(true)
    const payload = {
      company_id:      companyId,
      vehicle_id:      form.vehicle_id,
      date:            form.date,
      liters:          parseFloat(form.liters),
      price_per_liter: parseFloat(form.price_per_liter),
      total_cost:      total,
      odometer:        form.odometer ? parseInt(form.odometer) : null,
      fuel_type:       form.fuel_type,
      station:         form.station || null,
      full_tank:       form.full_tank,
      notes:           form.notes || null,
    }
    if (editing) {
      await supabase.from('fuel_entries').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('fuel_entries').insert(payload)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir abastecimento?')) return
    await supabase.from('fuel_entries').delete().eq('id', id)
    load()
  }

  const plateof = (id) => vehicles.find(v => v.id === id)?.plate ?? '—'

  return (
    <DashboardLayout
      topbarLeft={<h1 className="page-title">Combustível</h1>}
      topbarRight={
        <button className="btn-add" onClick={openNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15}}><path d="M12 5v14M5 12h14"/></svg>
          Abastecimento
        </button>
      }
    >
      <div className="page-content">

        {/* KPIs */}
        <div className="fuel-kpis">
          <div className="metric-card">
            <span className="metric-label">Gasto este mês</span>
            <span className="metric-val">{fmtR(kpis.totalCost)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Litros este mês</span>
            <span className="metric-val">{fmt(kpis.totalLiters, 1)} L</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Preço médio/L</span>
            <span className="metric-val">{kpis.avgPrice != null ? `R$ ${fmt(kpis.avgPrice, 3)}` : '—'}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Consumo médio</span>
            <span className="metric-val">{kpis.avgKmL != null ? `${fmt(kpis.avgKmL, 1)} km/L` : '—'}</span>
          </div>
        </div>

        {/* Charts */}
        <div className="fuel-panels">
          <div className="card fuel-chart-card">
            <div className="card-header">
              <span className="card-title">Custo mensal</span>
              <span className="card-sub">últimos 6 meses</span>
            </div>
            <MonthlyChart entries={entries} />
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Top veículos</span>
              <span className="card-sub">por custo total</span>
            </div>
            <VehicleRanking entries={entries} vehicles={vehicles} />
          </div>
        </div>

        {/* Filters */}
        <div className="table-toolbar">
          <select
            className="form-input"
            style={{ maxWidth: 200 }}
            value={filterVeh}
            onChange={e => setFilterVeh(e.target.value)}
          >
            <option value="">Todos os veículos</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
          </select>
          <select
            className="form-input"
            style={{ maxWidth: 160 }}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Todos os combustíveis</option>
            {FUEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="fuel-head">
            <span>Data</span>
            <span>Veículo</span>
            <span>Combustível</span>
            <span>Litros</span>
            <span>Preço/L</span>
            <span>Total</span>
            <span>Odômetro</span>
            <span>Posto</span>
            <span></span>
          </div>

          {loading ? (
            <div className="loading-state">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>Nenhum abastecimento registrado.</p></div>
          ) : filtered.map(e => {
            const ft = FUEL_MAP[e.fuel_type] ?? FUEL_MAP.gasoline
            return (
              <div key={e.id} className="fuel-row">
                <span className="fuel-date">{fmtDate(e.date)}</span>
                <span className="fuel-plate">{plateof(e.vehicle_id)}</span>
                <span>
                  <span className="fuel-type-pill" style={{ color: ft.color, background: ft.color + '18' }}>
                    {ft.label}
                  </span>
                </span>
                <span className="fuel-num">{fmt(e.liters, 2)} L</span>
                <span className="fuel-num">R$ {fmt(e.price_per_liter, 3)}</span>
                <span className="fuel-num fuel-total">R$ {fmt(e.total_cost)}</span>
                <span className="fuel-num">{e.odometer ? `${e.odometer.toLocaleString('pt-BR')} km` : '—'}</span>
                <span className="fuel-station">{e.station || '—'}</span>
                <span className="row-actions">
                  <button className="icon-btn" onClick={() => openEdit(e)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(e.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar abastecimento' : 'Novo abastecimento'}>
        <div className="modal-form-grid">
          <div className="form-group">
            <label>Veículo *</label>
            <select className="form-input" value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
              <option value="">Selecione…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Data *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Combustível *</label>
            <select className="form-input" value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}>
              {FUEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Litros *</label>
            <input
              type="number" step="0.01" min="0" className="form-input"
              placeholder="0,00"
              value={form.liters}
              onChange={e => setForm(f => ({ ...f, liters: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Preço por litro (R$) *</label>
            <input
              type="number" step="0.001" min="0" className="form-input"
              placeholder="0,000"
              value={form.price_per_liter}
              onChange={e => setForm(f => ({ ...f, price_per_liter: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Total calculado</label>
            <div className="fuel-total-preview">
              {total != null ? `R$ ${fmt(total)}` : '—'}
            </div>
          </div>

          <div className="form-group">
            <label>Odômetro (km)</label>
            <input
              type="number" min="0" className="form-input"
              placeholder="Ex.: 45000"
              value={form.odometer}
              onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Posto</label>
            <input
              className="form-input"
              placeholder="Nome do posto"
              value={form.station}
              onChange={e => setForm(f => ({ ...f, station: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="fuel-check-label">
              <input
                type="checkbox"
                checked={form.full_tank}
                onChange={e => setForm(f => ({ ...f, full_tank: e.target.checked }))}
              />
              Tanque cheio (usado para calcular consumo km/L)
            </label>
          </div>

          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Observações</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={saving || !form.vehicle_id || !form.liters || !form.price_per_liter}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
