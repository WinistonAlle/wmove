import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

const PLANS = [
  {
    id: 'wgo',
    name: 'WGo',
    subtitle: 'Locadora iniciante',
    fleet: 'Até 10 veículos',
    price: 89,
    featured: false,
    buttonLabel: 'Começar grátis',
    buttonStyle: 'ghost',
    features: [
      'Gestão de frota',
      'Controle de aluguéis',
      'Cadastro de clientes',
      'Financeiro básico',
      '2 usuários',
      'Suporte por email',
    ],
  },
  {
    id: 'wplus',
    name: 'WPlus',
    subtitle: 'Locadora estabelecida',
    fleet: 'Até 30 veículos',
    price: 209,
    featured: true,
    buttonLabel: 'Escolher WPlus',
    buttonStyle: 'primary',
    features: [
      'Tudo do WGo',
      'Portal do cliente',
      'Contratos digitais',
      'App de vistoria',
      '5 usuários',
      'Suporte WhatsApp',
    ],
  },
  {
    id: 'wpro',
    name: 'WPro',
    subtitle: 'Locadora consolidada',
    fleet: 'Até 80 veículos',
    price: 419,
    featured: false,
    buttonLabel: 'Escolher WPro',
    buttonStyle: 'ghost',
    features: [
      'Tudo do WPlus',
      'Vistoria com IA',
      'Relatórios avançados',
      'Multas e sinistros',
      '15 usuários',
      'Suporte prioritário',
    ],
  },
  {
    id: 'wmax',
    name: 'WMax',
    subtitle: 'Redes e grandes frotas',
    fleet: 'Frota ilimitada',
    price: 849,
    custom: true,
    featured: false,
    buttonLabel: 'Falar com vendas',
    buttonStyle: 'ghost',
    features: [
      'Tudo do WPro',
      'Multi-filial',
      'API e webhooks',
      'BI executivo',
      'Usuários ilimitados',
      'Customer Success dedicado',
    ],
  },
]


export default function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const navigate = useNavigate()

  function discounted(price) {
    return Math.round(price * 0.8)
  }

  function handlePlanClick(plan) {
    if (plan.id === 'wmax') {
      window.location.href = 'mailto:vendas@wmove.com.br?subject=Interesse no plano WMax'
      return
    }
    navigate(`/cadastro?plan=${plan.id}&billing=${annual ? 'annual' : 'monthly'}`)
  }

  return (
    <section className="pricing" id="pricing">
      <div className="container">

        {/* Header */}
        <div className="sec-head reveal">
          <span className="eyebrow">Planos</span>
          <h2 className="sec-title">Planos que crescem com sua locadora</h2>
          <p className="sec-sub">Sem fidelidade. Sem letras miúdas. 14 dias grátis.</p>
        </div>

        {/* Toggle */}
        <div className="price-billing-toggle reveal">
          <div className="price-toggle-pill">
            <button
              className={`toggle-opt${!annual ? ' active' : ''}`}
              onClick={() => setAnnual(false)}
            >
              Mensal
            </button>
            <button
              className={`toggle-opt${annual ? ' active' : ''}`}
              onClick={() => setAnnual(true)}
            >
              Anual
              <span className="price-off-badge">20% off</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="price-grid price-grid-4">
          {PLANS.map((plan, i) => {
            const finalPrice = annual ? discounted(plan.price) : plan.price

            return (
              <div
                key={plan.id}
                className={`price-card spot reveal${plan.featured ? ' featured' : ''}`}
                style={{ '--rev-delay': i * 60 }}
              >
                {plan.featured && (
                  <span className="price-badge">Mais popular</span>
                )}

                <p className="price-name">{plan.name}</p>
                <p className="price-tagline">{plan.subtitle}</p>

                <div className="price-amount">
                  <span className="currency">R$</span>
                  <span className="value num">
                    {plan.custom ? `${finalPrice}+` : finalPrice}
                  </span>
                  <span className="per">/mês</span>
                </div>

                {annual && (
                  <p className="price-note">
                    <span className="price-original">
                      R$ {plan.custom ? `${plan.price}+` : plan.price}/mês
                    </span>
                    <span className="price-off-tag">20% off</span>
                  </p>
                )}
                {!annual && <p className="price-note">&nbsp;</p>}

                <p className="price-fleet">{plan.fleet}</p>

                <ul className="price-features">
                  {plan.features.map((feat) => (
                    <li key={feat}>
                      <Check strokeWidth={2.5} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn btn-lg price-cta${plan.buttonStyle === 'primary' ? ' btn-primary' : ' btn-ghost'}`}
                  onClick={() => handlePlanClick(plan)}
                >
                  {plan.buttonLabel}
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
