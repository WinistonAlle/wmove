import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/sobre.css'

const VALUES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Feito por quem entende',
    desc: 'A WMove nasceu de uma dor real — um amigo com dificuldade de gerir sua frota. Não construímos software por construir; resolvemos um problema que conhecemos de perto.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: 'Confiança acima de tudo',
    desc: 'Dados de clientes, veículos e contratos são o ativo mais valioso de uma locadora. Tratamos essa responsabilidade com rigidez: segurança, disponibilidade e privacidade não são negociáveis.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    title: 'Simples de usar',
    desc: 'Um locador de veículos não deveria precisar de treinamento para gerenciar sua operação. Cada feature da WMove é pensada para ser óbvia, rápida e eficiente — sem manual.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    title: 'Crescer junto',
    desc: 'Começamos com locadoras pequenas porque elas têm as mesmas necessidades das grandes — e menos recursos para resolvê-las. Nossos planos crescem conforme a sua frota cresce.',
  },
]

const TEAM = [
  {
    name: 'Winiston Alle',
    role: 'Co-fundador & CTO',
    desc: 'Responsável pela arquitetura técnica da plataforma. Garante que a WMove seja rápida, segura e escalável para locadoras de todos os tamanhos.',
    initials: 'WA',
    color: '#F59E0B',
  },
  {
    name: 'Mateus Borges',
    role: 'Co-fundador & CEO',
    desc: 'Visionário por trás da WMove. Combina visão de produto com profundo entendimento das dores operacionais de quem gerencia frotas no dia a dia.',
    initials: 'MB',
    color: '#6366F1',
  },
]

export default function SobrePage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <div className="orbs">
        <div className="orb amber" style={{ opacity: 0.18 }} />
        <div className="orb indigo" style={{ opacity: 0.1 }} />
        <div className="orb amber2" style={{ opacity: 0.12 }} />
      </div>
      <div className="noise" />

      {/* Topbar */}
      <header className="termos-topbar">
        <Link to="/" className="termos-brand">
          <img src="/assets/wmove-logo.png" alt="WMove" className="termos-logo" />
          <span>WMove</span>
        </Link>
        <div className="termos-topbar-right">
          <Link to="/login" className="sobre-login-btn">Entrar</Link>
          <Link to="/cadastro" className="termos-cta-btn">Criar conta grátis</Link>
          <button className="icon-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark'
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            }
          </button>
        </div>
      </header>

      <div className="sobre-page">

        {/* Hero */}
        <section className="sobre-hero">
          <div className="sobre-hero-badge">Nossa história</div>
          <h1 className="sobre-hero-title">
            Construímos a WMove<br />
            <span className="sobre-grad">para resolver um problema real.</span>
          </h1>
          <p className="sobre-hero-sub">
            Tudo começou quando um amigo nosso, dono de uma pequena locadora em Brasília, nos mostrou o caos do seu dia a dia: planilhas fragmentadas, contratos no papel, clientes sem histórico e nenhuma visibilidade sobre a frota. A gente olhou e pensou: <em>isso tem que ter solução melhor.</em>
          </p>
        </section>

        {/* Story */}
        <section className="sobre-story">
          <div className="sobre-story-content">
            <div className="sobre-story-text">
              <h2>A origem</h2>
              <p>
                Em 2026, <strong>Winiston Alle</strong> e <strong>Mateus Borges</strong> se juntaram para construir o que seria a primeira plataforma de gestão de locadoras pensada de verdade para o mercado brasileiro — com foco na operação real de quem aluga carro todo dia.
              </p>
              <p>
                A WMove não nasceu de um laboratório de inovação ou de um MBA. Nasceu da frustração de ver um negócio real perdendo tempo, dinheiro e clientes por falta de uma ferramenta adequada.
              </p>
              <p>
                Nossa missão é simples: <strong>dar ao dono de locadora o controle que ele merece</strong> — sem complexidade desnecessária, sem planilha, sem papel.
              </p>
            </div>
            <div className="sobre-story-card">
              <div className="sobre-quote-mark">"</div>
              <blockquote>
                A gente viu um amigo gerenciando uma frota de 15 carros com 4 planilhas diferentes. Naquele dia decidimos que ia mudar.
              </blockquote>
              <div className="sobre-quote-author">
                <div className="sobre-quote-avatar" style={{ background: '#F59E0B' }}>WA</div>
                <div>
                  <div className="sobre-quote-name">Winiston Alle</div>
                  <div className="sobre-quote-role">Co-fundador & CTO</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="sobre-mission">
          <div className="sobre-mission-inner">
            <div className="sobre-mission-item">
              <div className="sobre-mission-label">Missão</div>
              <p>Digitalizar e simplificar a gestão de locadoras de veículos no Brasil, tornando o controle operacional e financeiro acessível para frotas de qualquer tamanho.</p>
            </div>
            <div className="sobre-mission-divider" />
            <div className="sobre-mission-item">
              <div className="sobre-mission-label">Visão</div>
              <p>Ser a plataforma de referência para locadoras independentes no Brasil — reconhecida pela facilidade de uso, confiabilidade e pelo impacto direto na rentabilidade dos clientes.</p>
            </div>
            <div className="sobre-mission-divider" />
            <div className="sobre-mission-item">
              <div className="sobre-mission-label">Sede</div>
              <p>Brasília, Distrito Federal — Brasil. Operação 100% digital, atendendo locadoras em todo o país.</p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="sobre-values">
          <div className="sobre-section-header">
            <h2>O que acreditamos</h2>
            <p>Os princípios que guiam cada decisão de produto e de negócio.</p>
          </div>
          <div className="sobre-values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="sobre-value-card">
                <div className="sobre-value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="sobre-team">
          <div className="sobre-section-header">
            <h2>Os fundadores</h2>
            <p>As pessoas por trás da WMove.</p>
          </div>
          <div className="sobre-team-grid">
            {TEAM.map(m => (
              <div key={m.name} className="sobre-team-card">
                <div className="sobre-team-avatar" style={{ background: m.color + '22', color: m.color, border: `1.5px solid ${m.color}40` }}>
                  {m.initials}
                </div>
                <div className="sobre-team-info">
                  <div className="sobre-team-name">{m.name}</div>
                  <div className="sobre-team-role">{m.role}</div>
                  <p className="sobre-team-desc">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="sobre-cta">
          <div className="sobre-cta-inner">
            <h2>Pronto para transformar sua locadora?</h2>
            <p>14 dias grátis, sem cartão de crédito. Comece hoje.</p>
            <div className="sobre-cta-btns">
              <Link to="/cadastro" className="sobre-cta-primary">Criar conta grátis</Link>
              <a href="mailto:contato@wmove.com.br" className="sobre-cta-secondary">Falar com a equipe</a>
            </div>
          </div>
        </section>

        <footer className="sobre-footer">
          <p>© 2026 WMove Tecnologia Ltda. · Brasília, DF</p>
          <div className="sobre-footer-links">
            <a href="/termos">Termos de uso</a>
            <span>·</span>
            <a href="/privacidade">Privacidade</a>
            <span>·</span>
            <a href="mailto:contato@wmove.com.br">Contato</a>
          </div>
        </footer>

      </div>
    </>
  )
}
