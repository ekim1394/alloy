// Stripe Webhook Handler Edge Function
// Handles Stripe events to update subscription status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    // Initialize Supabase with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan || 'pro'
        
        if (userId && session.subscription) {
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: session.subscription,
              plan,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
          
          console.log(`User ${userId} upgraded to ${plan}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          trialing: 'trialing',
          incomplete: 'past_due',
          incomplete_expired: 'canceled',
          unpaid: 'past_due',
        }
        const status = statusMap[subscription.status] || 'active'
        
        await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        
        console.log(`Subscription updated for customer ${customerId}: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
        
        console.log(`Subscription canceled for customer ${customerId}`)
        break
      }

      case 'invoice.paid': {
        // Reset usage on new billing period
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({
              minutes_used: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
          
          console.log(`Usage reset for customer ${customerId}`)
        }
        break
      }

      case 'invoice.upcoming': {
        // Add overage charges before invoice is finalized
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Get subscription to check usage
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single()
        
        if (subscription && subscription.plan === 'pro') {
          const includedMinutes = subscription.minutes_included || 300
          const usedMinutes = subscription.minutes_used || 0
          const overageMinutes = usedMinutes - includedMinutes
          
          if (overageMinutes > 0) {
            // Rate: $0.05 per minute = 5 cents per minute
            const overageRateCents = 5
            const overageAmountCents = Math.ceil(overageMinutes * overageRateCents)
            
            // Add overage as invoice item
            await stripe.invoiceItems.create({
              customer: customerId,
              amount: overageAmountCents,
              currency: 'usd',
              description: `Overage: ${overageMinutes.toFixed(1)} additional minutes @ $0.05/min`,
            })
            
            console.log(`Added overage charge for customer ${customerId}: ${overageMinutes.toFixed(1)} min = $${(overageAmountCents / 100).toFixed(2)}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
