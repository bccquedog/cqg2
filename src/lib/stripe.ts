import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession(params: {
  amount: number;
  currency: 'usd';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const { amount, currency, successUrl, cancelUrl, metadata } = params;
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    currency,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: { name: 'Tournament Buy-In' },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}




