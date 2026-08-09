import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import DashboardLayout from '../components/DashboardLayout'
import '../styles/inner.css'
import '../styles/relatorios.css'

// ─── Helpers ─────────────────────────────────────────────────

function formatMoney(val) {
  if (!val && val !== 0) return '—'
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

function formatMonthLabel(yyyyMM) {
  const [y, m] = yyyyMM.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return months[parseInt(m) - 1]
}

function last6Months() {
  const result = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

// ─── Component ───────────────────────────────────────────────

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [topVehicles, setTopVehicles] = useState([])
  const [rentalsByStatus, setRentalsByStatus] = useState([])

  useEffect(() => {
    async function load() {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      sixMonthsAgo.setHours(0, 0, 0, 0)

      const [
        { data: payments },
        { data: rentals },
        { data: customers },
        { data: vehicles },
      ] = await Promise.all([
        supabase.from('payments').select('amount, paid_at').eq('status', 'paid').order('paid_at'),
        supabase.from('rentals').select('id, status, total_amount, daily_rate, start_date, expected_end, vehicle_id, vehicles(plate, brand, model)'),
        supabase.from('customers').select('id'),
        supabase.from('vehicles').select('id, status'),
      ])

      // ── KPIs ─────────────────────────────────────────────
      const totalRevenue  = (payments || []).reduce((s, p) => s + Number(p.amount), 0)
      const completed     = (rentals || []).filter(r => r.status === 'completed')
      const avgTicket     = completed.length > 0
        ? completed.reduce((s, r) => s + Number(r.total_amount || 0), 0) / completed.length
        : 0
      const totalVehicles = (vehicles || []).length
      const rented        = (vehicles || []).filter(v => v.status === 'rented').length
      const occupancy     = totalVehicles > 0 ? Math.round((rented / totalVehicles) * 100) : 0

      setKpis({
        totalRevenue,
        avgTicket,
        totalRentals: (rentals || []).length,
        totalCustomers: (customers || []).length,
        occupancy,
      })

      // ── Monthly Revenue (last 6 months) ──────────────────
      const months = last6Months()
      const byMonth = {}
      months.forEach(m => { byMonth[m] = 0 })
      ;(payments || []).forEach(p => {
        const key = p.paid_at?.slice(0, 7)
        if (key && byMonth[key] !== undefined) byMonth[key] += Number(p.amount)
      })
      const monthData = months.map(m => ({ month: m, label: formatMonthLabel(m), value: byMonth[m] }))
      setMonthlyRevenue(monthData)

      // ── Top Vehicles by revenue ───────────────────────────
      const byVehicle = {}
      ;(rentals || []).filter(r => r.status === 'completed' && r.total_amount).forEach(r => {
        const id = r.vehicle_id
        if (!byVehicle[id]) byVehicle[id] = { vehicle: r.vehicles, total: 0, count: 0 }
        byVehicle[id].total += Number(r.total_amount)
        byVehicle[id].count++
      })
      const sorted = Object.values(byVehicle).sort((a, b) => b.total - a.total).slice(0, 5)
      setTopVehicles(sorted)

      // ── Rentals by status ─────────────────────────────────
      const statusCount = { active: 0, completed: 0, cancelled: 0 }
      ;(rentals || []).forEach(r => { statusCount[r.status] = (statusCount[r.status] || 0) + 1 })
      const total = (rentals || []).length || 1
      setRentalsByStatus([
        { label: 'Ativas',      count: statusCount.active,    pct: Math.round((statusCount.active    / total) * 100), color: 'var(--accent-chart)' },
        { label: 'Concluídas',  count: statusCount.completed, pct: Math.round((statusCount.completed / total) * 100), color: 'var(--emerald-chart)' },
        { label: 'Canceladas',  count: statusCount.cancelled, pct: Math.round((statusCount.cancelled / total) * 100), color: 'var(--danger)'  },
      ])

      setLoading(false)
    }
    load()
  }, [])

  const maxVehicle = topVehicles[0]?.total || 1

  async function exportPDF() {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório WMove', 14, 18)
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 26)

    autoTable(doc, {
      startY: 34,
      head: [['KPI', 'Valor']],
      body: [
        ['Receita total', formatMoney(kpis.totalRevenue)],
        ['Ticket médio', formatMoney(kpis.avgTicket)],
        ['Total de locações', String(kpis.totalRentals)],
        ['Clientes atendidos', String(kpis.totalCustomers)],
        ['Ocupação atual', `${kpis.occupancy}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
    })

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Mês', 'Receita']],
      body: monthlyRevenue.map(m => [m.label, formatMoney(m.value)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
    })

    if (topVehicles.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 12,
        head: [['#', 'Placa', 'Veículo', 'Locações', 'Receita']],
        body: topVehicles.map((v, i) => [
          i + 1,
          v.vehicle?.plate || '—',
          v.vehicle ? `${v.vehicle.brand} ${v.vehicle.model}` : '—',
          v.count,
          formatMoney(v.total),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
      })
    }

    doc.save(`wmove-relatorio-${new Date().toISOString().slice(0,10)}.pdf`)
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const kpiSheet = XLSX.utils.aoa_to_sheet([
      ['KPI', 'Valor'],
      ['Receita total', kpis.totalRevenue],
      ['Ticket médio', kpis.avgTicket],
      ['Total de locações', kpis.totalRentals],
      ['Clientes atendidos', kpis.totalCustomers],
      ['Ocupação atual (%)', kpis.occupancy],
    ])
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs')

    const revenueSheet = XLSX.utils.aoa_to_sheet([
      ['Mês', 'Receita (R$)'],
      ...monthlyRevenue.map(m => [m.label, m.value]),
    ])
    XLSX.utils.book_append_sheet(wb, revenueSheet, 'Receita Mensal')

    if (topVehicles.length > 0) {
      const vehicleSheet = XLSX.utils.aoa_to_sheet([
        ['#', 'Placa', 'Veículo', 'Locações', 'Receita (R$)'],
        ...topVehicles.map((v, i) => [
          i + 1,
          v.vehicle?.plate || '',
          v.vehicle ? `${v.vehicle.brand} ${v.vehicle.model}` : '',
          v.count,
          v.total,
        ]),
      ])
      XLSX.utils.book_append_sheet(wb, vehicleSheet, 'Top Veículos')
    }

    XLSX.writeFile(wb, `wmove-relatorio-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const topbarLeft = (
    <div className="greet">
      <h1>Relatórios</h1>
      <p>Visão geral do desempenho da locadora</p>
    </div>
  )

  const topbarRight = !loading && (
    <div className="rel-export-btns">
      <button className="rel-export-btn" onClick={exportExcel} title="Exportar Excel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6M8 13l2 2-2 2M12 17h4"/></svg>
        Excel
      </button>
      <button className="rel-export-btn primary" onClick={exportPDF} title="Exportar PDF">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6"/><path d="M9 13h2.5a1.5 1.5 0 0 1 0 3H9v-6h2a1 1 0 0 1 0 2H9"/></svg>
        PDF
      </button>
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout topbarLeft={topbarLeft}>
        <div className="page-empty" style={{ paddingTop: 80 }}>Carregando dados…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topbarLeft={topbarLeft} topbarRight={topbarRight}>

      {/* KPIs */}
      <section className="metrics" style={{ marginBottom: 20 }}>
        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Receita total</div>
            <div className="metric-icon emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div className="metric-value num">{formatMoney(kpis.totalRevenue)}</div>
          <div className="metric-foot"><span>todos os pagamentos</span></div>
        </div>

        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Ticket médio</div>
            <div className="metric-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
            </div>
          </div>
          <div className="metric-value num">{formatMoney(kpis.avgTicket)}</div>
          <div className="metric-foot"><span>por locação concluída</span></div>
        </div>

        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Total de locações</div>
            <div className="metric-icon indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8h16M4 8l1.5-3h13L20 8M4 8v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8"/>
              </svg>
            </div>
          </div>
          <div className="metric-value num">{kpis.totalRentals}</div>
          <div className="metric-foot"><span>{kpis.totalCustomers} clientes atendidos</span></div>
        </div>

        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Ocupação atual</div>
            <div className="metric-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h4l3-9 4 18 3-9h4"/>
              </svg>
            </div>
          </div>
          <div className="metric-value num">{kpis.occupancy}<span className="unit" style={{ fontSize: 18 }}>%</span></div>
          <div className="metric-foot"><span>frota alugada agora</span></div>
          <div className="occu-bar-mini"><span style={{ width: `${kpis.occupancy}%` }} /></div>
        </div>
      </section>

      <div className="rel-grid-main">

        {/* Monthly Revenue Chart */}
        <div className="dash-card glass rel-chart-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Receita por mês</h3>
              <div className="card-subtitle">Pagamentos confirmados nos últimos 6 meses</div>
            </div>
          </div>
          <div className="bar-chart">
            {monthlyRevenue.map(m => (
              <div key={m.month} className="bar-col">
                <div className="bar-val num">{m.value > 0 ? formatMoney(m.value) : ''}</div>
                <div className="bar-wrap">
                  <div
                    className="bar-fill"
                    style={{ height: `${m.value > 0 ? Math.max(4, (m.value / Math.max(...monthlyRevenue.map(x => x.value), 1)) * 100) : 0}%` }}
                  />
                </div>
                <div className="bar-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rental breakdown */}
        <div className="dash-card glass">
          <div className="card-head">
            <div>
              <h3 className="card-title">Locações por status</h3>
              <div className="card-subtitle">Distribuição de {kpis.totalRentals} locações</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            {rentalsByStatus.map(s => (
              <div key={s.label} className="occu-item">
                <div className="occu-item-label">
                  <span className="lab">{s.label} <span className="count">· {s.count}</span></span>
                  <span className="pct num">{s.pct}<span style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: 0, marginLeft: 1 }}>%</span></span>
                </div>
                <div className="occu-bar">
                  <div className="occu-fill" style={{ width: `${s.pct}%`, background: s.color, boxShadow: 'none' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Vehicles */}
      <div className="dash-card glass" style={{ marginTop: 20 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">Top veículos por receita</h3>
            <div className="card-subtitle">Baseado nas locações concluídas</div>
          </div>
        </div>
        {topVehicles.length === 0 ? (
          <div className="page-empty" style={{ padding: '24px 0' }}>Nenhuma locação concluída ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {topVehicles.map((v, i) => (
              <div key={i} className="top-vehicle-row">
                <div className="top-vehicle-rank">{i + 1}</div>
                <span className="plate" style={{ fontSize: 11 }}>{v.vehicle?.plate || '—'}</span>
                <div className="top-vehicle-name">
                  <div>{v.vehicle ? `${v.vehicle.brand} ${v.vehicle.model}` : '—'}</div>
                  <div className="gtable-muted">{v.count} locação{v.count !== 1 ? 'ões' : ''}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="occu-bar" style={{ height: 6 }}>
                    <div className="occu-fill" style={{ width: `${(v.total / maxVehicle) * 100}%` }} />
                  </div>
                </div>
                <div className="top-vehicle-total num">{formatMoney(v.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </DashboardLayout>
  )
}
