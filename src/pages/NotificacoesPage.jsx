import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { supabase } from '../lib/supabase'
import '../styles/notificacoes.css'

const TABS = ['Todos', 'Crítico', 'Atenção', 'Info']

const SEV_LABEL = { critical: 'Crítico', warning: 'Atenção', info: 'Info' }

// ── icons ─────────────────────────────────────────────────
const IconShield   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconTool     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6 2 2 5.6-5.6a4 4 0 0 0 5.4-5.4l-2.7 2.7-1.4-1.4 2.7-2.7z"/></svg>
const IconAlert    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const IconCar      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13h14l-1.4-4.2a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.3L5 13z"/><rect x="3.5" y="13" width="17" height="5" rx="1.2"/><circle cx="7.5" cy="18" r="1.4"/><circle cx="16.5" cy="18" r="1.4"/></svg>
const IconCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
const IconPerson   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6.5 7-6.5s7 2.9 7 6.5"/></svg>

const ICON_MAP = {
  insurance:   <IconShield />,
  maintenance: <IconTool />,
  fine:        <IconAlert />,
  rental:      <IconCar />,
  booking:     <IconCalendar />,
  cnh:         <IconPerson />,
}

const ROUTE_MAP = {
  insurance:   '/seguro',
  maintenance: '/oficina',
  fine:        '/multas',
  rental:      '/alugueis',
  booking:     '/agendamentos',
  cnh:         '/clientes',
}

function daysDiff(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 86400000)
}

function fmtDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function buildAlerts({ insurances, maintenances, fines, rentals, bookings, vehicles, customers }) {
  const plateOf = (vid) => vehicles.find(v => v.id === vid)?.plate ?? '—'
  const alerts = []

  // ── Seguros ──────────────────────────────────────────
  for (const s of insurances) {
    const diff = daysDiff(s.end_date)
    if (diff < 0) {
      alerts.push({
        id: `ins-${s.id}`, type: 'insurance', sev: 'critical',
        title: 'Seguro vencido',
        desc: `${s.insurer} · Apólice ${s.policy_number ?? '—'}`,
        ref: plateOf(s.vehicle_id),
        date: s.end_date,
        dateLabel: `Venceu há ${Math.abs(diff)}d`,
      })
    } else if (diff <= 30) {
      alerts.push({
        id: `ins-${s.id}`, type: 'insurance', sev: 'warning',
        title: 'Seguro vencendo em breve',
        desc: `${s.insurer} · Apólice ${s.policy_number ?? '—'}`,
        ref: plateOf(s.vehicle_id),
        date: s.end_date,
        dateLabel: diff === 0 ? 'Vence hoje' : `Vence em ${diff}d`,
      })
    }
  }

  // ── Manutenções atrasadas ─────────────────────────────
  for (const m of maintenances) {
    if (!m.completed) {
      const diff = daysDiff(m.date)
      if (diff < 0) {
        alerts.push({
          id: `mnt-${m.id}`, type: 'maintenance', sev: 'critical',
          title: 'Manutenção atrasada',
          desc: m.description,
          ref: plateOf(m.vehicle_id),
          date: m.date,
          dateLabel: `Atrasada ${Math.abs(diff)}d`,
        })
      }
    }
  }

  // ── Multas ────────────────────────────────────────────
  for (const f of fines) {
    if (f.status === 'pending' && f.due_date) {
      const diff = daysDiff(f.due_date)
      if (diff < 0) {
        alerts.push({
          id: `fin-${f.id}`, type: 'fine', sev: 'critical',
          title: 'Multa vencida',
          desc: f.infraction ?? 'Infração não especificada',
          ref: f.plate ?? '—',
          date: f.due_date,
          dateLabel: `Vencida há ${Math.abs(diff)}d`,
        })
      } else if (diff <= 7) {
        alerts.push({
          id: `fin-${f.id}`, type: 'fine', sev: 'warning',
          title: 'Multa a vencer',
          desc: f.infraction ?? 'Infração não especificada',
          ref: f.plate ?? '—',
          date: f.due_date,
          dateLabel: diff === 0 ? 'Vence hoje' : `Vence em ${diff}d`,
        })
      }
    }
  }

  // ── Aluguéis sem devolução ────────────────────────────
  for (const r of rentals) {
    if (r.status === 'active') {
      const diff = daysDiff(r.expected_end)
      if (diff < 0) {
        alerts.push({
          id: `ren-${r.id}`, type: 'rental', sev: 'critical',
          title: 'Aluguel sem devolução',
          desc: `Devolução prevista ${fmtDate(r.expected_end)}`,
          ref: plateOf(r.vehicle_id),
          date: r.expected_end,
          dateLabel: `${Math.abs(diff)}d em atraso`,
        })
      }
    }
  }

  // ── Agendamentos próximos ─────────────────────────────
  for (const b of bookings) {
    if (b.status === 'confirmed') {
      const diff = daysDiff(b.start_date)
      if (diff >= 0 && diff <= 2) {
        alerts.push({
          id: `bkg-${b.id}`, type: 'booking', sev: 'info',
          title: diff === 0 ? 'Agendamento hoje' : diff === 1 ? 'Agendamento amanhã' : 'Agendamento em 2 dias',
          desc: `Veículo reservado`,
          ref: plateOf(b.vehicle_id),
          date: b.start_date,
          dateLabel: diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : 'Em 2 dias',
        })
      }
    }
  }

  // ── CNH vencendo ─────────────────────────────────────
  for (const c of customers ?? []) {
    const diff = daysDiff(c.cnh_expiry)
    if (diff < 0) {
      alerts.push({
        id: `cnh-${c.id}`, type: 'cnh', sev: 'critical',
        title: 'CNH vencida',
        desc: c.name,
        ref: c.cnh ?? '—',
        date: c.cnh_expiry,
        dateLabel: `Vencida há ${Math.abs(diff)}d`,
      })
    } else if (diff <= 30) {
      alerts.push({
        id: `cnh-${c.id}`, type: 'cnh', sev: 'warning',
        title: 'CNH vencendo',
        desc: c.name,
        ref: c.cnh ?? '—',
        date: c.cnh_expiry,
        dateLabel: diff === 0 ? 'Vence hoje' : `Vence em ${diff}d`,
      })
    }
  }

  // sort: critical first, then warning, then info; within each, most urgent first
  const order = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => order[a.sev] - order[b.sev] || a.date?.localeCompare(b.date ?? ''))

  return alerts
}

export default function NotificacoesPage() {
  const [tab, setTab]               = useState('Todos')
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function load() {
    const today = new Date().toISOString().slice(0, 10)
    const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    const in60  = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
    const in2   = new Date(Date.now() +  2 * 86400000).toISOString().slice(0, 10)

    const [
      { data: vehicles },
      { data: insurances },
      { data: maintenances },
      { data: fines },
      { data: rentals },
      { data: bookings },
      { data: customers },
    ] = await Promise.all([
      supabase.from('vehicles').select('id, plate'),
      supabase.from('insurances').select('*').lte('end_date', in30),
      supabase.from('maintenances').select('*').eq('completed', false).lt('date', today),
      supabase.from('fines').select('*').eq('status', 'pending').not('due_date', 'is', null),
      supabase.from('rentals').select('*').eq('status', 'active'),
      supabase.from('bookings').select('*').eq('status', 'confirmed').lte('start_date', in2).gte('start_date', today),
      supabase.from('customers').select('id, name, cnh, cnh_expiry').not('cnh_expiry', 'is', null).lte('cnh_expiry', in60),
    ])

    setData({
      vehicles:     vehicles     ?? [],
      insurances:   insurances   ?? [],
      maintenances: maintenances ?? [],
      fines:        fines        ?? [],
      rentals:      rentals      ?? [],
      bookings:     bookings     ?? [],
      customers:    customers    ?? [],
    })
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' },    () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenances' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fines' },      () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insurances' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },   () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' },  () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const alerts = useMemo(() => data ? buildAlerts(data) : [], [data])

  const counts = useMemo(() => ({
    critical: alerts.filter(a => a.sev === 'critical').length,
    warning:  alerts.filter(a => a.sev === 'warning').length,
    info:     alerts.filter(a => a.sev === 'info').length,
  }), [alerts])

  const filtered = useMemo(() => {
    if (tab === 'Todos')   return alerts
    if (tab === 'Crítico') return alerts.filter(a => a.sev === 'critical')
    if (tab === 'Atenção') return alerts.filter(a => a.sev === 'warning')
    if (tab === 'Info')    return alerts.filter(a => a.sev === 'info')
    return alerts
  }, [alerts, tab])

  const topbarLeft = (
    <div className="greet">
      <h1>Notificações</h1>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="notif-live-dot" />
        {lastUpdated
          ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Carregando…'}
      </p>
    </div>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft}>
      <div className="page-content">

        {/* KPIs */}
        <div className="notif-kpis">
          <div className="notif-kpi critical">
            <span className="notif-kpi-val">{loading ? '—' : counts.critical}</span>
            <span className="notif-kpi-label">Críticos</span>
          </div>
          <div className="notif-kpi warning">
            <span className="notif-kpi-val">{loading ? '—' : counts.warning}</span>
            <span className="notif-kpi-label">Atenção</span>
          </div>
          <div className="notif-kpi info">
            <span className="notif-kpi-val">{loading ? '—' : counts.info}</span>
            <span className="notif-kpi-label">Informativos</span>
          </div>
          <div className="notif-kpi total">
            <span className="notif-kpi-val">{loading ? '—' : alerts.length}</span>
            <span className="notif-kpi-label">Total</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="period-tabs" style={{ marginBottom: 16 }}>
          {TABS.map(t => (
            <button
              key={t}
              className={`period-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === 'Crítico' && counts.critical > 0 && (
                <span className="notif-tab-badge critical">{counts.critical}</span>
              )}
              {t === 'Atenção' && counts.warning > 0 && (
                <span className="notif-tab-badge warning">{counts.warning}</span>
              )}
            </button>
          ))}
        </div>

        {/* Alert list */}
        {loading ? (
          <div className="loading-state">Carregando alertas…</div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>Nenhum alerta{tab !== 'Todos' ? ` ${tab.toLowerCase()}` : ''} no momento</p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map(alert => (
              <div key={alert.id} className={`notif-card ${alert.sev}`}>
                <div className={`notif-stripe ${alert.sev}`} />
                <div className={`notif-icon-wrap ${alert.sev}`}>
                  {ICON_MAP[alert.type]}
                </div>
                <div className="notif-body">
                  <div className="notif-header-row">
                    <span className="notif-title">{alert.title}</span>
                    <span className={`notif-sev-pill ${alert.sev}`}>{SEV_LABEL[alert.sev]}</span>
                  </div>
                  <p className="notif-desc">{alert.desc}</p>
                  <div className="notif-meta">
                    {alert.ref && alert.ref !== '—' && (
                      <span className="notif-plate">{alert.ref}</span>
                    )}
                    <span className="notif-date-label">{alert.dateLabel}</span>
                  </div>
                </div>
                <a href={ROUTE_MAP[alert.type]} className="notif-action-btn">
                  Ver
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
