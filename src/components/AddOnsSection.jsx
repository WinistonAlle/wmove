import { useState, useEffect, useRef } from 'react'
import { MapPin, Package2, FileText, Wrench, Heart, Repeat, Sparkles, ShieldCheck, MessageCircle, Gift, Check, X } from 'lucide-react'

const ADDONS = [
  {
    icon: MapPin,
    name: 'Telemetria GPS',
    desc: 'Rastreamento em tempo real, geofencing e bloqueio remoto',
    price: 'R$ 19/veículo',
    detail: 'Saiba exatamente onde cada veículo está, a qualquer hora. Bloqueie remotamente em caso de inadimplência ou suspeita de roubo e receba alertas automáticos quando um carro sair da área permitida.',
    features: [
      'Rastreamento em tempo real via app e painel web',
      'Geofencing com alertas de saída de área',
      'Bloqueio remoto do veículo pelo sistema',
      'Histórico completo de rotas e trajetos',
      'Relatório de km rodados por locação',
    ],
    ideal: 'Locadoras com frota média ou grande que precisam de segurança e controle operacional.',
  },
  {
    icon: Package2,
    name: 'Acessórios e estoque',
    desc: 'Controle de cadeirinhas, GPS e outros itens locáveis',
    price: 'R$ 39/mês',
    detail: 'Gerencie cadeirinhas, GPS portáteis, suportes e qualquer outro item que vai junto com o veículo. O sistema controla disponibilidade, cobrança e devolução automaticamente.',
    features: [
      'Cadastro de itens locáveis com foto e descrição',
      'Controle de disponibilidade por item e por período',
      'Cobrança automática adicionada à locação',
      'Alertas de devolução pendente de acessórios',
      'Relatório de utilização e receita por item',
    ],
    ideal: 'Locadoras que alugam itens além do veículo e querem evitar perdas e esquecimentos.',
  },
  {
    icon: FileText,
    name: 'Emissão NFS-e',
    desc: 'Notas fiscais geradas automaticamente a cada locação',
    price: 'R$ 49/mês',
    detail: 'Emita notas fiscais de serviço automaticamente ao fechar cada locação. Integração direta com as prefeituras de todo o Brasil, sem precisar acessar outro sistema.',
    features: [
      'Emissão automática ao encerrar a locação',
      'Integração com prefeituras de todo o Brasil',
      'Cancelamento e substituição de notas no sistema',
      'Relatório fiscal mensal exportável em PDF e CSV',
      'Suporte a múltiplos CNPJs e filiais',
    ],
    ideal: 'Locadoras que atendem empresas e precisam emitir nota fiscal de serviço.',
  },
  {
    icon: Wrench,
    name: 'Módulo oficina',
    desc: 'Ordens de serviço e histórico de manutenção por veículo',
    price: 'R$ 79/mês',
    featured: true,
    badge: 'Diferencial WMove',
    detail: 'Registre todas as manutenções, preventivas e corretivas, diretamente no sistema. Saiba o custo real de cada veículo da frota e nunca perca uma revisão por descuido.',
    features: [
      'Ordens de serviço com histórico por veículo',
      'Preventivas automáticas por km ou intervalo de tempo',
      'Cadastro de fornecedores e peças com custo',
      'Custo total de manutenção por veículo e por período',
      'Alertas de revisão pendente integrados ao painel',
    ],
    ideal: 'Locadoras com oficina própria ou que terceirizam e querem controlar o custo de manutenção.',
  },
  {
    icon: Heart,
    name: 'CRM e fidelização',
    desc: 'Programa de pontos, campanhas e recuperação de clientes',
    price: 'R$ 89/mês',
    detail: 'Transforme clientes esporádicos em locadores frequentes com um programa de fidelidade configurável. Segmente sua base e envie campanhas no momento certo para trazer quem sumiu.',
    features: [
      'Programa de pontos configurável por tipo de locação',
      'Campanhas de e-mail e SMS segmentadas',
      'Recuperação automática de clientes inativos',
      'Segmentação por perfil, frequência e valor gasto',
      'Painel de métricas de retenção e engajamento',
    ],
    ideal: 'Locadoras que querem aumentar a recorrência e o ticket médio da base de clientes.',
  },
  {
    icon: Repeat,
    name: 'Carro por assinatura',
    desc: 'Gestão de planos mensais recorrentes com troca de veículo',
    price: 'R$ 99/mês',
    detail: 'Ofereça planos mensais com troca de veículo e construa uma receita previsível e recorrente. O assinante gerencia tudo pelo portal próprio, com menos demanda para o seu time.',
    features: [
      'Planos mensais com troca de veículo configurável',
      'Cobrança recorrente automática via Pix ou cartão',
      'Portal do assinante com self-service completo',
      'Controle de km incluídos e excedentes por plano',
      'Relatório de receita recorrente mensal (MRR)',
    ],
    ideal: 'Locadoras que querem diversificar o modelo de negócio com receita previsível.',
  },
  {
    icon: Sparkles,
    name: 'Precificação dinâmica IA',
    desc: 'Ajuste automático de preços por demanda, feriado e temporada',
    price: 'R$ 99/mês',
    detail: 'Pare de perder dinheiro em datas de alta demanda e de afastar clientes com preços altos na baixa temporada. A IA ajusta seus preços automaticamente com base na ocupação e no calendário.',
    features: [
      'Ajuste automático por taxa de ocupação da frota',
      'Calendário inteligente de feriados e eventos locais',
      'Regras personalizáveis por categoria de veículo',
      'Preço mínimo e máximo definidos por você',
      'Relatório de ganho incremental gerado pela IA',
    ],
    ideal: 'Locadoras com variação sazonal que querem maximizar a receita por veículo disponível.',
  },
  {
    icon: ShieldCheck,
    name: 'Compliance e antifraude',
    desc: 'Validação biométrica de CNH e consulta automática Serasa',
    price: 'R$ 129/mês',
    detail: 'Reduza calotes e golpes validando o cliente antes de entregar as chaves. A consulta acontece automaticamente no momento do cadastro, sem interromper o fluxo da locação.',
    features: [
      'Validação biométrica de CNH por foto',
      'Consulta automática Serasa/SPC no cadastro',
      'Score de risco calculado por perfil de cliente',
      'Bloqueio automático de CPFs com restrição',
      'Histórico de consultas e decisões por locação',
    ],
    ideal: 'Locadoras com alto volume de locações ou histórico de inadimplência e fraudes.',
  },
  {
    icon: MessageCircle,
    name: 'Chatbot WhatsApp',
    desc: 'Reservas automáticas pelo WhatsApp 24h sem atendente',
    price: 'R$ 149/mês',
    detail: 'Seu cliente reserva um carro às 23h pelo WhatsApp sem precisar de atendente. O chatbot consulta disponibilidade, apresenta opções, coleta dados e envia o contrato para assinar.',
    features: [
      'Reservas 24h sem necessidade de atendente',
      'Consulta de disponibilidade e preços em tempo real',
      'Envio automático de contratos para assinatura',
      'Integração total com o catálogo e agenda do WMove',
      'Transferência para atendente humano quando necessário',
    ],
    ideal: 'Locadoras que recebem muitas consultas fora do horário comercial e querem converter mais.',
  },
]

// Módulo oficina (índice 3) aparece nas duas linhas por ser o diferencial
const oficina = ADDONS[3]
const ROW1 = ADDONS.slice(0, 5)                          // módulos 1–5
const ROW2 = [oficina, ...ADDONS.slice(5)]               // oficina + módulos 6–9

function MarqueeCard({ icon: Icon, name, desc, price, featured, badge, onClick }) {
  return (
    <button className={`marquee-card${featured ? ' marquee-card--featured' : ''}`} onClick={onClick}>
      {badge && <span className="marquee-badge">{badge}</span>}
      <div className="marquee-icon">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <div className="marquee-text">
        <p className="marquee-name">{name}</p>
        <p className="marquee-desc">{desc}</p>
      </div>
      <span className="marquee-price">{price}</span>
    </button>
  )
}

export default function AddOnsSection() {
  const [selected, setSelected] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const track1Ref = useRef(null)
  const track2Ref = useRef(null)

  const pauseTracks = () => {
    if (track1Ref.current) track1Ref.current.style.animationPlayState = 'paused'
    if (track2Ref.current) track2Ref.current.style.animationPlayState = 'paused'
  }
  const resumeTracks = () => {
    if (track1Ref.current) track1Ref.current.style.animationPlayState = 'running'
    if (track2Ref.current) track2Ref.current.style.animationPlayState = 'running'
  }

  const anyOpen = selected !== null || showAll

  useEffect(() => {
    if (!anyOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') { setSelected(null); setShowAll(false) }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [anyOpen])

  const addon = selected !== null ? ADDONS[selected] : null

  return (
    <>
      <section className="addons-section" id="addons">

        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Módulos Add-on</span>
            <h2 className="sec-title">Comece simples, expanda quando precisar</h2>
            <p className="sec-sub">
              Adicione módulos especializados ao seu plano sem trocar de software. Clique em qualquer módulo para saber mais.
            </p>
          </div>
        </div>

        {/* Row 1 — módulos 1–5, scrolls left */}
        <div className="marquee-wrap" onMouseEnter={pauseTracks} onMouseLeave={resumeTracks}>
          <div className="marquee-track marquee-track--left" ref={track1Ref}>
            {[...ROW1, ...ROW1].map((addon, i) => (
              <MarqueeCard
                key={`r1-${i}`}
                {...addon}
                onClick={() => setSelected(i % ROW1.length)}
              />
            ))}
          </div>
        </div>

        {/* Row 2 — oficina + módulos 6–9, scrolls right */}
        <div className="marquee-wrap" style={{ marginTop: '12px' }} onMouseEnter={pauseTracks} onMouseLeave={resumeTracks}>
          <div className="marquee-track marquee-track--right" ref={track2Ref}>
            {[...ROW2, ...ROW2].map((addon, i) => {
              const idx = ADDONS.findIndex(a => a.name === addon.name)
              return (
                <MarqueeCard
                  key={`r2-${i}`}
                  {...addon}
                  onClick={() => setSelected(idx)}
                />
              )
            })}
          </div>
        </div>

        <div className="container">
          <div className="addons-footer reveal">
            <div className="addmod-promo">
              <Gift size={15} strokeWidth={2} />
              <span>Contratou 3 ou mais módulos? Ganhe <strong>15% de desconto</strong> no total dos add-ons.</span>
            </div>
            <button className="btn btn-ghost btn-see-all" onClick={() => setShowAll(true)}>
              Ver todos os módulos
            </button>
          </div>
        </div>

      </section>

      {/* Modal — todos os módulos */}
      {showAll && (
        <div className="addmod-overlay" onClick={() => setShowAll(false)}>
          <div className="addmod-all-modal" onClick={e => e.stopPropagation()}>

            <div className="addmod-all-header">
              <div>
                <p className="addmod-modal-eyebrow">Módulos Add-on</p>
                <h3 className="addmod-modal-name">Todos os módulos</h3>
              </div>
              <button className="addmod-modal-close" style={{ position: 'static' }} onClick={() => setShowAll(false)} aria-label="Fechar">
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="addmod-all-grid">
              {ADDONS.map((a, i) => (
                <div key={a.name} className={`addmod-all-card${a.featured ? ' addmod-all-card--featured' : ''}`}>
                  <div className="addmod-all-card-header">
                    <div className="addmod-modal-icon" style={{ width: 40, height: 40, borderRadius: 11 }}>
                      <a.icon size={18} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="addmod-modal-eyebrow" style={{ marginBottom: 1 }}>
                        {a.featured ? '★ Diferencial WMove' : 'Add-on'}
                      </p>
                      <p className="addmod-modal-name" style={{ fontSize: 16 }}>{a.name}</p>
                    </div>
                    <span className="addmod-modal-price">{a.price}</span>
                  </div>
                  <p className="addmod-modal-desc" style={{ fontSize: 13, margin: '12px 0' }}>{a.detail}</p>
                  <ul className="addmod-modal-features" style={{ margin: 0 }}>
                    {a.features.map(f => (
                      <li key={f}>
                        <Check size={12} strokeWidth={2.5} />
                        <span style={{ fontSize: 12.5 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="addmod-all-footer">
              <div className="addmod-promo" style={{ margin: 0 }}>
                <Gift size={14} strokeWidth={2} />
                <span>Contratou 3 ou mais módulos? Ganhe <strong>15% de desconto</strong> no total.</span>
              </div>
              <a className="btn btn-primary" href="#cta">Falar com vendas</a>
            </div>

          </div>
        </div>
      )}

      {/* Modal — detalhe individual */}
      {addon && (
        <div className="addmod-overlay" onClick={() => setSelected(null)}>
          <div className="addmod-modal" onClick={(e) => e.stopPropagation()}>

            <button className="addmod-modal-close" onClick={() => setSelected(null)} aria-label="Fechar">
              <X size={16} strokeWidth={2} />
            </button>

            <div className="addmod-modal-header">
              <div className="addmod-modal-icon">
                <addon.icon size={24} strokeWidth={1.8} />
              </div>
              <div>
                <p className="addmod-modal-eyebrow">Módulo add-on</p>
                <h3 className="addmod-modal-name">{addon.name}</h3>
              </div>
              <span className="addmod-modal-price">{addon.price}</span>
            </div>

            <p className="addmod-modal-desc">{addon.detail}</p>

            <div className="addmod-modal-features">
              <p className="addmod-modal-feat-label">O que está incluso</p>
              <ul>
                {addon.features.map((f) => (
                  <li key={f}>
                    <Check size={14} strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="addmod-modal-footer">
              <p className="addmod-modal-ideal">
                <strong>Ideal para:</strong> {addon.ideal}
              </p>
              <a className="btn btn-primary" href="#cta">Falar com vendas</a>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
