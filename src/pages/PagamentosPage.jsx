import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import '../styles/inner.css'
import '../styles/pagamentos.css'

const PAGE_SIZE = 25

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_MAP = {
  pending:  { cls: 'rented', label: 'Pendente'  },
  paid:     { cls: 'avail',  label: 'Pago'      },
  refunded: { cls: 'shop',   label: 'Devolvido' },
}

const METHOD_LABELS = {
  pix:         { label: 'Pix',           icon: '⚡' },
  cash:        { label: 'Dinheiro',      icon: '💵' },
  credit_card: { label: 'Crédito',       icon: '💳' },
  debit_card:  { label: 'Débito',        icon: '💳' },
  transfer:    { label: 'Transferência', icon: '🏦' },
}

function formatMoney(v) {
  if (!v && v !== 0) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function formatDateTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function thisMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  return { start, end }
}

const EMPTY = {
  rental_id: '',
  amount:    '',
  method:    'pix',
  status:    'pending',
  paid_at:   '',
  notes:     '',
}

// ─── Component ───────────────────────────────────────────────

export default function PagamentosPage() {
  const { userData } = useUser()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [rentals, setRentals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [delConfirm, setDelConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase
        .from('payments')
        .select('*, rentals(id, start_date, daily_rate, total_amount, customers(name), vehicles(plate, brand, model))')
        .order('created_at', { ascending: false }),
      supabase
        .from('rentals')
        .select('id, start_date, daily_rate, total_amount, expected_end, customers(name), vehicles(plate, brand, model)')
        .in('status', ['active', 'completed'])
        .order('start_date', { ascending: false }),
    ])
    setPayments(p || [])
    setRentals(r || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const { start, end } = thisMonthRange()
    const paidThisMonth = payments.filter(p =>
      p.status === 'paid' && p.paid_at >= start && p.paid_at <= end
    )
    const pending  = payments.filter(p => p.status === 'pending')
    const paid     = payments.filter(p => p.status === 'paid')
    const refunded = payments.filter(p => p.status === 'refunded')
    return {
      monthTotal:    paidThisMonth.reduce((s, p) => s + Number(p.amount), 0),
      pendingTotal:  pending.reduce((s, p) => s + Number(p.amount), 0),
      paidTotal:     paid.reduce((s, p) => s + Number(p.amount), 0),
      pendingCount:  pending.length,
      refundedTotal: refunded.reduce((s, p) => s + Number(p.amount), 0),
    }
  }, [payments])

  // ── Filters ───────────────────────────────────────────────
  const byFilter = useMemo(() => {
    if (filter === 'all') return payments
    return payments.filter(p => p.status === filter)
  }, [payments, filter])

  const filtered = useMemo(() => {
    if (!search.trim()) return byFilter
    const q = search.toLowerCase()
    return byFilter.filter(p => {
      const r = p.rentals
      return `${r?.customers?.name || ''} ${r?.vehicles?.plate || ''} ${r?.vehicles?.brand || ''} ${r?.vehicles?.model || ''}`
        .toLowerCase().includes(q)
    })
  }, [byFilter, search])

  const counts = useMemo(() => ({
    all:      payments.length,
    pending:  payments.filter(p => p.status === 'pending').length,
    paid:     payments.filter(p => p.status === 'paid').length,
    refunded: payments.filter(p => p.status === 'refunded').length,
  }), [payments])

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  // ── Modal ─────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY)
    setError('')
    setModal('add')
  }

  function openEdit(p) {
    setForm({
      rental_id: p.rental_id || '',
      amount:    p.amount    ?? '',
      method:    p.method    || 'pix',
      status:    p.status    || 'pending',
      paid_at:   p.paid_at   ? p.paid_at.slice(0, 16) : '',
      notes:     p.notes     || '',
      _id:       p.id,
    })
    setError('')
    setDelConfirm(false)
    setModal('edit')
  }

  function handleRentalChange(id) {
    const r = rentals.find(r => r.id === id)
    if (!r) { setForm(p => ({ ...p, rental_id: id })); return }
    const days   = Math.max(1, Math.ceil((new Date(r.expected_end) - new Date(r.start_date)) / 86400000))
    const amount = r.total_amount || (days * Number(r.daily_rate))
    setForm(p => ({ ...p, rental_id: id, amount: amount.toFixed(2) }))
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.rental_id) { setError('Selecione a locação.'); return }
    if (!form.amount)    { setError('Informe o valor.'); return }
    setSaving(true)
    const payload = {
      company_id: userData.company.id,
      rental_id:  form.rental_id,
      amount:     Number(form.amount),
      method:     form.method,
      status:     form.status,
      paid_at:    form.status === 'paid' ? (form.paid_at ? new Date(form.paid_at).toISOString() : new Date().toISOString()) : null,
      notes:      form.notes.trim() || null,
    }
    if (modal === 'add') {
      const { error: err } = await supabase.from('payments').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
      toast('Pagamento registrado.')
    } else {
      const { error: err } = await supabase.from('payments').update(payload).eq('id', form._id)
      if (err) { setError(err.message); setSaving(false); return }
      toast('Pagamento atualizado.')
    }
    setSaving(false)
    setModal(null)
    load()
  }

  async function del() {
    await supabase.from('payments').delete().eq('id', form._id)
    toast('Pagamento removido.', 'info')
    setModal(null)
    load()
  }

  async function quickPay(p) {
    await supabase.from('payments').update({
      status:  'paid',
      paid_at: new Date().toISOString(),
    }).eq('id', p.id)
    toast('Pagamento confirmado.')
    load()
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Pagamentos</h1>
      <p>{loading ? '…' : `${counts.pending} pendente${counts.pending !== 1 ? 's' : ''} · ${formatMoney(kpis.pendingTotal)} em aberto`}</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Novo pagamento
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* KPIs */}
      <div className="pay-kpis">
        <div className="pay-kpi glass">
          <div className="pay-kpi-label">Recebido este mês</div>
          <div className="pay-kpi-value emerald num">{formatMoney(kpis.monthTotal)}</div>
          <div className="pay-kpi-sub">pagamentos confirmados</div>
        </div>
        <div className="pay-kpi glass">
          <div className="pay-kpi-label">Em aberto</div>
          <div className="pay-kpi-value danger num">{formatMoney(kpis.pendingTotal)}</div>
          <div className="pay-kpi-sub">{counts.pending} cobrança{counts.pending !== 1 ? 'ças' : ''} pendente{counts.pending !== 1 ? 's' : ''}</div>
        </div>
        <div className="pay-kpi glass">
          <div className="pay-kpi-label">Total recebido</div>
          <div className="pay-kpi-value num">{formatMoney(kpis.paidTotal)}</div>
          <div className="pay-kpi-sub">{counts.paid} pagamento{counts.paid !== 1 ? 's' : ''}</div>
        </div>
        <div className="pay-kpi glass">
          <div className="pay-kpi-label">Devoluções</div>
          <div className="pay-kpi-value amber num">{formatMoney(kpis.refundedTotal)}</div>
          <div className="pay-kpi-sub">{counts.refunded} reembolso{counts.refunded !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="frota-toolbar">
        <div className="page-filters">
          {[
            { key: 'all',      label: 'Todos',      count: counts.all      },
            { key: 'pending',  label: 'Pendentes',  count: counts.pending  },
            { key: 'paid',     label: 'Pagos',      count: counts.paid     },
            { key: 'refunded', label: 'Devolvidos', count: counts.refunded },
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
          <div className="page-empty">Carregando pagamentos…</div>
        ) : filtered.length === 0 ? (
          <div className="page-empty">
            {payments.length === 0 ? 'Nenhum pagamento registrado.' : 'Nenhum pagamento corresponde ao filtro.'}
          </div>
        ) : (
          <>
            <div className="table-scroll">
            <div className="ptable-head">
              <span>Data</span>
              <span>Locação</span>
              <span>Valor</span>
              <span>Método</span>
              <span>Status</span>
              <span />
            </div>
            {paginated.map(p => {
              const s = STATUS_MAP[p.status] || { cls: 'shop', label: p.status }
              const m = METHOD_LABELS[p.method] || { label: p.method, icon: '•' }
              const r = p.rentals
              return (
                <div key={p.id} className="ptable-row gtable-row" onClick={() => openEdit(p)}>
                  <div className="gtable-muted">{p.paid_at ? formatDateTime(p.paid_at) : formatDateTime(p.created_at)}</div>
                  <div>
                    <div className="gtable-cell">{r?.customers?.name || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {r?.vehicles && <span className="plate" style={{ fontSize: 10 }}>{r.vehicles.plate}</span>}
                      <span className="gtable-muted" style={{ marginTop: 0 }}>{formatDate(r?.start_date)}</span>
                    </div>
                  </div>
                  <div className="gtable-cell num" style={{ fontSize: 14, fontWeight: 600 }}>
                    {formatMoney(p.amount)}
                  </div>
                  <span className="method-badge">{m.icon} {m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.status === 'pending' ? (
                      <button
                        className="quick-pay-btn"
                        onClick={e => { e.stopPropagation(); quickPay(p) }}
                        title="Marcar como pago agora"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Receber
                      </button>
                    ) : (
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    )}
                  </div>
                  <button
                    className="row-btn"
                    onClick={e => { e.stopPropagation(); openEdit(p) }}
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
            </div>
            <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0, 0) }} />
          </>
        )}
      </div>

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Novo pagamento' : 'Editar pagamento'}>
        <form className="dash-form" onSubmit={save}>

          <div className="form-row single">
            <div className="form-field">
              <label>Locação *</label>
              <select
                value={form.rental_id}
                onChange={e => handleRentalChange(e.target.value)}
                required
              >
                <option value="">Selecionar locação…</option>
                {rentals.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.customers?.name} — {r.vehicles?.plate} ({formatDate(r.start_date)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-field">
              <label>Método *</label>
              <select
                value={form.method}
                onChange={e => setForm(p => ({ ...p, method: e.target.value }))}
              >
                <option value="pix">Pix</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="refunded">Devolvido</option>
              </select>
            </div>
            <div className="form-field">
              <label>Data / hora do pagamento</label>
              <input
                type="datetime-local"
                value={form.paid_at}
                onChange={e => setForm(p => ({ ...p, paid_at: e.target.value }))}
                disabled={form.status !== 'paid'}
                style={{ opacity: form.status !== 'paid' ? 0.45 : 1 }}
              />
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Observações</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Comprovante, parcelas, nota fiscal…"
                rows={2}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {modal === 'edit' && (
              delConfirm ? (
                <div className="delete-confirm">
                  Excluir pagamento?
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
