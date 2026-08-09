import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'
import '../styles/integracoes.css'

const ACTIVE = [
  {
    name: 'Supabase',
    category: 'Banco de dados & Auth',
    desc: 'Infraestrutura de banco de dados PostgreSQL e autenticação com Row Level Security. Base de toda a plataforma WMove.',
    status: 'ativo',
    color: '#10B981',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  },
  {
    name: 'ViaCEP',
    category: 'Endereços',
    desc: 'Consulta de endereços por CEP no cadastro de empresas e clientes. Preenchimento automático de logradouro, cidade e estado.',
    status: 'ativo',
    color: '#6366F1',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  },
  {
    name: 'jsPDF',
    category: 'Geração de documentos',
    desc: 'Geração de contratos de locação e relatórios financeiros em PDF diretamente no navegador, sem servidor intermediário.',
    status: 'ativo',
    color: '#F59E0B',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    name: 'SheetJS (xlsx)',
    category: 'Exportação de dados',
    desc: 'Exportação de relatórios, listas de veículos e histórico financeiro em formato Excel (.xlsx) compatível com Google Sheets e Microsoft Excel.',
    status: 'ativo',
    color: '#10B981',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13l2 2-2 2M12 17h4"/></svg>,
  },
  {
    name: 'Stripe',
    category: 'Pagamentos',
    desc: 'Cobrança recorrente de assinaturas, gestão de planos e portal do cliente para gerenciamento de billing.',
    status: 'ativo',
    color: '#6366F1',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
]

const COMING_SOON = [
  {
    name: 'WhatsApp Business API',
    category: 'Comunicação',
    desc: 'Envio automático de confirmações de reserva, lembretes de devolução e alertas de vencimento diretamente pelo WhatsApp.',
    eta: 'Em desenvolvimento',
    icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
  },
  {
    name: 'NFS-e (Nota Fiscal de Serviço)',
    category: 'Fiscal',
    desc: 'Emissão automática de notas fiscais de serviço integrada com as prefeituras. Adequado para locadoras que emitem NFS-e por cada contrato.',
    eta: 'Roadmap 2026',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  },
  {
    name: 'Telemetria veicular',
    category: 'Rastreamento',
    desc: 'Integração com dispositivos GPS para atualização automática de quilometragem, rastreamento em tempo real e alertas de área.',
    eta: 'Roadmap 2027',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
  },
  {
    name: 'API pública WMove',
    category: 'Desenvolvedor',
    desc: 'API REST documentada para integração com sistemas próprios, ERPs, sites de reserva e apps mobile das locadoras.',
    eta: 'Roadmap 2026',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  },
  {
    name: 'Antifraude',
    category: 'Segurança',
    desc: 'Consulta automatizada de CPF, CNH e score de risco em bureaus de crédito no momento do cadastro do cliente.',
    eta: 'Roadmap 2026',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
]

export default function IntegracoesPage() {
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

      <div className="integracoes-page">
        <div className="integracoes-hero">
          <div className="termos-hero-badge">Integrações</div>
          <h1>Conecte a WMove ao seu ecossistema</h1>
          <p>A plataforma já vem integrada com os serviços essenciais para rodar sua locadora. Mais integrações chegam em breve.</p>
        </div>

        {/* Active */}
        <div className="integracoes-section">
          <div className="integracoes-section-header">
            <h2>Integrações ativas</h2>
            <span className="integracoes-count">{ACTIVE.length} disponíveis</span>
          </div>
          <div className="integracoes-grid">
            {ACTIVE.map(int => (
              <div key={int.name} className="integracoes-card">
                <div className="integracoes-card-top">
                  <div className="integracoes-icon" style={{ color: int.color, background: int.color + '18' }}>
                    {int.icon}
                  </div>
                  <span className="integracoes-status active">Ativo</span>
                </div>
                <div className="integracoes-name">{int.name}</div>
                <div className="integracoes-category">{int.category}</div>
                <p className="integracoes-desc">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="integracoes-section">
          <div className="integracoes-section-header">
            <h2>Em desenvolvimento</h2>
            <span className="integracoes-count">{COMING_SOON.length} planejadas</span>
          </div>
          <div className="integracoes-grid">
            {COMING_SOON.map(int => (
              <div key={int.name} className="integracoes-card coming">
                <div className="integracoes-card-top">
                  <div className="integracoes-icon coming">
                    {int.icon}
                  </div>
                  <span className="integracoes-status coming">{int.eta}</span>
                </div>
                <div className="integracoes-name">{int.name}</div>
                <div className="integracoes-category">{int.category}</div>
                <p className="integracoes-desc">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggest */}
        <div className="integracoes-suggest">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div>
            <h3>Precisa de uma integração específica?</h3>
            <p>Tem um sistema que você usa e gostaria de ver integrado com a WMove? Nos conte — priorizamos integrações com base na demanda dos clientes.</p>
          </div>
          <a href="mailto:produto@wmove.com.br?subject=Sugestão de integração" className="termos-cta-btn">
            Sugerir integração
          </a>
        </div>

        <footer className="sobre-footer" style={{ marginTop: 16 }}>
          <p>© 2026 WMove Tecnologia Ltda.</p>
          <div className="sobre-footer-links">
            <a href="/novidades">Novidades</a><span>·</span>
            <a href="/ajuda">Central de ajuda</a>
          </div>
        </footer>
      </div>
    </>
  )
}
