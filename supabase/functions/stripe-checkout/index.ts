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

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) return new Response('Unauthorized', { status: 401 })

    const { price_id, return_url } = await req.json()
    if (!price_id) return new Response('price_id required', { status: 400 })

    // Get company + existing Stripe customer
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, stripe_customer_id')
      .eq('owner_id', user.id)
      .single()

    if (!company) return new Response('Company not found', { status: 404 })

    let customerId = company.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name,
        metadata: { company_id: company.id, user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', company.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url:  `${return_url}?canceled=1`,
      subscription_data: {
        metadata: { company_id: company.id },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'pt-BR',
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('stripe-checkout error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
