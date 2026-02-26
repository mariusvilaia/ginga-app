import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (Number(process.env.PORT) || 3000) : 3000;

let stripeClient: Stripe | null = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is not set. Stripe features will be disabled.");
      return null;
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", stripeConfigured: !!process.env.STRIPE_SECRET_KEY });
});

app.get("/api/stripe/customers", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const customers = await stripe.customers.list({ limit: 100 });
    res.json(customers.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stripe/subscriptions", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ["data.customer"],
    });
    res.json(subscriptions.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stripe/payments", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const payments = await stripe.paymentIntents.list({ limit: 100 });
    res.json(payments.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/stripe/sync-payments", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  const { email, name, phone } = req.body;

  try {
    let customers = [];
    
    // 1. Try finding by email first (most reliable)
    if (email) {
      const res = await stripe.customers.list({ email: email, limit: 1 });
      customers = res.data;
    }
    
    // 2. If not found by email, try searching by name
    if (customers.length === 0 && name) {
      const res = await stripe.customers.search({ query: `name~'${name}'`, limit: 1 });
      customers = res.data;
    }

    // 3. If still not found, try searching by phone
    if (customers.length === 0 && phone) {
      const res = await stripe.customers.search({ query: `phone:'${phone}'`, limit: 1 });
      customers = res.data;
    }

    if (customers.length === 0) {
      return res.json({ payments: [] }); // No customer found
    }

    const customerId = customers[0].id;

    // Fetch successful charges for this customer
    const charges = await stripe.charges.list({ customer: customerId, limit: 100 });
    
    const payments = charges.data
      .filter(c => c.status === 'succeeded' && c.paid)
      .map(c => ({
        id: c.id,
        date: new Date(c.created * 1000).toISOString().split('T')[0],
        amount: c.amount / 100, // Stripe amounts are in cents
        currency: c.currency.toUpperCase(),
        description: c.description || 'Plată Stripe',
        status: 'success',
        invoiceUrl: c.receipt_url || '#'
      }));

    res.json({ payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("/*path", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Listening on ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});