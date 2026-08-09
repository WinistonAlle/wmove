import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import DashboardLayout from '../components/DashboardLayout'
import '../styles/billing.css'

// Price IDs from Stripe — configure em .env
// VITE_STRIPE_PRICE_WGO_MONTHLY, VITE_STRIPE_PRICE_WGO_ANNUAL, etc.
const PRICE_IDS = {
  wgo:   { monthly: import.meta.env.VITE_STRIPE_PRICE_WGO_MONTHLY,   annual: import.meta.env.VITE_STRIPE_PRICE_WGO_ANNUAL   },
  wplus: { monthly: import.meta.env.VITE_STRIPE_PRICE_WPLUS_MONTHLY, annual: import.meta.env.VITE_STRIPE_PRICE_WPLUS_ANNUAL },
  wpro:  { monthly: import.meta.env.VITE_STRIPE_PRICE_WPRO_MONTHLY,  annual: import.meta.env.VITE_STRIPE_PRICE_WPRO_ANNUAL  },
  wmax:  { monthly: import.meta.env.VITE_STRIPE_PRICE_WMAX_MONTHLY,  annual: import.meta.env.VITE_STRIPE_PRICE_WMAX_ANNUAL  },
}

const PLANS = [
  {
    id: 'wgo',
    name: 'WGo',
    price: 89,
    limit: 10,
    features: ['Até 10 veículos', 'CRUD completo', 'Relatórios básicos', 'Suporte por e-mail'],
  },
  {
    id: 'wplus',
    name: 'WPlus',
    price: 209,
    limit: 30,
    highlight: true,
    features: ['Até 30 veículos', 'Tudo do WGo', 'Exportação PDF/Excel', 'Notificações em tempo real', 'Suporte prioritário'],
  },
  {
    id: 'wpro',
    name: 'WPro',
    price: 419,
    limit: 80,
    features: ['Até 80 veículos', 'Tudo do WPlus', 'Relatórios avançados', 'Múltiplos usuários', 'API de integração'],
  },
  {
    id: 'wmax',
    name: 'WMax',
    price: 849,
    limit: Infinity,
    features: ['Frota ilimitada', 'Tudo do WPro', 'SLA garantido', 'Gerente de conta dedicado', 'Onboarding personalizado'],
  },
]

const PLAN_LABEL = { wgo: 'WGo', wplus: 'WPlus', wpro: 'WPro', wmax: 'WMax', trial: 'Trial' }

function formatMoney(v) {
  return `R$ ${v.toLocaleString('pt-BR')}`
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

async function callFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erro ${res.status}`)
  }
  return res.json()
}

export default function BillingPage() {
  const { userData, refresh } = useUser()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicleCount, setVehicleCount] = useState(null)
  const [annual, setAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const company = userData?.company
  const currentPlanId = company?.plan ?? 'trial'
  const subscriptionStatus = company?.subscription_status ?? 'trialing'
  const hasActiveSubscription = company?.stripe_subscription_id && subscriptionStatus !== 'canceled'
  const trialEnds = company?.trial_ends_at ? new Date(company.trial_ends_at) : null
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - new Date()) / 86400000)) : 0

  useEffect(() => {
    supabase.from('vehicles').select('id', { count: 'exact', head: true })
      .then(({ count }) => setVehicleCount(count ?? 0))
  }, [])

  // Handle Stripe redirect callbacks
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      toast('Plano ativado com sucesso!')
      refresh()
      setSearchParams({})
    } else if (searchParams.get('canceled') === '1') {
      toast('Pagamento cancelado.', 'info')
      setSearchParams({})
    }
  }, [searchParams])

  async function handleSelectPlan(planId) {
    const priceId = PRICE_IDS[planId]?.[annual ? 'annual' : 'monthly']
    if (!priceId) {
      toast('Configure os Price IDs do Stripe no .env para continuar.', 'error')
      return
    }
    setLoadingPlan(planId)
    try {
      const { url } = await callFunction('stripe-checkout', {
        price_id:   priceId,
        return_url: `${window.location.origin}/billing`,
      })
      window.location.href = url
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoadingPlan(null)
    }
  }

  async function handleManageBilling() {
    setLoadingPortal(true)
    try {
      const { url } = await callFunction('stripe-portal', {
        return_url: `${window.location.origin}/billing`,
      })
      window.location.href = url
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoadingPortal(false)
    }
  }

  const currentPlan = PLANS.find(p => p.id === currentPlanId)

  const usagePct = currentPlan && vehicleCount !== null && currentPlan.limit !== Infinity
    ? Math.min(100, Math.round((vehicleCount / currentPlan.limit) * 100))
    : null

  const topbarLeft = (
    <div className="greet">
      <h1>Plano & Cobrança</h1>
      <p>Gerencie seu plano e uso da plataforma</p>
    </div>
  )

  return (
    <DashboardLayout topbarLeft={topbarLeft}>
      <div className="billing-wrap">

        {/* Current plan card */}
        <div className="billing-current glass">
          <div className="billing-current-left">
            <div className="billing-current-badge">
              {currentPlanId === 'trial' ? 'Trial gratuito' : `Plano ${PLAN_LABEL[currentPlanId] ?? currentPlanId}`}
            </div>
            <div className="billing-current-price">
              {currentPlan ? (
                <>
                  <span className="bcp-val num">{formatMoney(annual ? Math.round(currentPlan.price * 0.8) : currentPlan.price)}</span>
                  <span className="bcp-unit">/mês</span>
                  {annual && <span className="bcp-discount">20% off</span>}
                </>
              ) : (
                <span className="bcp-val">Grátis</span>
              )}
            </div>
            {currentPlanId === 'trial' && trialEnds && (
              <div className={`billing-trial-warning ${trialDaysLeft <= 3 ? 'danger' : trialDaysLeft <= 7 ? 'warning' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {trialDaysLeft > 0 ? `Trial expira em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}` : 'Trial expirado'}
              </div>
            )}
          </div>
          <div className="billing-current-right">
            {vehicleCount !== null && (
              <div className="billing-usage">
                <div className="billing-usage-label">
                  <span>Veículos cadastrados</span>
                  <span className="num">
                    {vehicleCount}
                    {currentPlan && currentPlan.limit !== Infinity ? ` / ${currentPlan.limit}` : ''}
                  </span>
                </div>
                {usagePct !== null && (
                  <div className="billing-usage-bar">
                    <div
                      className="billing-usage-fill"
                      style={{
                        width: `${usagePct}%`,
                        background: usagePct >= 90 ? '#EF4444' : usagePct >= 70 ? '#F59E0B' : '#10B981',
                      }}
                    />
                  </div>
                )}
                {usagePct !== null && (
                  <div className="billing-usage-pct">
                    {usagePct}% da capacidade usada
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toggle anual */}
        <div className="billing-toggle-row">
          <span style={{ color: !annual ? 'var(--text)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Mensal</span>
          <button
            className={`billing-toggle ${annual ? 'on' : ''}`}
            onClick={() => setAnnual(a => !a)}
            aria-label="Alternar cobrança anual"
          >
            <span className="billing-toggle-knob" />
          </button>
          <span style={{ color: annual ? 'var(--text)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
            Anual <span className="billing-discount-chip">−20%</span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="billing-plans">
          {PLANS.map(plan => {
            const price = annual ? Math.round(plan.price * 0.8) : plan.price
            const isCurrent = plan.id === currentPlanId
            return (
              <div key={plan.id} className={`billing-plan glass ${plan.highlight ? 'highlight' : ''} ${isCurrent ? 'current' : ''}`}>
                {plan.highlight && <div className="billing-plan-tag">Mais popular</div>}
                {isCurrent && !plan.highlight && <div className="billing-plan-tag current">Plano atual</div>}
                <div className="billing-plan-name">{plan.name}</div>
                <div className="billing-plan-price">
                  <span className="num">{formatMoney(price)}</span>
                  <span className="billing-plan-unit">/mês</span>
                </div>
                {plan.limit !== Infinity && (
                  <div className="billing-plan-limit">até {plan.limit} veículos</div>
                )}
                <ul className="billing-plan-features">
                  {plan.features.map(f => (
                    <li key={f}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`billing-plan-btn ${isCurrent ? 'disabled' : plan.highlight ? 'primary' : ''}`}
                  disabled={isCurrent || loadingPlan === plan.id}
                  onClick={() => !isCurrent && handleSelectPlan(plan.id)}
                >
                  {loadingPlan === plan.id
                    ? 'Redirecionando…'
                    : isCurrent
                      ? 'Plano atual'
                      : currentPlan && plan.price > currentPlan.price
                        ? 'Fazer upgrade'
                        : 'Selecionar'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Manage subscription */}
        {hasActiveSubscription && (
          <div className="billing-note glass" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, flexShrink: 0 }}>
                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
              </svg>
              <p style={{ margin: 0 }}>
                Gerencie seu método de pagamento, acesse faturas ou cancele pelo <strong>Portal do Cliente</strong>.
              </p>
            </div>
            <button
              className="rel-export-btn primary"
              onClick={handleManageBilling}
              disabled={loadingPortal}
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {loadingPortal ? 'Carregando…' : 'Gerenciar assinatura'}
            </button>
          </div>
        )}

        {/* Billing info note */}
        <div className="billing-note glass">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>
            Pagamentos processados com segurança via Stripe. Em caso de dúvidas:{' '}
            <a href="mailto:suporte@wmove.com.br">suporte@wmove.com.br</a>.
          </p>
        </div>

      </div>
    </DashboardLayout>
  )
}
