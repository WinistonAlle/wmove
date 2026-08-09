import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import Modal from '../components/Modal'
import '../styles/inner.css'
import '../styles/financeiro.css'

// ─── Constants ───────────────────────────────────────────────

const EXPENSE_CATEGORIES = {
  fuel:        { label: 'Combustível',   color: '#f59e0b' },
  maintenance: { label: 'Manutenção',    color: '#6366f1' },
  insurance:   { label: 'Seguro',        color: '#3b82f6' },
  fine:        { label: 'Multa',         color: '#ef4444' },
  cleaning:    { label: 'Limpeza',       color: '#10b981' },
  tax:         { label: 'Impostos/IPVA', color: '#8b5cf6' },
  other:       { label: 'Outros',        color: '#6b7280' },
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ─── Helpers ─────────────────────────────────────────────────

function formatMoney(v, short = false) {
  if (!v && v !== 0) return 'R$ 0'
  if (short && Math.abs(v) >= 1000)
    return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function monthKey(dateStr) {
  return dateStr?.slice(0, 7) || ''
}

function lastNMonths(n) {
  const result = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

function monthLabel(yyyyMM) {
  const [, m] = yyyyMM.split('-')
  return MONTH_NAMES[parseInt(m) - 1]
}

const PERIOD_OPTIONS = [
  { key: '3',      label: '3 meses'    },
  { key: '6',      label: '6 meses'    },
  { key: '12',     label: '12 meses'   },
  { key: 'custom', label: 'Período…'   },
]

const EMPTY_EXPENSE = {
  vehicle_id:  '',
  category:    'fuel',
  description: '',
  amount:      '',
  date:        new Date().toISOString().slice(0, 10),
  notes:       '',
}

// ─── Component ───────────────────────────────────────────────

export default function FinanceiroPage() {
  const { userData } = useUser()
  const toast = useToast()
  const [period, setPeriod]             = useState('6')
  const now = new Date()
  const [customStart, setCustomStart]   = useState(`${now.getFullYear()}-${String(now.getMonth() - 2 < 0 ? 1 : now.getMonth() - 2 + 1).padStart(2,'0')}`)
  const [customEnd, setCustomEnd]       = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`)
  const [payments, setPayments]   = useState([])
  const [maintenances, setMaintenances] = useState([])
  const [fines, setFines]         = useState([])
  const [expenses, setExpenses]   = useState([])
  const [vehicles, setVehicles]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(EMPTY_EXPENSE)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [delConfirm, setDelConfirm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: m }, { data: f }, { data: e }, { data: v }] = await Promise.all([
      supabase.from('payments').select('amount, paid_at, status').eq('status', 'paid'),
      supabase.from('maintenances').select('cost, date').eq('completed', true).not('cost', 'is', null),
      supabase.from('fines').select('amount, due_date, status').eq('status', 'paid'),
      supabase.from('expenses').select('*, vehicles(plate, brand, model)').order('date', { ascending: false }),
      supabase.from('vehicles').select('id, plate, brand, model').order('plate'),
    ])
    setPayments(p || [])
    setMaintenances(m || [])
    setFines(f || [])
    setExpenses(e || [])
    setVehicles(v || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Period months ─────────────────────────────────────────
  const months = useMemo(() => {
    if (period === 'custom') {
      const result = []
      const [sy, sm] = customStart.split('-').map(Number)
      const [ey, em] = customEnd.split('-').map(Number)
      let y = sy, m = sm
      while (y < ey || (y === ey && m <= em)) {
        result.push(`${y}-${String(m).padStart(2, '0')}`)
        m++
        if (m > 12) { m = 1; y++ }
        if (result.length > 24) break
      }
      return result.length ? result : lastNMonths(6)
    }
    return lastNMonths(Number(period))
  }, [period, customStart, customEnd])
  const firstMonth = months[0]
  const lastMonth  = months[months.length - 1]

  // ── Aggregation ───────────────────────────────────────────
  const { income, expenseBreakdown, byMonth, totals } = useMemo(() => {
    // income: pagamentos no período
    const income = payments
      .filter(p => monthKey(p.paid_at) >= firstMonth && monthKey(p.paid_at) <= lastMonth)
      .reduce((s, p) => s + Number(p.amount), 0)

    // despesas por categoria no período
    const maint = maintenances
      .filter(m => monthKey(m.date) >= firstMonth && monthKey(m.date) <= lastMonth)
      .reduce((s, m) => s + Number(m.cost), 0)

    const fineTotal = fines
      .filter(f => monthKey(f.due_date) >= firstMonth && monthKey(f.due_date) <= lastMonth)
      .reduce((s, f) => s + Number(f.amount), 0)

    const expByCategory = {}
    expenses
      .filter(e => monthKey(e.date) >= firstMonth && monthKey(e.date) <= lastMonth)
      .forEach(e => {
        expByCategory[e.category] = (expByCategory[e.category] || 0) + Number(e.amount)
      })

    // montar breakdown
    const expenseBreakdown = [
      { key: 'maintenance', amount: maint },
      { key: 'fine',        amount: fineTotal },
      ...Object.entries(expByCategory).map(([key, amount]) => ({ key, amount })),
    ].filter(b => b.amount > 0)

    const totalExpenses = expenseBreakdown.reduce((s, b) => s + b.amount, 0)

    // by month para gráfico
    const byMonth = months.map(m => {
      const inc = payments
        .filter(p => monthKey(p.paid_at) === m)
        .reduce((s, p) => s + Number(p.amount), 0)

      const exp = [
        ...maintenances.filter(x => monthKey(x.date) === m).map(x => Number(x.cost)),
        ...fines.filter(x => monthKey(x.due_date) === m).map(x => Number(x.amount)),
        ...expenses.filter(x => monthKey(x.date) === m).map(x => Number(x.amount)),
      ].reduce((s, v) => s + v, 0)

      return { month: m, label: monthLabel(m), income: inc, expense: exp }
    })

    const maxVal = Math.max(...byMonth.map(b => Math.max(b.income, b.expense)), 1)

    return {
      income,
      expenseBreakdown: expenseBreakdown.sort((a, b) => b.amount - a.amount),
      byMonth: byMonth.map(b => ({ ...b, maxVal })),
      totals: { income, expenses: totalExpenses, result: income - totalExpenses },
    }
  }, [payments, maintenances, fines, expenses, months, firstMonth, lastMonth])

  const margin = totals.income > 0
    ? Math.round((totals.result / totals.income) * 100)
    : null

  // ── Recent expenses ───────────────────────────────────────
  const recentExpenses = useMemo(() =>
    expenses.filter(e => monthKey(e.date) >= firstMonth && monthKey(e.date) <= lastMonth)
  , [expenses, firstMonth, lastMonth])

  // ── Modal ─────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_EXPENSE)
    setEditTarget(null)
    setError('')
    setDelConfirm(false)
    setModal(true)
  }

  function openEdit(exp) {
    setForm({
      vehicle_id:  exp.vehicle_id  || '',
      category:    exp.category    || 'other',
      description: exp.description || '',
      amount:      exp.amount      ?? '',
      date:        exp.date        || '',
      notes:       exp.notes       || '',
    })
    setEditTarget(exp)
    setError('')
    setDelConfirm(false)
    setModal(true)
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    if (!form.description.trim()) { setError('Informe a descrição.'); return }
    if (!form.amount)             { setError('Informe o valor.'); return }
    if (!form.date)               { setError('Informe a data.'); return }
    setSaving(true)
    const payload = {
      company_id:  userData.company.id,
      vehicle_id:  form.vehicle_id || null,
      category:    form.category,
      description: form.description.trim(),
      amount:      Number(form.amount),
      date:        form.date,
      notes:       form.notes.trim() || null,
    }
    if (!editTarget) {
      const { error: err } = await supabase.from('expenses').insert(payload)
      if (err) { setError(err.message); setSaving(false); return }
      toast('Despesa lançada.')
    } else {
      const { error: err } = await supabase.from('expenses').update(payload).eq('id', editTarget.id)
      if (err) { setError(err.message); setSaving(false); return }
      toast('Despesa atualizada.')
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function del() {
    await supabase.from('expenses').delete().eq('id', editTarget.id)
    toast('Despesa removida.', 'info')
    setModal(false)
    load()
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Financeiro</h1>
      <p>DRE e fluxo de caixa da locadora</p>
    </div>
  )

  const topbarRight = (
    <button className="btn-add" onClick={openAdd}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Lançar despesa
    </button>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* Period selector */}
      <div className="fin-period-row">
        <div className="period-tabs">
          {PERIOD_OPTIONS.map(o => (
            <button
              key={o.key}
              className={`period-tab${period === o.key ? ' active' : ''}`}
              onClick={() => setPeriod(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="fin-custom-range">
            <input
              type="month"
              className="form-input fin-month-input"
              value={customStart}
              max={customEnd}
              onChange={e => setCustomStart(e.target.value)}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>até</span>
            <input
              type="month"
              className="form-input fin-month-input"
              value={customEnd}
              min={customStart}
              onChange={e => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* DRE + breakdown */}
      <div className="fin-grid">

        {/* DRE */}
        <div className="dash-card glass dre-card">
          <div className="card-head" style={{ marginBottom: 4 }}>
            <div>
              <h3 className="card-title">DRE — Últimos {period} meses</h3>
              <div className="card-subtitle">{monthLabel(firstMonth)} até {monthLabel(lastMonth)}</div>
            </div>
            {margin !== null && (
              <span className={`dre-margin ${totals.result >= 0 ? 'pos' : 'neg'}`}>
                {margin}% margem
              </span>
            )}
          </div>

          <div className="dre-row">
            <span className="dre-label">Receita bruta</span>
            <span className="dre-val positive num">{formatMoney(totals.income)}</span>
          </div>

          <div className="dre-divider" />

          {expenseBreakdown.map(b => (
            <div key={b.key} className="dre-row">
              <span className="dre-label" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: EXPENSE_CATEGORIES[b.key]?.color || '#6b7280', display: 'inline-block', flexShrink: 0 }} />
                (-) {EXPENSE_CATEGORIES[b.key]?.label || b.key}
              </span>
              <span className="dre-val negative num">– {formatMoney(b.amount)}</span>
            </div>
          ))}

          {expenseBreakdown.length === 0 && (
            <div className="dre-row">
              <span className="dre-label" style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Sem despesas registradas</span>
              <span className="dre-val">—</span>
            </div>
          )}

          <div className="dre-divider" />

          <div className="dre-row result">
            <span className="dre-label">Resultado</span>
            <span className={`dre-val num ${totals.result >= 0 ? 'result-pos' : 'result-neg'}`}>
              {totals.result >= 0 ? '' : '–'}{formatMoney(Math.abs(totals.result))}
            </span>
          </div>
        </div>

        {/* Breakdown de despesas */}
        <div className="dash-card glass" style={{ padding: '20px 24px' }}>
          <div className="card-head" style={{ marginBottom: 12 }}>
            <h3 className="card-title">Despesas por categoria</h3>
          </div>
          {expenseBreakdown.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              Sem despesas no período
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {expenseBreakdown.map(b => {
                const cat   = EXPENSE_CATEGORIES[b.key] || { label: b.key, color: '#6b7280' }
                const total = expenseBreakdown.reduce((s, x) => s + x.amount, 0) || 1
                const pct   = Math.round((b.amount / total) * 100)
                return (
                  <div key={b.key} className="breakdown-item">
                    <span className="breakdown-dot" style={{ background: cat.color }} />
                    <span className="breakdown-label">{cat.label}</span>
                    <div className="breakdown-bar-wrap">
                      <div className="breakdown-bar" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                    <span className="breakdown-pct">{pct}%</span>
                    <span className="breakdown-val num">{formatMoney(b.amount, true)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cash flow chart */}
      <div className="dash-card glass" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div className="card-head" style={{ marginBottom: 8 }}>
          <h3 className="card-title">Fluxo de caixa</h3>
          <div className="cf-legend">
            <div className="cf-legend-item">
              <div className="cf-legend-dot" style={{ background: '#10b981' }} />
              Receitas
            </div>
            <div className="cf-legend-item">
              <div className="cf-legend-dot" style={{ background: '#ef4444' }} />
              Despesas
            </div>
          </div>
        </div>
        <div className="cf-chart">
          {byMonth.map(b => (
            <div key={b.month} className="cf-col">
              <div className="cf-bars">
                <div className="cf-bar-wrap">
                  <div
                    className="cf-bar income"
                    style={{ height: `${b.income > 0 ? Math.max(4, (b.income / b.maxVal) * 100) : 0}%` }}
                  />
                </div>
                <div className="cf-bar-wrap">
                  <div
                    className="cf-bar expense"
                    style={{ height: `${b.expense > 0 ? Math.max(4, (b.expense / b.maxVal) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="cf-label">{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Despesas avulsas */}
      <div className="dash-card glass">
        <div className="card-head">
          <div>
            <h3 className="card-title">Despesas operacionais</h3>
            <div className="card-subtitle">{recentExpenses.length} lançamento{recentExpenses.length !== 1 ? 's' : ''} no período</div>
          </div>
          <button className="card-action" onClick={openAdd}>+ Lançar</button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="page-empty" style={{ padding: '24px 0' }}>
            Nenhuma despesa lançada no período.
          </div>
        ) : (
          <>
            <div className="extable-head">
              <span>Data</span>
              <span>Categoria</span>
              <span>Descrição</span>
              <span>Valor</span>
              <span />
            </div>
            {recentExpenses.map(exp => {
              const cat = EXPENSE_CATEGORIES[exp.category] || { label: exp.category, color: '#6b7280' }
              return (
                <div key={exp.id} className="extable-row gtable-row" onClick={() => openEdit(exp)}>
                  <div className="gtable-muted">{formatDate(exp.date)}</div>
                  <span className="cat-pill" style={{ borderColor: `${cat.color}30`, color: cat.color }}>
                    {cat.label}
                  </span>
                  <div>
                    <div className="gtable-cell">{exp.description}</div>
                    {exp.vehicles && (
                      <div className="gtable-muted">{exp.vehicles.plate} · {exp.vehicles.brand} {exp.vehicles.model}</div>
                    )}
                  </div>
                  <div className="gtable-cell num" style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {formatMoney(exp.amount)}
                  </div>
                  <button className="row-btn" onClick={e => { e.stopPropagation(); openEdit(exp) }} title="Editar">
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

      {/* Modal despesa */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Editar despesa' : 'Lançar despesa'}>
        <form className="dash-form" onSubmit={save}>

          <div className="form-row">
            <div className="form-field">
              <label>Categoria *</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Descrição *</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Abastecimento — ABC1234, IPVA 2026…"
                required
              />
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
              <label>Veículo</label>
              <select value={form.vehicle_id} onChange={e => setForm(p => ({ ...p, vehicle_id: e.target.value }))}>
                <option value="">Geral / sem veículo</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row single">
            <div className="form-field">
              <label>Observações</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Nota fiscal, fornecedor…"
                rows={2}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            {editTarget && (
              delConfirm ? (
                <div className="delete-confirm">
                  Excluir lançamento?
                  <button type="button" className="btn-danger-sm" onClick={del}>Sim</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setDelConfirm(false)}>Não</button>
                </div>
              ) : (
                <button type="button" className="btn-danger-ghost" onClick={() => setDelConfirm(true)}>Excluir</button>
              )
            )}
            <div className="form-actions-end">
              <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando…' : editTarget ? 'Salvar' : 'Lançar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  )
}
