import { useState } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import { useUser } from '../context/UserContext'
import DashboardLayout from '../components/DashboardLayout'
import '../styles/dashboard.css'

// ─── Helpers ────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h >= 12 && h < 18) return 'Boa tarde'
  if (h >= 18 || h < 5) return 'Boa noite'
  return 'Bom dia'
}

function todayLabel() {
  const d = new Date()
  const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`
}

function firstName(fullName) {
  return fullName?.trim().split(' ')[0] || 'você'
}

const STATUS_MAP = {
  available:   { cls: 'avail',  label: 'disponível' },
  rented:      { cls: 'rented', label: 'alugado'    },
  maintenance: { cls: 'shop',   label: 'oficina'    },
  inactive:    { cls: 'shop',   label: 'inativo'    },
}

const RENTAL_TYPE_LABEL = {
  active:    'Retirada',
  completed: 'Devolução',
  cancelled: 'Cancelada',
}

const AV_CLASSES = ['av-1','av-2','av-3','av-4','av-5','av-6']
function avatarClass(name = '') {
  let h = 0
  for (const c of name) h = (h + c.charCodeAt(0)) % AV_CLASSES.length
  return AV_CLASSES[h]
}
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function formatRevenue(amount) {
  if (amount >= 1000) return { main: `R$ ${(amount / 1000).toFixed(1).replace('.', ',')}`, unit: 'k' }
  return { main: `R$ ${amount.toLocaleString('pt-BR')}`, unit: '' }
}
function rentalAmount(rental) {
  if (rental.status === 'completed' && rental.total_amount)
    return `+ R$ ${Number(rental.total_amount).toLocaleString('pt-BR')}`
  const days = Math.max(1, Math.ceil((new Date(rental.expected_end) - new Date(rental.start_date)) / 86400000))
  return `+ R$ ${(days * Number(rental.daily_rate)).toLocaleString('pt-BR')}`
}
function rentalTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function vehicleSubtitle(v) {
  const km = (v.mileage || 0) >= 1000 ? `${(v.mileage / 1000).toFixed(1)}k km` : `${v.mileage || 0} km`
  return [v.year, km].filter(Boolean).join(' · ')
}

// ─── Component ──────────────────────────────────────────────

export default function DashboardPage() {
  const [filter, setFilter] = useState('all')
  const { userData } = useUser()
  const { data, loading } = useDashboardData()

  const metrics = data?.metrics
  const vehicles = data?.vehicles || []
  const rentals  = data?.rentals  || []

  const occupancyPct = metrics?.totalVehicles
    ? Math.round((metrics.rentedCount / metrics.totalVehicles) * 100)
    : 0

  const filteredFleet = filter === 'all'
    ? vehicles.slice(0, 6)
    : vehicles.filter(v => {
        if (filter === 'avail') return v.status === 'available'
        if (filter === 'rented') return v.status === 'rented'
        return true
      }).slice(0, 6)

  const revenue = metrics ? formatRevenue(metrics.monthRevenue) : null

  const fleetDist = metrics ? [
    { label: 'Disponíveis',   count: metrics.availableCount,   pct: metrics.totalVehicles ? Math.round((metrics.availableCount   / metrics.totalVehicles) * 100) : 0 },
    { label: 'Alugados',      count: metrics.rentedCount,      pct: metrics.totalVehicles ? Math.round((metrics.rentedCount      / metrics.totalVehicles) * 100) : 0 },
    { label: 'Em manutenção', count: metrics.maintenanceCount, pct: metrics.totalVehicles ? Math.round((metrics.maintenanceCount / metrics.totalVehicles) * 100) : 0 },
  ] : []

  const topbarLeft = (
    <div className="greet">
      <h1>
        <span className="wave">👋</span>{' '}
        {greeting()}, {userData?.profile ? firstName(userData.profile.full_name) : '…'}
      </h1>
      <p>
        <span>{todayLabel()}</span>
        {!loading && metrics?.totalVehicles > 0 && (
          <>
            <span className="dot" />
            <span>
              Frota com{' '}
              <span style={{ color: occupancyPct >= 70 ? 'var(--emerald)' : occupancyPct >= 40 ? 'var(--accent)' : 'var(--text-muted)' }}>
                {occupancyPct}% de ocupação
              </span>
            </span>
          </>
        )}
      </p>
    </div>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft}>

      {/* Metrics */}
      <section className="metrics">
        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Frota total</div>
            <div className="metric-icon amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 14h14l-1.4-4.2a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.3L5 14z"/><rect x="3.5" y="14" width="17" height="4" rx="1.2"/><circle cx="7.5" cy="18" r="1.2" fill="currentColor"/><circle cx="16.5" cy="18" r="1.2" fill="currentColor"/></svg>
            </div>
          </div>
          <div className="metric-value num">{loading ? '—' : metrics.totalVehicles}</div>
          <div className="metric-foot"><span>veículos cadastrados</span></div>
        </div>

        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Alugados agora</div>
            <div className="metric-icon indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
            </div>
          </div>
          <div className="metric-value num">{loading ? '—' : metrics.rentedCount}</div>
          <div className="metric-foot"><span>{loading ? '—' : `${occupancyPct}% ocupação`}</span></div>
          <div className="occu-bar-mini"><span style={{ width: `${occupancyPct}%` }} /></div>
        </div>

        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Receita do mês</div>
            <div className="metric-icon emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div className="metric-value num">
            {loading ? '—' : <>{revenue.main}<span className="unit">{revenue.unit}</span></>}
          </div>
          <div className="metric-foot">
            {!loading && metrics.revenueGrowth !== null && (
              <span className={`pill${metrics.revenueGrowth < 0 ? ' danger' : ''}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {metrics.revenueGrowth >= 0 ? <path d="M6 15l6-6 6 6"/> : <path d="M6 9l6 6 6-6"/>}
                </svg>
                {Math.abs(metrics.revenueGrowth)}%
              </span>
            )}
            <span>vs. mês passado</span>
          </div>
        </div>

        <div className="metric glass">
          <div className="metric-head">
            <div className="metric-label">Em manutenção</div>
            <div className="metric-icon danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6 2 2 5.6-5.6a4 4 0 0 0 5.4-5.4l-2.7 2.7-1.4-1.4 2.7-2.7z"/></svg>
            </div>
          </div>
          <div className="metric-value num">{loading ? '—' : metrics.maintenanceCount}</div>
          <div className="metric-foot">
            {!loading && metrics.urgentCount > 0 && <span className="pill danger">{metrics.urgentCount} urgente{metrics.urgentCount > 1 ? 's' : ''}</span>}
            {!loading && (metrics.totalPending - metrics.urgentCount) > 0 && <span>{metrics.totalPending - metrics.urgentCount} revisão</span>}
            {!loading && metrics.urgentCount === 0 && metrics.totalPending === 0 && <span>sem pendências</span>}
          </div>
        </div>
      </section>

      {/* Two-column */}
      <section className="grid-2">
        <div className="dash-card glass">
          <div className="card-head">
            <div>
              <h3 className="card-title">Status da frota</h3>
              <div className="card-subtitle">{loading ? 'Carregando…' : `${vehicles.length} veículos · atualizado agora`}</div>
            </div>
            <div className="seg">
              {['all','avail','rented'].map(f => (
                <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                  {{ all: 'Todos', avail: 'Disponíveis', rented: 'Alugados' }[f]}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="page-empty">Carregando frota…</div>
          ) : filteredFleet.length === 0 ? (
            <div className="page-empty">Nenhum veículo encontrado</div>
          ) : (
            <div>
              {filteredFleet.map(v => {
                const s = STATUS_MAP[v.status] || { cls: 'shop', label: v.status }
                return (
                  <div key={v.id} className="fleet-row">
                    <span className="plate">{v.plate}</span>
                    <div>
                      <div className="fleet-model">{v.brand} {v.model}</div>
                      <div className="fleet-cat">{vehicleSubtitle(v)}</div>
                    </div>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="dash-card glass">
          <div className="card-head">
            <div>
              <h3 className="card-title">Últimas movimentações</h3>
              <div className="card-subtitle">{todayLabel()}</div>
            </div>
            <span className="card-action">Ver tudo</span>
          </div>
          {loading ? (
            <div className="page-empty">Carregando movimentações…</div>
          ) : rentals.length === 0 ? (
            <div className="page-empty">Nenhuma movimentação registrada</div>
          ) : (
            <div>
              {rentals.map(r => {
                const customerName = r.customers?.name || 'Cliente'
                return (
                  <div key={r.id} className="mov-row">
                    <div className={`mov-av ${avatarClass(customerName)}`}>{initials(customerName)}</div>
                    <div className="mov-body">
                      <div className="mov-name">{customerName}</div>
                      <div className="mov-meta">
                        <span className="plate-sm">{r.vehicles?.plate || '—'}</span>
                        · {RENTAL_TYPE_LABEL[r.status] || r.status} · {rentalTime(r.created_at)}
                      </div>
                    </div>
                    <div className="mov-amount num">{rentalAmount(r)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Fleet distribution */}
      <section className="dash-card glass occu-card">
        <div className="card-head">
          <div>
            <h3 className="card-title">Distribuição da frota</h3>
            <div className="card-subtitle">% de veículos por status em relação ao total cadastrado</div>
          </div>
          <span className="card-action">{todayLabel().split(',')[0]} · {new Date().getFullYear()}</span>
        </div>
        {loading ? (
          <div className="page-empty" style={{ padding: '12px 0' }}>Carregando…</div>
        ) : (
          <div className="occu-grid">
            {fleetDist.map((item, i) => (
              <div key={item.label} className="occu-item">
                <div className="occu-item-label">
                  <span className="lab">{item.label} <span className="count">· {item.count} veículos</span></span>
                  <span className="pct num">
                    {item.pct}<span style={{ fontSize: 14, color: 'var(--text-muted)', letterSpacing: 0, marginLeft: 1 }}>%</span>
                  </span>
                </div>
                <div className="occu-bar">
                  <div className="occu-fill" style={{ width: `${item.pct}%`, animationDelay: `${i * 0.1}s` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </DashboardLayout>
  )
}
