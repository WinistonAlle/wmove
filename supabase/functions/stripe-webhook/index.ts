import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Maps Stripe plan price IDs to our internal plan names
// Populated from STRIPE_PRICE_MAP env var as JSON:
// { "price_xxx": "wgo", "price_yyy": "wplus", ... }
function getPlanFromPriceId(priceId: string): string {
  try {
    const map = JSON.parse(Deno.env.get('STRIPE_PRICE_MAP') || '{}')
    return map[priceId] || 'wgo'
  } catch {
    return 'wgo'
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  console.log(`Processing event: ${event.type}`)

  try {
    switch (event.type) {

      // ── Checkout completed → subscription created ──────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        const priceId = subscription.items.data[0]?.price?.id
        const plan    = getPlanFromPriceId(priceId)

        await supabase
          .from('companies')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_price_id:        priceId,
            plan,
            subscription_status:    subscription.status,
            trial_ends_at:          subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', session.customer as string)

        console.log(`Checkout completed: customer=${session.customer} plan=${plan}`)
        break
      }

      // ── Subscription updated (upgrade, downgrade, renewal) ─────
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price?.id
        const plan    = getPlanFromPriceId(priceId)

        await supabase
          .from('companies')
          .update({
            stripe_subscription_id: sub.id,
            stripe_price_id:        priceId,
            plan,
            subscription_status:    sub.status,
            trial_ends_at:          sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', sub.customer as string)

        console.log(`Subscription updated: customer=${sub.customer} status=${sub.status} plan=${plan}`)
        break
      }

      // ── Subscription deleted (canceled or expired) ─────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await supabase
          .from('companies')
          .update({
            stripe_subscription_id: null,
            stripe_price_id:        null,
            plan:                   null,
            subscription_status:    'canceled',
          })
          .eq('stripe_customer_id', sub.customer as string)

        console.log(`Subscription deleted: customer=${sub.customer}`)
        break
      }

      // ── Payment failed ─────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase
          .from('companies')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)

        console.log(`Payment failed: customer=${invoice.customer}`)
        break
      }

      default:
        console.log(`Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err)
    return new Response('Internal error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
