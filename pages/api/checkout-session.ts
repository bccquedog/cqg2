import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const uid = (req.headers["x-user-id"] as string) || undefined;
  if (!uid) return res.status(401).json({ error: "unauthorized" });
  const { type } = req.body || {};
  if (!type || !["buyin", "sub"].includes(type)) return res.status(400).json({ error: "invalid type" });
  try {
    const line_items = type === "buyin"
      ? [{ price_data: { currency: "usd", product_data: { name: "Tournament Buy-In" }, unit_amount: 500 }, quantity: 1 }]
      : [{ price_data: { currency: "usd", product_data: { name: "Subscription (Test)" }, recurring: { interval: "month" }, unit_amount: 1000 }, quantity: 1 }];

    const session = await stripe.checkout.sessions.create({
      mode: type === "buyin" ? "payment" : "subscription",
      line_items,
      success_url: `${req.headers.origin || "http://localhost:3000"}/payments/success`,
      cancel_url: `${req.headers.origin || "http://localhost:3000"}/payments/cancel`,
      metadata: { userId: uid, type },
    });
    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "stripe error" });
  }
}




