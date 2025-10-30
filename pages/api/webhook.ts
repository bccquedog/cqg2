import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const config = { api: { bodyParser: false } };

function buffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    req.on("data", (chunk: any) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const app = initializeApp({ projectId: "demo-cqg" });
const db = getFirestore(app);
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = (session.metadata?.type as string) || "unknown";
      const userId = (session.metadata?.userId as string) || "unknown";
      const amount = session.amount_total ? session.amount_total / 100 : null;
      await addDoc(collection(db, "payments"), {
        userId,
        type: type === "sub" ? "sub" : "buy-in",
        amount,
        status: "succeeded",
        createdAt: serverTimestamp(),
      });
    }
    return res.status(200).json({ received: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "webhook error" });
  }
}




