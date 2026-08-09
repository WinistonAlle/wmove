import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'
import '../styles/migracao.css'

const STEPS = [
  {
    num: '01',
    title: 'Crie sua conta e explore',
    desc: 'Comece pelo trial gratuito de 14 dias. Sem cartão, sem compromisso. Use esse período para explorar os módulos e montar a estrutura da sua locadora na plataforma.',
    tip: 'Deixe para inserir os dados reais depois. Primeiro entenda como a plataforma funciona.',
  },
  {
    num: '02',
    title: 'Configure os dados da empresa',
    desc: 'Acesse Configurações → Empresa e preencha os dados da locadora: nome, CNPJ, telefone e endereço. Essas informações aparecem nos contratos gerados automaticamente.',
    tip: 'Confira que o endereço e CNPJ estão corretos — eles são usados nos documentos legais.',
  },
  {
    num: '03',
    title: 'Cadastre sua frota',
    desc: 'No módulo Frota, cadastre seus veículos um a um ou peça ao suporte para importação em lote via planilha CSV. Informe placa, marca, modelo, ano, combustível e diária padrão.',
    tip: 'Importação em lote disponível para planos WPlus ou superior. Entre em contato com o suporte.',
  },
  {
    num: '04',
    title: 'Importe seus clientes',
    desc: 'Cadastre sua base de clientes no módulo Clientes. Para migrações de volume, o suporte pode auxiliar na importação a partir de planilhas com os campos: nome, CPF, telefone, e-mail, CNH e data de validade.',
    tip: 'Aproveite para limpar a base: remova duplicatas e atualize telefones e e-mails desatualizados.',
  },
  {
    num: '05',
    title: 'Registre histórico de aluguéis ativos',
    desc: 'Crie os aluguéis que ainda estão em andamento na data da migração. Aluguéis históricos (encerrados) podem ser registrados gradualmente conforme necessário para relatórios.',
    tip: 'Foque nos contratos ativos primeiro — eles impactam diretamente a operação do dia a dia.',
  },
  {
    num: '06',
    title: 'Configure notificações',
    desc: 'Acesse o módulo Notificações para verificar alertas de seguros vencendo, CNHs próximas do vencimento e manutenções atrasadas. O sistema identifica automaticamente baseado nos dados cadastrados.',
    tip: 'Quanto mais completos os dados de veículos e clientes, mais precisas serão as notificações.',
  },
]

const FROM_SYSTEMS = [
  {
    name: 'Planilhas (Excel / Google Sheets)',
    difficulty: 'Fácil',
    diffColor: '#10B981',
    desc: 'A migração mais comum. Exportamos um modelo de planilha compatível com os campos da WMove. Você preenche e o suporte faz a importação.',
  },
  {
    name: 'Sistemas de gestão anteriores',
    difficulty: 'Médio',
    diffColor: '#F59E0B',
    desc: 'Depende das opções de exportação do sistema antigo. Se ele exporta em CSV ou Excel, o processo é similar à migração de planilhas.',
  },
  {
    name: 'Papel / caderno',
    difficulty: 'Manual',
    diffColor: '#6366F1',
    desc: 'Requer digitação manual dos dados. Nosso suporte pode orientar qual a ordem ideal de cadastro para minimizar o esforço.',
  },
]

export default function MigracaoPage() {
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

      <div className="migracao-page">
        {/* Hero */}
        <div className="migracao-hero">
          <div className="termos-hero-badge">Migração</div>
          <h1>Traga sua locadora para a WMove</h1>
          <p>Sair de planilhas ou de outro sistema é mais simples do que parece. Em poucos passos sua operação estará rodando na WMove — sem perder dados e sem interromper o negócio.</p>
        </div>

        {/* From systems */}
        <div className="migracao-from">
          <h2>De onde você está vindo?</h2>
          <div className="migracao-from-grid">
            {FROM_SYSTEMS.map(s => (
              <div key={s.name} className="migracao-from-card">
                <div className="migracao-from-top">
                  <span className="migracao-from-name">{s.name}</span>
                  <span className="migracao-diff" style={{ color: s.diffColor, background: s.diffColor + '18' }}>
                    {s.difficulty}
                  </span>
                </div>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="migracao-steps">
          <h2>Passo a passo da migração</h2>
          {STEPS.map((step, i) => (
            <div key={i} className="migracao-step">
              <div className="migracao-step-num">{step.num}</div>
              <div className="migracao-step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <div className="migracao-tip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{step.tip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="migracao-cta">
          <div className="migracao-cta-left">
            <h2>Precisa de ajuda com a migração?</h2>
            <p>Nossa equipe oferece suporte dedicado para migração. Entre em contato e combinamos como podemos ajudar.</p>
            <div className="migracao-cta-btns">
              <Link to="/cadastro" className="sobre-cta-primary">Começar trial grátis</Link>
              <a href="mailto:suporte@wmove.com.br?subject=Ajuda com migração" className="sobre-cta-secondary">Falar com suporte</a>
            </div>
          </div>
          <div className="migracao-cta-card">
            <div className="migracao-cta-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Importação de planilhas sem custo extra</span>
            </div>
            <div className="migracao-cta-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Suporte por e-mail durante o processo</span>
            </div>
            <div className="migracao-cta-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Seus dados anteriores permanecem intactos</span>
            </div>
            <div className="migracao-cta-card-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>14 dias de trial para testar antes de migrar</span>
            </div>
          </div>
        </div>

        <footer className="sobre-footer" style={{ marginTop: 16 }}>
          <p>© 2026 WMove Tecnologia Ltda.</p>
          <div className="sobre-footer-links">
            <a href="/ajuda">Central de ajuda</a><span>·</span>
            <a href="mailto:suporte@wmove.com.br">Suporte</a>
          </div>
        </footer>
      </div>
    </>
  )
}
