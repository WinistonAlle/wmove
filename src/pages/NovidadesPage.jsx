import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'
import '../styles/novidades.css'

const RELEASES = [
  {
    version: '1.0.0',
    date: 'Junho 2026',
    tag: 'Lançamento',
    tagColor: '#10B981',
    title: 'WMove entra em operação',
    desc: 'Lançamento oficial da plataforma. Produto completo com todos os módulos core disponíveis para locadoras de todos os tamanhos.',
    features: [
      { type: 'new', text: 'Gestão de frota completa — cadastro, status, quilometragem e histórico' },
      { type: 'new', text: 'Módulo de aluguéis com geração automática de contratos em PDF' },
      { type: 'new', text: 'Agendamentos com detecção automática de conflito de datas' },
      { type: 'new', text: 'Cadastro de clientes com score de confiança e controle de blacklist' },
      { type: 'new', text: 'Módulo financeiro — DRE, fluxo de caixa e controle de despesas' },
      { type: 'new', text: 'Relatórios com exportação em PDF e Excel' },
      { type: 'new', text: 'Módulo de oficina e manutenção com ordens de serviço' },
      { type: 'new', text: 'Vistorias de entrada e saída com checklist de 14 itens' },
      { type: 'new', text: 'Controle de multas, sinistros e seguros' },
      { type: 'new', text: 'Notificações inteligentes em tempo real (Supabase Realtime)' },
      { type: 'new', text: 'Controle de combustível por veículo com análise de consumo' },
      { type: 'new', text: 'Dashboard com métricas em tempo real' },
      { type: 'new', text: 'Busca global (⌘K) em toda a plataforma' },
      { type: 'new', text: 'Tema claro e escuro — preferência salva por conta' },
      { type: 'new', text: 'Sidebar colapsável para maior área de trabalho' },
      { type: 'new', text: 'Planos WGo, WPlus, WPro e WMax com 14 dias de trial gratuito' },
    ],
  },
]

const TYPE_CONFIG = {
  new:      { label: 'Novo',     color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  improved: { label: 'Melhoria', color: '#6366F1', bg: 'rgba(99,102,241,0.1)'  },
  fix:      { label: 'Correção', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  removed:  { label: 'Removido', color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  security: { label: 'Segurança',color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)'  },
}

export default function NovidadesPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <div className="orbs">
        <div className="orb amber" style={{ opacity: 0.12 }} />
        <div className="orb indigo" style={{ opacity: 0.07 }} />
      </div>
      <div className="noise" />

      <header className="termos-topbar">
        <Link to="/" className="termos-brand">
          <img src="/assets/wmove-logo.png" alt="WMove" className="termos-logo" />
          <span>WMove</span>
        </Link>
        <div className="termos-topbar-right">
          <Link to="/cadastro" className="termos-cta-btn">Criar conta grátis</Link>
          <button className="icon-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark'
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            }
          </button>
        </div>
      </header>

      <div className="novidades-page">
        <div className="novidades-hero">
          <div className="termos-hero-badge">Changelog</div>
          <h1>Novidades da WMove</h1>
          <p>Acompanhe todas as atualizações, melhorias e lançamentos da plataforma.</p>
        </div>

        <div className="novidades-timeline">
          {RELEASES.map((release, i) => (
            <div key={i} className="novidades-release">
              <div className="novidades-release-meta">
                <div className="novidades-version">v{release.version}</div>
                <div className="novidades-date">{release.date}</div>
                <span className="novidades-tag" style={{ color: release.tagColor, background: release.tagColor + '18' }}>
                  {release.tag}
                </span>
              </div>
              <div className="novidades-release-content">
                <h2>{release.title}</h2>
                <p className="novidades-release-desc">{release.desc}</p>
                <ul className="novidades-features">
                  {release.features.map((f, j) => {
                    const cfg = TYPE_CONFIG[f.type]
                    return (
                      <li key={j} className="novidades-feature">
                        <span className="novidades-feature-tag" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.label}
                        </span>
                        <span>{f.text}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Suggest */}
        <div className="novidades-suggest">
          <div className="novidades-suggest-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div>
              <h3>Tem uma sugestão?</h3>
              <p>Adoramos feedback dos clientes. Me conte o que você gostaria de ver na próxima versão.</p>
            </div>
            <a href="mailto:produto@wmove.com.br?subject=Sugestão para a WMove" className="termos-cta-btn">
              Enviar sugestão
            </a>
          </div>
        </div>

        <footer className="sobre-footer" style={{ marginTop: 24 }}>
          <p>© 2026 WMove Tecnologia Ltda.</p>
          <div className="sobre-footer-links">
            <a href="/status">Status</a><span>·</span>
            <a href="/ajuda">Central de ajuda</a><span>·</span>
            <a href="mailto:suporte@wmove.com.br">Suporte</a>
          </div>
        </footer>
      </div>
    </>
  )
}
