import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/agendamentos.css'

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_MAP = {
  confirmed: { cls: 'avail',  label: 'Confirmado' },
  pending:   { cls: 'rented', label: 'Pendente'   },
  cancelled: { cls: 'shop',   label: 'Cancelado'  },
}

const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatMoney(v) {
  if (!v && v !== 0) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function daysCount(start, end) {
  return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000))
}

function isPast(dateStr) {
  return dateStr && new Date(dateStr) < new Date(new Date().toDateString())
}

const EMPTY = {
  customer_id: '',
  vehicle_id:  '',
  start_date:  '',
  end_date:    '',
  daily_rate:  '',
  status:      'confirmed',
  notes:       '',
}

// ─── Component ───────────────────────────────────────────────

export default function AgendamentosPage() {
  const { userData }  = useUser()
  const [bookings, setBookings]   = useState([])
  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('upcoming')
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [delConfirm, setDelConfirm]     = useState(false)
  const [converting, setConverting]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: b }, { data: c }, { data: v }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, customers(name, phone), vehicles(plate, brand, model, daily_rate)')
        .order('start_date', { ascending: true }),
      supabase.from('customers').select('id, name').eq('blacklisted', false).order('name'),
      supabase.from('vehicles').select('id, plate, brand, model, daily_rate').in('status', ['available', 'rented']).order('plate'),
    ])
    setBookings(b || [])
    setCustomers(c || [])
    setVehicles(v || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Timeline strip (próximos 14 dias) ─────────────────────
  const strip = useMemo(() => {
    const days = []
    const today = new Date(new Date().toDateString())
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const iso = d.toISOString().slice(0, 10)
      const count = bookings.filter(b =>
        b.status !== 'cancelled' && b.start_date <= iso && b.end_date >= iso
      ).length
      days.push({ iso, num: d.getDate(), name: DAY_NAMES[d.getDay()], count, isToday: i === 0 })
    }
    return days
  }, [bookings])

  // ── Filters ───────────────────────────────────────────────
  const todayIso = new Date().toISOString().slice(0, 10)
  const byFilter = useMemo(() => {
    if (filter === 'all')       return bookings
    if (filter === 'cancelled') return bookings.filter(b => b.status === 'cancelled')
    if (filter === 'past')      return bookings.filter(b => b.status !== 'cancelled' && b.end_date < todayIso)
    return bookings.filter(b => b.status !== 'cancelled' && b.end_date >= todayIso)
  }, [bookings, filter, todayIso])

  const filtered = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(b =>
      `${b.customers?.name || ''} ${b.vehicles?.plate || ''} ${b.vehicles?.brand || ''} ${b.vehicles?.model || ''}`.toLowerCase().includes(q)
    )
  }, [byFilter, search])

  const counts = useMemo(() => ({
    upcoming:  bookings.filter(b => b.status !== 'cancelled' && b.end_date >= todayIso).length,
    past:      bookings.filter(b => b.status !== 'cancelled' && b.end_date < todayIso).length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    all:       bookings.length,
  }), [bookings, todayIso])

  // ── Hoje ──────────────────────────────────────────────────
  const todayBookings = bookings.filter(b =>
    b.status !== 'cancelled' && b.start_date <= todayIso && b.end_date >= todayIso
  ).length

  // ── Modal ─────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal('add')
  }

  function openEdit(b) {
    setForm({
      customer_id: b.customer_id || '',
      vehicle_id:  b.vehicle_id  || '',
      start_date:  b.start_date  || '',
      end_date:    b.end_date    || '',
      daily_rate:  b.daily_rate  ?? '',
      status:      b.status      || 'confirmed',
      notes:       b.notes       || '',
      _id:         b.id,
    })
    setError('')
    setDelConfirm(false)
    setConverting(false)
    setModal('edit')
  }

  function handleVehicleChange(id) {
    const v = vehicles.find(v => v.id === id)
    setForm(p => ({ ...p, vehicle_id: id, daily_rate: v?.daily_rate ?? p.daily_rate }))
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.customer_id) { setError('Selecione o cliente.'); return }
    if (!form.vehicle_id)  { setError('Selecione o veículo.'); return }
    if (!form.start_date || !form.end_date) { setError('Informe as datas.'); return }
    if (form.start_date > form.end_date) { setError('Data de início deve ser anterior ao fim.'); return }
    setSaving(true)

    // ── Conflict detection ────────────────────────────────
    const bookingConflictQuery = supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', form.vehicle_id)
      .neq('status', 'cancelled')
      .lte('start_date', form.end_date)
      .gte('end_date', form.start_date)
    if (form._id) bookingConflictQuery.neq('id', form._id)

    const [{ data: bookingConflicts }, { data: rentalConflicts }] = await Promise.all([
      bookingConflictQuery,
      supabase
        .from('rentals')
        .select('id')
        .eq('vehicle_id', form.vehicle_id)
        .eq('status', 'active')
        .lte('start_date', form.end_date)
        .gte('expected_end', form.start_date),
    ])

    if ((bookingConflicts?.length ?? 0) > 0) {
      setError('Este veículo já possui reserva para o período selecionado.')
      setSaving(false)
      return
    }
    if ((rentalConflicts?.length ?? 0) > 0) {
      setError('Este veículo está com locação ativa neste período.')
      setSaving(false)
      return
    }

    const payload = {
      company_id:  userData.company.id,
      customer_id: form.customer_id,
      vehicle_id:  form.vehicle_id,
      start_date:  form.start_date,
      end_date:    form.end_date,
      daily_rate:  Number(form.daily_rate),
      status:      form.status,
      notes:       form.notes.trim() || null,
    }
    if (modal === 'add') {
      const { error: err } = await supabase.from('bookings').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('bookings').update(payload).eq('id', form._id)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function del() {
    await supabase.from('bookings').delete().eq('id', form._id)
    setModal(null)
    load()
  }

  // Converte agendamento em locação ativa
  async function convertToRental() {
    setConverting(true)
    const { error: err } = await supabase.from('rentals').insert({
      company_id:   userData.company.id,
      customer_id:  form.customer_id,
      vehicle_id:   form.vehicle_id,
      start_date:   form.start_date,
      expected_end: form.end_date,
      daily_rate:   Number(form.daily_rate),
      status:       'active',
      notes:        form.notes || null,
    })
    if (err) { setError(err.message); setConverting(false); return }
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', form._id)
    setConverting(false)
    setModal(null)
    load()
  }

  const projected = form.start_date && form.end_date && form.daily_rate
    ? daysCount(form.start_date, form.end_date) * Number(form.daily_rate)
    : null

  const topbarLeft = (
    <div className="greet">
      <h1>Agendamentos</h1>
      <p>{loading ? '…' : `${todayBookings} reserva${todayBookings !== 1 ? 's' : ''} ativa${todayBookings !== 1 ? 's' : ''} hoje · ${counts.upcoming} próxima${counts.upcoming !== 1 ? 's' : ''}`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Nova reserva
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* Timeline strip */}
      <div className="dash-card glass" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div className="card-head" style={{ marginBottom: 12 }}>
          <h3 className="card-title">Próximos 14 dias</h3>
        </div>
        <div className="agenda-strip">
          {strip.map(d => (
            <div key={d.iso} className={`agenda-day${d.isToday ? ' today' : ''}${d.count > 0 ? ' has-booking' : ''}`}>
              <div className="agenda-day-name">{d.name}</div>
              <div className="agenda-day-num">{d.num}</div>
              {d.count > 0 && <div className="agenda-day-count">{d.count}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'upcoming',  label: 'Próximos',    count: counts.upcoming  },
            { key: 'past',      label: 'Passados',    count: counts.past      },
            { key: 'cancelled', label: 'Cancelados',  count: counts.cancelled },
            { key: 'all',       label: 'Todos',       count: counts.all       },
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
            placeholder="Buscar por cliente ou placa…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando agendamentos…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {bookings.length === 0 ? 'Nenhum agendamento cadastrado.' : 'Nenhum agendamento corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="btable-head">
              <span>Cliente</span>
              <span>Veículo</span>
              <span>Início</span>
              <span>Fim</span>
              <span>Total prev.</span>
              <span>Status</span>
              <span />
            </div>
            {filtered.map(b => {
              const s    = STATUS_MAP[b.status] || { cls: 'shop', label: b.status }
              const days = daysCount(b.start_date, b.end_date)
              const total = days * Number(b.daily_rate)
              return (
                <div key={b.id} className="btable-row gtable-row" onClick={() => openEdit(b)}>
                  <div>
                    <div className="gtable-cell">{b.customers?.name || '—'}</div>
                    {b.customers?.phone && <div className="gtable-muted">{b.customers.phone}</div>}
                  </div>
                  <div>
                    <div className="plate" style={{ fontSize: 11 }}>{b.vehicles?.plate || '—'}</div>
                    <div className="gtable-muted">{b.vehicles ? `${b.vehicles.brand} ${b.vehicles.model}` : ''}</div>
                  </div>
                  <div className={`gtable-muted${isPast(b.start_date) && b.status !== 'cancelled' ? ' due-soon' : ''}`}>
                    {formatDate(b.start_date)}
                  </div>
                  <div className="gtable-muted">{formatDate(b.end_date)} <span style={{ fontSize: 11 }}>({days}d)</span></div>
                  <div className="gtable-cell num" style={{ fontSize: 13.5, fontWeight: 500 }}>{formatMoney(total)}</div>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  <button className="row-btn" onClick={e => { e.stopPropagation(); openEdit(b) }} title="Editar">
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
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Nova reserva' : 'Editar reserva'}>
        <form className="dash-form" onSubmit={save}>

          <div className="form-row">
            <div className="form-field">
              <label>Cliente *</label>
              <select
                value={form.customer_id}
                onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}
                required
              >
                <option value="">Selecionar…</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Veículo *</label>
              <select
                value={form.vehicle_id}
                onChange={e => handleVehicleChange(e.target.value)}
                required
              >
                <option value="">Selecionar…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Data de início *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Data de fim *</label>
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
              <label>Diária (R$) *</label>
              <input
                type="number"
                value={form.daily_rate}
                onChange={e => setForm(p => ({ ...p, daily_rate: e.target.value }))}
                placeholder="0,00"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              >
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {projected !== null && (
            <div className="total-preview">
              Total previsto: <strong className="num">{formatMoney(projected)}</strong>
              <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 8 }}>
                ({daysCount(form.start_date, form.end_date)} dias)
              </span>
            </div>
          )}

          <div className="form-row single">
            <div className="form-field">
              <label>Observações</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Pedido especial, entrega, etc."
                rows={2}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {modal === 'edit' && (
              delConfirm ? (
                <div className="delete-confirm">
                  Excluir reserva?
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
              {modal === 'edit' && form.status !== 'cancelled' && (
                <button
                  type="button"
                  className="convert-btn"
                  onClick={convertToRental}
                  disabled={converting}
                  title="Criar locação ativa a partir desta reserva"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  {converting ? 'Convertendo…' : 'Converter em locação'}
                </button>
              )}
              <button type="button" className="btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : modal === 'add' ? 'Criar reserva' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}
