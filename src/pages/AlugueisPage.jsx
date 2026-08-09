import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import '../styles/inner.css'
import '../styles/alugueis.css'

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_MAP = {
  active:    { cls: 'rented', label: 'ativa'     },
  completed: { cls: 'avail',  label: 'concluída'  },
  cancelled: { cls: 'shop',   label: 'cancelada'  },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${d} ${months[parseInt(m) - 1]}`
}

function formatMoney(val) {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

function projectedTotal(rental) {
  const start = new Date(rental.start_date)
  const end   = new Date(rental.expected_end)
  const days  = Math.max(1, Math.ceil((end - start) / 86400000))
  return days * Number(rental.daily_rate)
}

function daysLate(rental) {
  if (rental.status !== 'active') return 0
  const today = new Date()
  const exp   = new Date(rental.expected_end)
  return Math.max(0, Math.ceil((today - exp) / 86400000))
}

// ─── Component ───────────────────────────────────────────────

const BLANK_ADD = {
  customer_id: '', vehicle_id: '', start_date: '', expected_end: '', daily_rate: '', notes: '',
}

export default function AlugueisPage() {
  const { userData } = useUser()
  const toast = useToast()

  // Data
  const [rentals, setRentals]   = useState([])
  const [loading, setLoading]   = useState(true)

  // Filters
  const [filter, setFilter]   = useState('active')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  // Add rental modal
  const [addOpen, setAddOpen]         = useState(false)
  const [addForm, setAddForm]         = useState(BLANK_ADD)
  const [customers, setCustomers]     = useState([])
  const [vehicles, setVehicles]       = useState([])
  const [loadingOpts, setLoadingOpts] = useState(false)
  const [addSaving, setAddSaving]     = useState(false)
  const [addError, setAddError]       = useState('')

  // Detail / close modal
  const [detailOpen, setDetailOpen]   = useState(false)
  const [detail, setDetail]           = useState(null)
  const [closeDate, setCloseDate]     = useState('')
  const [closeSaving, setCloseSaving] = useState(false)
  const [closeError, setCloseError]   = useState('')
  const [cancelling, setCancelling]   = useState(false)

  // ── Load ─────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('rentals')
      .select('*, customers(name, cpf), vehicles(plate, brand, model)')
      .order('created_at', { ascending: false })
    setRentals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Load options when add modal opens ────────────────────

  useEffect(() => {
    if (!addOpen) return
    setLoadingOpts(true)
    Promise.all([
      supabase.from('customers').select('id, name, cpf').eq('blacklisted', false).order('name'),
      supabase.from('vehicles').select('id, plate, brand, model, daily_rate').eq('status', 'available').order('plate'),
    ]).then(([{ data: c }, { data: v }]) => {
      setCustomers(c || [])
      setVehicles(v || [])
      setLoadingOpts(false)
    })
  }, [addOpen])

  // ── Add rental ───────────────────────────────────────────

  function openAdd() {
    setAddForm({ ...BLANK_ADD, start_date: new Date().toISOString().slice(0, 10) })
    setAddError('')
    setAddOpen(true)
  }

  function setAddField(key, val) {
    setAddForm(f => ({ ...f, [key]: val }))
  }

  function handleVehicleSelect(id) {
    setAddField('vehicle_id', id)
    const v = vehicles.find(v => v.id === id)
    if (v) setAddField('daily_rate', v.daily_rate.toString())
  }

  async function handleAddSubmit(e) {
    e.preventDefault()
    if (addSaving) return
    const { customer_id, vehicle_id, start_date, expected_end, daily_rate } = addForm
    if (!customer_id || !vehicle_id || !start_date || !expected_end || !daily_rate) {
      setAddError('Preencha todos os campos obrigatórios.')
      return
    }
    if (new Date(expected_end) <= new Date(start_date)) {
      setAddError('A data de devolução deve ser posterior à data de início.')
      return
    }
    setAddSaving(true)
    setAddError('')

    const { error } = await supabase.from('rentals').insert({
      customer_id,
      vehicle_id,
      start_date,
      expected_end,
      daily_rate: parseFloat(daily_rate),
      notes:      addForm.notes.trim() || null,
      company_id: userData.company.id,
    })

    setAddSaving(false)
    if (error) { setAddError(error.message); return }
    toast('Locação iniciada.')
    setAddOpen(false)
    load()
  }

  // ── Detail / Close ───────────────────────────────────────

  function openDetail(r) {
    setDetail(r)
    setCloseDate(new Date().toISOString().slice(0, 10))
    setCloseError('')
    setCancelling(false)
    setDetailOpen(true)
  }

  const closeTotal = useMemo(() => {
    if (!detail || !closeDate) return null
    const days = Math.max(1, Math.ceil((new Date(closeDate) - new Date(detail.start_date)) / 86400000))
    return days * Number(detail.daily_rate)
  }, [detail, closeDate])

  async function handleCloseRental() {
    if (closeSaving || !closeDate) return
    setCloseSaving(true)
    setCloseError('')

    const { error } = await supabase.from('rentals').update({
      status:   'completed',
      end_date: closeDate,
    }).eq('id', detail.id)

    if (error) { setCloseError(error.message); setCloseSaving(false); return }

    // Auto-create pending payment
    await supabase.from('payments').insert({
      rental_id:  detail.id,
      company_id: userData.company.id,
      amount:     closeTotal,
      status:     'pending',
    })

    setCloseSaving(false)
    toast('Locação encerrada. Pagamento pendente criado.')
    setDetailOpen(false)
    load()
  }

  async function handleCancelRental() {
    setCloseSaving(true)
    const { error } = await supabase.from('rentals').update({ status: 'cancelled' }).eq('id', detail.id)
    setCloseSaving(false)
    if (error) { setCloseError(error.message); return }
    toast('Locação cancelada.', 'info')
    setDetailOpen(false)
    load()
  }

  // ── Filtering ────────────────────────────────────────────

  const byFilter = filter === 'all' ? rentals : rentals.filter(r => r.status === filter)
  const filtered = search.trim()
    ? byFilter.filter(r =>
        `${r.customers?.name || ''} ${r.vehicles?.plate || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : byFilter
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    active:    rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
    cancelled: rentals.filter(r => r.status === 'cancelled').length,
    all:       rentals.length,
  }

  // ── Render ───────────────────────────────────────────────

  const topbarLeft = (
    <div className="greet">
      <h1>Aluguéis</h1>
      <p>{loading ? '…' : `${counts.active} ativo${counts.active !== 1 ? 's' : ''} · ${rentals.length} no total`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Nova locação
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* Toolbar */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'active',    label: 'Ativas',      count: counts.active    },
            { key: 'completed', label: 'Concluídas',  count: counts.completed },
            { key: 'cancelled', label: 'Canceladas',  count: counts.cancelled },
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
            placeholder="Buscar por cliente ou placa…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="dash-card glass">
        {loading ? (
          <div className="page-empty">Carregando locações…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {rentals.length === 0
              ? 'Nenhuma locação registrada ainda. Clique em "Nova locação" para começar.'
              : 'Nenhuma locação corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="table-scroll">
            <div className="atable-head">
              <span>Cliente</span>
              <span>Veículo</span>
              <span>Início</span>
              <span>Prev. dev.</span>
              <span>Valor</span>
              <span>Status</span>
              <span />
            </div>
            {paginated.map(r => {
              const s    = STATUS_MAP[r.status] || { cls: 'shop', label: r.status }
              const late = daysLate(r)
              const val  = r.status === 'completed' && r.total_amount
                ? formatMoney(r.total_amount)
                : formatMoney(projectedTotal(r))
              return (
                <div key={r.id} className="atable-row gtable-row" onClick={() => openDetail(r)}>
                  <div>
                    <div className="gtable-cell">{r.customers?.name || '—'}</div>
                    {r.customers?.cpf && <div className="gtable-muted">{r.customers.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div>}
                  </div>
                  <div>
                    <div className="gtable-cell plate" style={{ fontSize: 12 }}>{r.vehicles?.plate || '—'}</div>
                    <div className="gtable-muted">{r.vehicles ? `${r.vehicles.brand} ${r.vehicles.model}` : ''}</div>
                  </div>
                  <div className="gtable-muted">{formatDate(r.start_date)}</div>
                  <div>
                    <div className="gtable-muted">{formatDate(r.expected_end)}</div>
                    {late > 0 && <span className="badge shop" style={{ fontSize: 10, padding: '2px 7px' }}>+{late}d atraso</span>}
                  </div>
                  <div className="gtable-cell num" style={{ fontSize: 13.5, fontWeight: 500 }}>{val}</div>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  <button
                    className="row-btn"
                    onClick={e => { e.stopPropagation(); openDetail(r) }}
                    title="Ver detalhes"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
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

      {/* ── Nova Locação Modal ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nova locação" wide>
        <form className="dash-form" onSubmit={handleAddSubmit}>

          <div className="form-row">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Cliente <span className="req">*</span></label>
              {loadingOpts ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Carregando clientes…</div>
              ) : (
                <select value={addForm.customer_id} onChange={e => setAddField('customer_id', e.target.value)}>
                  <option value="">Selecione um cliente</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.cpf ? ` · ${c.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Veículo disponível <span className="req">*</span></label>
              {loadingOpts ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Carregando veículos…</div>
              ) : vehicles.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 0' }}>Nenhum veículo disponível no momento.</div>
              ) : (
                <select value={addForm.vehicle_id} onChange={e => handleVehicleSelect(e.target.value)}>
                  <option value="">Selecione um veículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} · {v.brand} {v.model} — {formatMoney(v.daily_rate)}/dia
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Data de início <span className="req">*</span></label>
              <input type="date" value={addForm.start_date} onChange={e => setAddField('start_date', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Previsão de devolução <span className="req">*</span></label>
              <input type="date" value={addForm.expected_end} min={addForm.start_date} onChange={e => setAddField('expected_end', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Diária (R$) <span className="req">*</span></label>
              <input type="number" placeholder="0.00" min="0" step="0.01" value={addForm.daily_rate} onChange={e => setAddField('daily_rate', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Total previsto</label>
              <div className="total-preview num">
                {addForm.start_date && addForm.expected_end && addForm.daily_rate
                  ? formatMoney(Math.max(1, Math.ceil((new Date(addForm.expected_end) - new Date(addForm.start_date)) / 86400000)) * parseFloat(addForm.daily_rate))
                  : '—'
                }
              </div>
            </div>
          </div>

          <div className="form-field">
            <label>Observações</label>
            <textarea placeholder="Km de saída, condições do veículo, combustível…" rows={2} value={addForm.notes} onChange={e => setAddField('notes', e.target.value)} />
          </div>

          {addError && <p className="form-error">{addError}</p>}

          <div className="form-actions">
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={() => setAddOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={addSaving}>
                {addSaving ? 'Registrando…' : 'Iniciar locação'}
              </button>
            </div>
          </div>

        </form>
      </Modal>

      {/* ── Detail / Close Modal ── */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalhes da locação" wide>
        {detail && (
          <div className="dash-form">

            {/* Info */}
            <div className="rental-detail-grid">
              <div className="rental-detail-item">
                <div className="rental-detail-label">Cliente</div>
                <div className="rental-detail-val">{detail.customers?.name || '—'}</div>
              </div>
              <div className="rental-detail-item">
                <div className="rental-detail-label">Veículo</div>
                <div className="rental-detail-val">
                  <span className="plate" style={{ fontSize: 12 }}>{detail.vehicles?.plate}</span>
                  {' '}{detail.vehicles?.brand} {detail.vehicles?.model}
                </div>
              </div>
              <div className="rental-detail-item">
                <div className="rental-detail-label">Início</div>
                <div className="rental-detail-val">{formatDate(detail.start_date)}</div>
              </div>
              <div className="rental-detail-item">
                <div className="rental-detail-label">Prev. devolução</div>
                <div className="rental-detail-val">{formatDate(detail.expected_end)}</div>
              </div>
              <div className="rental-detail-item">
                <div className="rental-detail-label">Diária</div>
                <div className="rental-detail-val num">{formatMoney(detail.daily_rate)}</div>
              </div>
              <div className="rental-detail-item">
                <div className="rental-detail-label">Status</div>
                <div><span className={`badge ${STATUS_MAP[detail.status]?.cls}`}>{STATUS_MAP[detail.status]?.label}</span></div>
              </div>
              {detail.status === 'completed' && (
                <div className="rental-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="rental-detail-label">Total cobrado</div>
                  <div className="rental-detail-val num" style={{ color: 'var(--emerald)', fontSize: 20 }}>{formatMoney(detail.total_amount)}</div>
                </div>
              )}
              {detail.notes && (
                <div className="rental-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="rental-detail-label">Observações</div>
                  <div className="rental-detail-val" style={{ color: 'var(--text-muted)' }}>{detail.notes}</div>
                </div>
              )}
            </div>

            {/* Close section — only for active */}
            {detail.status === 'active' && (
              <div className="close-section">
                <div className="close-section-title">Encerrar locação</div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Data de devolução</label>
                    <input
                      type="date"
                      value={closeDate}
                      min={detail.start_date}
                      onChange={e => setCloseDate(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label>Total calculado</label>
                    <div className="total-preview num" style={{ color: closeTotal != null ? 'var(--emerald)' : 'var(--text-dim)' }}>
                      {closeTotal != null ? formatMoney(closeTotal) : '—'}
                    </div>
                  </div>
                </div>

                {closeError && <p className="form-error">{closeError}</p>}

                <div className="form-actions">
                  {cancelling ? (
                    <div className="delete-confirm">
                      <span>Cancelar esta locação?</span>
                      <button type="button" className="btn-danger-sm" onClick={handleCancelRental} disabled={closeSaving}>Sim, cancelar</button>
                      <button type="button" className="btn-ghost-sm" onClick={() => setCancelling(false)}>Não</button>
                    </div>
                  ) : (
                    <button type="button" className="btn-danger-ghost" onClick={() => setCancelling(true)}>
                      Cancelar locação
                    </button>
                  )}
                  <div className="form-actions-end">
                    <button type="button" className="btn-cancel" onClick={() => setDetailOpen(false)}>Fechar</button>
                    <button
                      type="button"
                      className="btn-save"
                      onClick={handleCloseRental}
                      disabled={closeSaving || !closeDate}
                    >
                      {closeSaving ? 'Encerrando…' : 'Confirmar devolução'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {detail.status !== 'active' && (
              <div className="form-actions">
                <div className="form-actions-end">
                  <button type="button" className="btn-cancel" onClick={() => setDetailOpen(false)}>Fechar</button>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

    </DashboardLayout>
  )
}
