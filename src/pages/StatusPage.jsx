import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'
import '../styles/status.css'

const COMPONENTS = [
  { name: 'Plataforma web',         desc: 'Interface principal e navegação',           status: 'operational' },
  { name: 'Autenticação',           desc: 'Login, cadastro e sessões de usuário',       status: 'operational' },
  { name: 'Banco de dados',         desc: 'Armazenamento e consultas de dados',         status: 'operational' },
  { name: 'API de dados',           desc: 'Comunicação entre frontend e backend',       status: 'operational' },
  { name: 'Geração de contratos',   desc: 'Exportação de contratos em PDF',            status: 'operational' },
  { name: 'Exportação de relatórios','desc': 'PDF e Excel dos módulos de relatórios',  status: 'operational' },
  { name: 'Notificações em tempo real','desc': 'Alertas e atualizações instantâneas',   status: 'operational' },
  { name: 'E-mails transacionais',  desc: 'Confirmações, alertas e comunicados',       status: 'operational' },
  { name: 'Processamento de pagamentos','desc': 'Cobranças e gestão de assinaturas',   status: 'operational' },
]

const STATUS_CONFIG = {
  operational:   { label: 'Operacional',    color: '#10B981', bg: 'rgba(16,185,129,0.1)',  dot: '#10B981' },
  degraded:      { label: 'Degradado',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  partial:       { label: 'Parcial',        color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  dot: '#F59E0B' },
  incident:      { label: 'Incidente',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   dot: '#EF4444' },
  maintenance:   { label: 'Manutenção',     color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  dot: '#6366F1' },
}

const HISTORY = [
  {
    date: '03/06/2026',
    title: 'Lançamento da plataforma WMove',
    type: 'info',
    desc: 'A WMove entra em operação oficial. Todos os sistemas iniciados e funcionando normalmente.',
  },
]

function formatNow() {
  return new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }) + ' (Brasília)'
}

export default function StatusPage() {
  const { theme, toggleTheme } = useTheme()
  const [time, setTime] = useState(formatNow)

  useEffect(() => {
    const t = setInterval(() => setTime(formatNow()), 30000)
    return () => clearInterval(t)
  }, [])

  const allOperational = COMPONENTS.every(c => c.status === 'operational')

  return (
    <>
      <div className="orbs">
        <div className="orb amber" style={{ opacity: 0.1 }} />
      </div>
      <div className="noise" />

      <header className="termos-topbar">
        <Link to="/" className="termos-brand">
          <img src="/assets/wmove-logo.png" alt="WMove" className="termos-logo" />
          <span>WMove</span>
        </Link>
        <div className="termos-topbar-right">
          <button className="icon-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark'
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            }
          </button>
        </div>
      </header>

      <div className="status-page">
        {/* Overall status */}
        <div className={`status-banner ${allOperational ? 'ok' : 'issue'}`}>
          <div className="status-banner-icon">
            {allOperational
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </div>
          <div>
            <h1>{allOperational ? 'Todos os sistemas operacionais' : 'Atenção: incidente em andamento'}</h1>
            <p>Atualizado em {time}</p>
          </div>
        </div>

        {/* Components */}
        <div className="status-section">
          <h2>Componentes</h2>
          <div className="status-components">
            {COMPONENTS.map(c => {
              const cfg = STATUS_CONFIG[c.status]
              return (
                <div key={c.name} className="status-component">
                  <div className="status-component-left">
                    <div className="status-dot" style={{ background: cfg.dot }} />
                    <div>
                      <div className="status-component-name">{c.name}</div>
                      <div className="status-component-desc">{c.desc}</div>
                    </div>
                  </div>
                  <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Uptime */}
        <div className="status-section">
          <h2>Disponibilidade — últimos 90 dias</h2>
          <div className="status-uptime-row">
            <div className="status-uptime-bars">
              {Array.from({ length: 90 }, (_, i) => (
                <div key={i} className="status-uptime-bar operational" title="Operacional" />
              ))}
            </div>
            <div className="status-uptime-labels">
              <span>90 dias atrás</span>
              <span className="status-uptime-pct">100% uptime</span>
              <span>Hoje</span>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="status-section">
          <h2>Histórico de incidentes</h2>
          {HISTORY.length === 0 ? (
            <div className="status-no-incidents">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>Nenhum incidente registrado nos últimos 90 dias.</p>
            </div>
          ) : (
            <div className="status-history">
              {HISTORY.map((h, i) => (
                <div key={i} className={`status-history-item ${h.type}`}>
                  <div className="status-history-date">{h.date}</div>
                  <div className="status-history-content">
                    <div className="status-history-title">{h.title}</div>
                    <p className="status-history-desc">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SLA note */}
        <div className="status-sla">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>A WMove garante disponibilidade de <strong>99,5%</strong> ao mês conforme nosso SLA. Para detalhes, consulte os <a href="/termos#disponibilidade">Termos de Uso</a>. Em caso de incidente, entre em contato pelo <a href="mailto:suporte@wmove.com.br">suporte@wmove.com.br</a>.</p>
        </div>

        <footer className="sobre-footer">
          <p>© 2026 WMove Tecnologia Ltda.</p>
          <div className="sobre-footer-links">
            <a href="/termos">Termos</a><span>·</span>
            <a href="/privacidade">Privacidade</a><span>·</span>
            <a href="mailto:suporte@wmove.com.br">Suporte</a>
          </div>
        </footer>
      </div>
    </>
  )
}
