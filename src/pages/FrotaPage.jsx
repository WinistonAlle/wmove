import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import '../styles/inner.css'
import '../styles/frota.css'

const PAGE_SIZE = 20

// ─── Constants ───────────────────────────────────────────────

const STATUS_MAP = {
  available:   { cls: 'avail',  label: 'disponível' },
  rented:      { cls: 'rented', label: 'alugado'    },
  maintenance: { cls: 'shop',   label: 'oficina'    },
  inactive:    { cls: 'shop',   label: 'inativo'    },
}

const STATUS_OPTS = [
  { value: 'available',   label: 'Disponível'  },
  { value: 'rented',      label: 'Alugado'     },
  { value: 'maintenance', label: 'Manutenção'  },
  { value: 'inactive',    label: 'Inativo'     },
]

const FUEL_OPTS = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico', 'Híbrido']

const BLANK = {
  plate: '', brand: '', model: '', year: '', color: '',
  fuel_type: 'Flex', daily_rate: '', mileage: '0', notes: '', status: 'available',
}

// ─── Helpers ─────────────────────────────────────────────────

function formatKm(m) {
  if (m == null) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(1)}k km` : `${m} km`
}

function formatRate(r) {
  return `R$ ${Number(r).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

// ─── Component ───────────────────────────────────────────────

export default function FrotaPage() {
  const { userData } = useUser()
  const toast = useToast()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [vehicleStats, setVehicleStats] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Modal helpers ────────────────────────────────────────

  function openAdd() {
    setEditing(null)
    setForm(BLANK)
    setError('')
    setDeletingId(null)
    setModalOpen(true)
  }

  async function loadVehicleStats(vehicleId) {
    setVehicleStats(null)
    const [{ data: rentals }, { data: maintenances }] = await Promise.all([
      supabase.from('rentals').select('id, total_amount, status').eq('vehicle_id', vehicleId),
      supabase.from('maintenances').select('date').eq('vehicle_id', vehicleId).order('date', { ascending: false }).limit(1),
    ])
    const completed    = (rentals || []).filter(r => r.status === 'completed')
    const totalRevenue = completed.reduce((s, r) => s + Number(r.total_amount || 0), 0)
    setVehicleStats({
      totalRentals:  (rentals || []).length,
      completedRentals: completed.length,
      totalRevenue,
      lastMaintenance: maintenances?.[0]?.date ?? null,
    })
  }

  function openEdit(v) {
    setEditing(v)
    loadVehicleStats(v.id)
    setForm({
      plate:      v.plate,
      brand:      v.brand,
      model:      v.model,
      year:       v.year?.toString()       || '',
      color:      v.color                  || '',
      fuel_type:  v.fuel_type              || 'Flex',
      daily_rate: v.daily_rate?.toString() || '',
      mileage:    v.mileage?.toString()    || '0',
      notes:      v.notes                  || '',
      status:     v.status,
    })
    setError('')
    setDeletingId(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setDeletingId(null)
    setVehicleStats(null)
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  // ── CRUD ────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    if (!form.plate.trim() || !form.brand.trim() || !form.model.trim() || !form.daily_rate) {
      setError('Preencha os campos obrigatórios (placa, marca, modelo e diária).')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      plate:      form.plate.toUpperCase().replace(/\s/g, ''),
      brand:      form.brand.trim(),
      model:      form.model.trim(),
      year:       form.year       ? parseInt(form.year)        : null,
      color:      form.color.trim() || null,
      fuel_type:  form.fuel_type  || null,
      daily_rate: parseFloat(form.daily_rate),
      mileage:    parseInt(form.mileage)    || 0,
      notes:      form.notes.trim()         || null,
      company_id: userData.company.id,
    }

    let err
    if (editing) {
      payload.status = form.status
      ;({ error: err } = await supabase.from('vehicles').update(payload).eq('id', editing.id))
    } else {
      ;({ error: err } = await supabase.from('vehicles').insert(payload))
    }

    setSaving(false)
    if (err) {
      setError(err.message.includes('unique') ? 'Placa já cadastrada.' : err.message)
      return
    }
    toast(editing ? 'Veículo atualizado.' : 'Veículo adicionado.')
    closeModal()
    load()
  }

  async function handleDelete(id) {
    const { error: err } = await supabase.from('vehicles').delete().eq('id', id)
    if (err) {
      setError('Não foi possível remover. Verifique se há locações ativas para este veículo.')
      setDeletingId(null)
      return
    }
    toast('Veículo removido.', 'info')
    closeModal()
    load()
  }

  // ── Filtering ────────────────────────────────────────────

  const byStatus = filter === 'all' ? vehicles : vehicles.filter(v => v.status === filter)
  const filtered = search.trim()
    ? byStatus.filter(v =>
        `${v.plate} ${v.brand} ${v.model} ${v.color || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : byStatus
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    all:         vehicles.length,
    available:   vehicles.filter(v => v.status === 'available').length,
    rented:      vehicles.filter(v => v.status === 'rented').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  }

  // ── Render ───────────────────────────────────────────────

  const topbarLeft = (
    <div className="greet">
      <h1>Frota</h1>
      <p>{loading ? '…' : `${vehicles.length} veículo${vehicles.length !== 1 ? 's' : ''} cadastrado${vehicles.length !== 1 ? 's' : ''}`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Novo veículo
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* Filters + Search */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'all',         label: 'Todos',       count: counts.all         },
            { key: 'available',   label: 'Disponíveis', count: counts.available   },
            { key: 'rented',      label: 'Alugados',    count: counts.rented      },
            { key: 'maintenance', label: 'Manutenção',  count: counts.maintenance },
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
            placeholder="Buscar por placa, marca ou modelo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando frota…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {vehicles.length === 0
              ? 'Nenhum veículo cadastrado ainda. Clique em "Novo veículo" para começar.'
              : 'Nenhum veículo corresponde à busca.'}
          </div>
        ) : (
          <>
            <div className="table-scroll">
            <div className="vtable-head">
              <span>Placa</span>
              <span>Veículo</span>
              <span>Combustível</span>
              <span>Ano · Km</span>
              <span>Diária</span>
              <span>Status</span>
              <span />
            </div>
            {paginated.map(v => {
              const s = STATUS_MAP[v.status] || { cls: 'shop', label: v.status }
              return (
                <div key={v.id} className="vtable-row gtable-row" onClick={() => openEdit(v)}>
                  <span className="plate">{v.plate}</span>
                  <div>
                    <div className="fleet-model">{v.brand} {v.model}</div>
                    {v.color && <div className="fleet-cat">{v.color}</div>}
                  </div>
                  <div className="fleet-cat">{v.fuel_type || '—'}</div>
                  <div className="fleet-cat">{[v.year, formatKm(v.mileage)].filter(Boolean).join(' · ') || '—'}</div>
                  <div className="vtable-rate num">
                    {formatRate(v.daily_rate)}<span className="vtable-rate-unit">/dia</span>
                  </div>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  <button
                    className="row-btn"
                    onClick={e => { e.stopPropagation(); openEdit(v) }}
                    title="Editar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )
            })}
            </div>
            <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0,0) }} />
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `${editing.brand} ${editing.model}` : 'Novo veículo'}
      >
        <form className="dash-form" onSubmit={handleSubmit}>

          <div className="form-row">
            <div className="form-field">
              <label>Placa <span className="req">*</span></label>
              <input
                type="text"
                placeholder="ABC1D23"
                maxLength={8}
                value={form.plate}
                onChange={e => setField('plate', e.target.value.toUpperCase())}
              />
            </div>
            {editing && (
              <div className="form-field">
                <label>Status</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)}>
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Marca <span className="req">*</span></label>
              <input type="text" placeholder="Toyota" value={form.brand} onChange={e => setField('brand', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Modelo <span className="req">*</span></label>
              <input type="text" placeholder="Corolla XEi" value={form.model} onChange={e => setField('model', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ano</label>
              <input type="number" placeholder={new Date().getFullYear()} min="1990" max="2030" value={form.year} onChange={e => setField('year', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Cor</label>
              <input type="text" placeholder="Prata" value={form.color} onChange={e => setField('color', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Combustível</label>
              <select value={form.fuel_type} onChange={e => setField('fuel_type', e.target.value)}>
                {FUEL_OPTS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Quilometragem</label>
              <input type="number" placeholder="0" min="0" value={form.mileage} onChange={e => setField('mileage', e.target.value)} />
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Diária (R$) <span className="req">*</span></label>
              <input type="number" placeholder="120.00" min="0" step="0.01" value={form.daily_rate} onChange={e => setField('daily_rate', e.target.value)} />
            </div>
          </div>

          <div className="form-field">
            <label>Observações</label>
            <textarea placeholder="Anotações sobre o veículo…" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>

          {editing && (
            <div className="vehicle-stats-row">
              {vehicleStats === null ? (
                <span className="vehicle-stats-loading">Carregando histórico…</span>
              ) : (
                <>
                  <div className="vehicle-stat">
                    <div className="vehicle-stat-val num">{vehicleStats.totalRentals}</div>
                    <div className="vehicle-stat-label">locações</div>
                  </div>
                  <div className="vehicle-stat">
                    <div className="vehicle-stat-val num">{vehicleStats.completedRentals}</div>
                    <div className="vehicle-stat-label">concluídas</div>
                  </div>
                  <div className="vehicle-stat">
                    <div className="vehicle-stat-val num">
                      {vehicleStats.totalRevenue >= 1000
                        ? `R$ ${(vehicleStats.totalRevenue / 1000).toFixed(1).replace('.', ',')}k`
                        : `R$ ${vehicleStats.totalRevenue.toLocaleString('pt-BR')}`}
                    </div>
                    <div className="vehicle-stat-label">receita total</div>
                  </div>
                  <div className="vehicle-stat">
                    <div className="vehicle-stat-val">
                      {vehicleStats.lastMaintenance
                        ? vehicleStats.lastMaintenance.split('-').reverse().join('/')
                        : '—'}
                    </div>
                    <div className="vehicle-stat-label">última oficina</div>
                  </div>
                </>
              )}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {editing && (
              deletingId === editing.id ? (
                <div className="delete-confirm">
                  <span>Excluir veículo?</span>
                  <button type="button" className="btn-danger-sm" onClick={() => handleDelete(editing.id)}>Sim, excluir</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setDeletingId(null)}>Cancelar</button>
                </div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setDeletingId(editing.id)}>
                  Excluir
                </button>
              )
            )}
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar veículo'}
              </button>
            </div>
          </div>

        </form>
      </Modal>

    </DashboardLayout>
  )
}
