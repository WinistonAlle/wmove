import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import PricingSection from '../components/PricingSection'
import AddOnsSection from '../components/AddOnsSection'
import '../styles/landing.css'

const SLIDES = [
  {
    num: '01', label: 'Velocidade',
    title: <><>Adeus planilha,<br /></><span className="grad">oi WMove.</span></>,
    sub: 'A plataforma completa pra locadoras gerenciarem frota, contratos e clientes — sem perder o controle e sem se perder em abas de Excel.',
    cta: 'Testar 14 dias grátis',
    href: '/cadastro',
  },
  {
    num: '02', label: 'Módulos',
    title: <><>Expanda quando<br /></><span className="grad">precisar.</span></>,
    sub: 'Telemetria, oficina, NFS-e, chatbot, antifraude e muito mais. Adicione módulos especializados ao seu plano sem trocar de software.',
    cta: 'Ver módulos',
    href: '#addons',
  },
  {
    num: '03', label: 'Planos',
    title: <><>Planos que cabem<br /></><span className="grad">no seu bolso.</span></>,
    sub: 'De R$ 99/mês para locadoras iniciantes até frotas ilimitadas. Sem fidelidade, sem taxa de setup. 14 dias grátis pra testar tudo.',
    cta: 'Ver planos e preços',
    href: '#pricing',
  },
]


const FEATURES = [
  {
    title: 'Controle de frota',
    desc: 'Veja em tempo real quais carros estão disponíveis, alugados ou na oficina. Status, quilometragem e documentos sempre atualizados.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13h14l-1.4-4.2a2 2 0 0 0-1.9-1.3H8.3a2 2 0 0 0-1.9 1.3L5 13z"/><rect x="3.5" y="13" width="17" height="5" rx="1.2"/><circle cx="7.5" cy="18" r="1.4"/><circle cx="16.5" cy="18" r="1.4"/></svg>,
  },
  {
    title: 'Histórico de locações',
    desc: 'Cada contrato, devolução e renovação fica registrado. Auditoria completa por veículo, cliente ou período — tudo a um clique.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l3-4h12l3 4M3 7v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7M3 7h18"/><path d="M8 11h8M8 15h5"/></svg>,
  },
  {
    title: 'Gestão de clientes',
    desc: 'CNH, CPF, score, contratos e ocorrências em uma única ficha. Bloqueie inadimplentes e premie os recorrentes automaticamente.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3-6.5 7-6.5s7 2.9 7 6.5"/></svg>,
  },
  {
    title: 'Alertas de manutenção',
    desc: 'Revisões por km, troca de óleo, IPVA, licenciamento — o sistema avisa antes do problema chegar. Frota saudável, faturamento previsível.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.8L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/></svg>,
  },
  {
    title: 'Relatórios financeiros',
    desc: 'Receita, ticket médio, ocupação por carro e DRE mensal automático. Exporta pra Excel, integra com seu contador.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>,
  },
  {
    title: 'Reservas online 24/7',
    desc: 'Página de reservas com sua marca, integrada à frota. Cliente reserva pelo celular, você recebe direto na agenda.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  },
]

const STEPS = [
  { num: '01', title: 'Importe sua planilha', desc: 'Sobe seu Excel ou CSV com a frota e clientes. A gente mapeia tudo — nada se perde no caminho.' },
  { num: '02', title: 'Ajuste pra sua locadora', desc: 'Defina diárias, franquias, política de combustível e contratos modelo. Sua operação, do seu jeito.' },
  { num: '03', title: 'Decole', desc: 'Equipe operando, contratos assinados digitalmente, cliente recebendo a chave. Sem fricção, sem retrabalho.' },
]

const TESTIMONIALS = [
  {
    av: 'av-1', initials: 'MR', name: 'Mariana Rocha', role: 'Sócia',
    quote: '"Migramos 42 carros da planilha pro WMove em uma tarde. Hoje fecho o mês em 15 minutos — antes levava 3 dias. Sério, não tem volta."',
  },
  {
    av: 'av-2', initials: 'CB', name: 'Carlos Bittencourt', role: 'Diretor',
    quote: '"O alerta de manutenção paga o plano sozinho. Já evitei dois carros parados por revisão atrasada nesse trimestre. Sem o WMove eu não tinha visto."',
  },
  {
    av: 'av-3', initials: 'JA', name: 'Juliana Andrade', role: 'CEO',
    quote: '"Reservas online com a cara da minha empresa, contrato digital e recebimento via Pix. Triplicamos faturamento em 8 meses — sem contratar ninguém."',
  },
]

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 12 10 17 19 7"/>
  </svg>
)

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const [slide, setSlide] = useState(0)
  const timerRef = useRef(null)
  const total = SLIDES.length

  const goSlide = (i) => setSlide(((i % total) + total) % total)

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % total), 6000)
  }

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  // Nav: transparente sobre o hero, sólido ao sair dele
  useEffect(() => {
    const nav = document.getElementById('landingNav')
    const hero = document.getElementById('top')
    const handler = () => {
      const heroBottom = hero?.getBoundingClientRect().bottom ?? 0
      nav?.classList.toggle('scrolled', heroBottom <= 0)
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Cursor spotlight
  useEffect(() => {
    const spot = document.getElementById('cursorSpot')
    if (!spot || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2, cx = tx, cy = ty, active = false, rafId
    const onMove = (e) => { tx = e.clientX; ty = e.clientY; if (!active) { active = true; document.documentElement.classList.add('has-cursor') } }
    const onLeave = () => { active = false; document.documentElement.classList.remove('has-cursor') }
    const tick = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18
      spot.style.transform = `translate3d(${cx}px,${cy}px,0)`
      rafId = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    rafId = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseleave', onLeave); cancelAnimationFrame(rafId) }
  }, [])

  // Card shine on hover
  useEffect(() => {
    const handler = function(e) {
      const r = this.getBoundingClientRect()
      this.style.setProperty('--mx', (e.clientX - r.left) + 'px')
      this.style.setProperty('--my', (e.clientY - r.top) + 'px')
    }
    const cards = document.querySelectorAll('.spot')
    cards.forEach(c => c.addEventListener('mousemove', handler))
    return () => cards.forEach(c => c.removeEventListener('mousemove', handler))
  }, [])

  return (
    <>
      <div className="cursor-spot" id="cursorSpot" aria-hidden="true" />
      <div className="orbs">
        <div className="orb a1" />
        <div className="orb i1" />
        <div className="orb a2" />
        <div className="orb a3" />
      </div>
      <div className="grid-bg" />
      <div className="noise" />

      <div className="page">

        {/* ===== NAV ===== */}
        <nav className="nav-bar" id="landingNav">
          <div className="nav-inner">
            <a className="nav-brand" href="/">
              <img className="logo-dark" src="/assets/wmove-full-logo-dark.png" alt="WMove" />
              <img className="logo-light" src="/assets/wmove-full-logo.png" alt="WMove" />
            </a>

            <div className="nav-links">
              <a className="nav-link" href="#features">Funcionalidades</a>
              <a className="nav-link" href="#how">Como funciona</a>
              <a className="nav-link" href="#pricing">Planos</a>
              <a className="nav-link" href="#testimonials">Clientes</a>
            </div>

            <div className="nav-cta">
              <button className="lnd-icon-btn" onClick={toggleTheme} title="Alternar tema">
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                )}
              </button>
              <Link className="btn btn-ghost" to="/login">Entrar</Link>
              <Link className="btn btn-primary" to="/cadastro">Testar grátis</Link>
            </div>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section className="hero" id="top">
          <div className="hero-bgs" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`hero-bg hero-bg-${i}${slide === i ? ' active' : ''}`}
              />
            ))}
          </div>

          <button className="hero-arrow prev" onClick={() => { goSlide(slide - 1); resetTimer() }} aria-label="Slide anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="hero-arrow next" onClick={() => { goSlide(slide + 1); resetTimer() }} aria-label="Próximo slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className="container hero-inner" onMouseEnter={() => clearInterval(timerRef.current)} onMouseLeave={resetTimer}>
            {SLIDES.map((s, i) => (
              <div key={i} className={`hero-slide${slide === i ? ' active' : ''}`} data-slide={i}>
                <div className="hero-slidenum">
                  <span className="num">{s.num}</span>
                  <span className="bar" />
                  <span>{s.label}</span>
                </div>
                <h1 className="hero-title">{s.title}</h1>
                <p className="hero-sub">{s.sub}</p>
                <div className="hero-actions">
                  <a className="btn btn-primary btn-lg" href={s.href}>
                    <span>{s.cta}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* ===== FEATURES ===== */}
        <section className="features" id="features">
          <div className="container">
            <div className="sec-head reveal">
              <span className="eyebrow">Funcionalidades</span>
              <h2 className="sec-title">Tudo o que sua locadora precisa.<br />Em um só lugar.</h2>
              <p className="sec-sub">Da chave do carro ao balanço do mês — a WMove cobre cada etapa da sua operação, sem você precisar abrir 7 abas no navegador.</p>
            </div>

            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="feat-card reveal spot" style={{ '--rev-delay': i * 70 }}>
                  <div className="feat-icon">{f.icon}</div>
                  <h3 className="feat-title">{f.title}</h3>
                  <p className="feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="how" id="how">
          <div className="container">
            <div className="sec-head reveal">
              <span className="eyebrow">Como funciona</span>
              <h2 className="sec-title">Do Excel ao WMove em uma tarde.</h2>
              <p className="sec-sub">Sem migração complicada, sem treinamento de uma semana. Três passos pra sair voando.</p>
            </div>

            <div className="how-grid">
              {STEPS.map((s, i) => (
                <div key={s.num} className="step reveal spot" style={{ '--rev-delay': (i + 1) * 120 }}>
                  <div className="step-bignum">{s.num}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== ADD-ONS ===== */}
        <AddOnsSection />

        {/* ===== PRICING ===== */}
        <PricingSection />

        {/* ===== TESTIMONIALS ===== */}
        <section className="testimonials" id="testimonials">
          <div className="container">
            <div className="sec-head reveal">
              <span className="eyebrow">Quem usa, recomenda</span>
              <h2 className="sec-title">Locadoras que dormem em paz.</h2>
              <p className="sec-sub">Depois do WMove, ninguém volta pra planilha. Veja por quê.</p>
            </div>

            <div className="testi-grid">
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name} className="testi reveal spot" style={{ '--rev-delay': (i + 1) * 120 }}>
                  <div className="testi-stars">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <svg key={k} viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17 5.5 21 7 14 2 9.3 9 9 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <p className="testi-quote">{t.quote}</p>
                  <div className="testi-author">
                    <div className={`testi-av ${t.av}`}>{t.initials}</div>
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="cta-final" id="cta">
          <div className="container">
            <div className="cta-card reveal spot">
              <h2>Sua frota merece sair da planilha.</h2>
              <p>14 dias grátis, sem cartão de crédito, sem letras miúdas.</p>
              <div className="cta-actions">
                <Link className="btn btn-primary btn-lg" to="/cadastro">
                  <span>Começar grátis agora</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
                <a className="btn btn-ghost btn-lg" href="mailto:contato@wmove.com.br">Falar com vendas</a>
              </div>
              <div className="cta-mini">Configurado em 5 minutos · Suporte humano de verdade</div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer>
          <div className="container">
            <div className="foot-grid">
              <div className="foot-brand-info">
                <img className="logo-dark" src="/assets/wmove-full-logo-dark.png" alt="WMove" />
                <img className="logo-light" src="/assets/wmove-full-logo.png" alt="WMove" />
                <p className="foot-tag">A plataforma de gestão completa pra locadoras de veículos. Feita por quem já vendeu carro alugado, pra quem vende todo dia.</p>
                <div className="foot-social">
                  <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
                  <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8 18H5V9h3v9zm-1.5-10.3a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zM19 18h-3v-4.7c0-1.1-.4-1.9-1.4-1.9-.8 0-1.3.5-1.5 1.1-.1.2-.1.5-.1.7V18h-3V9h3v1.3c.4-.6 1.1-1.5 2.7-1.5 2 0 3.3 1.3 3.3 4V18z"/></svg></a>
                  <a href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
                </div>
              </div>

              <div className="foot-col">
                <h4>Produto</h4>
                <ul>
                  <li><a href="#features">Funcionalidades</a></li>
                  <li><a href="#pricing">Planos</a></li>
                </ul>
              </div>

              <div className="foot-col">
                <h4>Empresa</h4>
                <ul>
                  <li><a href="/sobre">Sobre nós</a></li>
                  <li><a href="mailto:contato@wmove.com.br">Contato</a></li>
                </ul>
              </div>

              <div className="foot-col">
                <h4>Recursos</h4>
                <ul>
                  <li><a href="/ajuda">Central de ajuda</a></li>
                  <li><a href="/migracao">Migração</a></li>
                </ul>
              </div>

              <div className="foot-col">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/termos">Termos de uso</a></li>
                  <li><a href="/privacidade">Privacidade</a></li>
                  <li><a href="/privacidade#lgpd">LGPD</a></li>
                  <li><a href="/privacidade#seguranca">Segurança</a></li>
                </ul>
              </div>
            </div>

            <div className="foot-bottom">
              <div>© 2026 WMove Tecnologia. Todos os direitos reservados.</div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
