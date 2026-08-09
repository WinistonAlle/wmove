import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useTheme } from '../hooks/useTheme'
import GlobalSearch from './GlobalSearch'
import '../styles/dashboard.css'

const NAV_ITEMS = [
  {
    section: 'Operação',
    items: [
      { label: 'Dashboard',   to: '/dashboard',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg> },
      { label: 'Frota',       to: '/frota',        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13h14l-1.4-4.2a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.3L5 13z"/><rect x="3.5" y="13" width="17" height="5" rx="1.2"/><circle cx="7.5" cy="18" r="1.4"/><circle cx="16.5" cy="18" r="1.4"/></svg> },
      { label: 'Aluguéis',    to: '/alugueis',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h16M4 8l1.5-3h13L20 8M4 8v10a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2h8v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V8"/><path d="M7 13h2M15 13h2"/></svg> },
      { label: 'Agendamentos', to: '/agendamentos',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
      { label: 'Clientes',   to: '/clientes',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6.5 7-6.5s7 2.9 7 6.5"/></svg> },
      { label: 'Oficina',    to: '/oficina',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6 2 2 5.6-5.6a4 4 0 0 0 5.4-5.4l-2.7 2.7-1.4-1.4 2.7-2.7z"/><path d="M16 14l4 4-2 2-4-4"/></svg> },
      { label: 'Vistoria',   to: '/vistoria',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
      { label: 'Multas',     to: '/multas',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
      { label: 'Sinistros',  to: '/sinistros',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
      { label: 'Seguro',     to: '/seguro',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { label: 'Financeiro',     to: '/financeiro',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
      { label: 'Notificações',  to: '/notificacoes',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2zM10 21a2 2 0 0 0 4 0"/></svg> },
      { label: 'Documentos',    to: '/documentos',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
      { label: 'Combustível',   to: '/combustivel',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v13"/><path d="M3 22h10M13 11h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9l-3-3"/><path d="M13 22v-4"/></svg> },
      { label: 'Pagamentos',    to: '/pagamentos',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> },
      { label: 'Contratos',     to: '/contratos',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg> },
      { label: 'Relatórios',   to: '/relatorios',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg> },
      { label: 'Plano',        to: '/billing',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M10 15h4"/></svg> },
      { label: 'Importação',    to: '/importacao',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
      { label: 'Configurações', to: '/configuracoes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ],
  },
]

function userInitials(fullName) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function DashboardLayout({ children, topbarLeft, topbarRight }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('wmove-collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const { userData } = useUser()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  function handleCollapse(v) {
    setCollapsed(v)
    localStorage.setItem('wmove-collapsed', v ? '1' : '0')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Cmd+K to open search
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Fetch critical alert count for bell badge
  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const [{ count: r }, { count: m }] = await Promise.all([
        supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('status', 'active').lt('expected_end', today),
        supabase.from('maintenances').select('*', { count: 'exact', head: true }).eq('completed', false).lt('date', today),
      ])
      setAlertCount((r ?? 0) + (m ?? 0))
    }
    load()
  }, [])

  return (
    <>
      <div className="orbs">
        <div className="orb amber" />
        <div className="orb indigo" />
        <div className="orb amber2" />
      </div>
      <div className="noise" />

      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className={`app${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Sidebar */}
        <aside className={`sidebar${mobileOpen ? ' mobile-visible' : ''}`}>
          <div className="brand">
            <img className="brand-logo brand-logo-dark" src="/assets/wmove-full-logo-dark.png" alt="WMove" />
            <img className="brand-logo brand-logo-light" src="/assets/wmove-full-logo.png" alt="WMove" />
            <img className="brand-mark-only" src="/assets/wmove-logo.png" alt="WMove" />
          </div>

          <nav className="nav">
            {NAV_ITEMS.map(group => (
              <div key={group.section}>
                <div className="nav-section">{group.section}</div>
                {group.items.map(item => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`nav-item${location.pathname === item.to ? ' active' : ''}`}
                  >
                    {item.icon}
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-foot">
            <button className="collapse-btn" onClick={() => handleCollapse(!collapsed)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              <span>Recolher</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="dash-main">
          <header className="dash-topbar">
            {/* Mobile hamburger */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div className="topbar-left">{topbarLeft}</div>
            <div className="dash-topbar-right">
              {topbarRight}
              <button className="dash-icon-btn" title="Buscar (⌘K)" onClick={() => setSearchOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                </svg>
              </button>
              <Link to="/notificacoes" className="dash-icon-btn notif-btn" title="Notificações">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2zM10 21a2 2 0 0 0 4 0"/>
                </svg>
                {alertCount > 0 && <span className="notif-badge">{alertCount > 9 ? '9+' : alertCount}</span>}
              </Link>
              <button className="dash-icon-btn" onClick={toggleTheme} title="Alternar tema">
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
                  </svg>
                )}
              </button>
              <div className="user-avatar" onClick={handleSignOut} title="Sair">
                {userInitials(userData?.profile?.full_name)}
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </>
  )
}
