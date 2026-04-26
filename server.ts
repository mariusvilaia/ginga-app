import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import jwt from "jsonwebtoken";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === "production" ? (Number(process.env.PORT) || 3000) : 3000;

// Revolut OAuth state
let revolutAccessToken: string | null = null;
let revolutRefreshToken: string | null = null;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads", "recordings");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const leadName = (req.body.leadName || "unknown_lead").toLowerCase().replace(/\s+/g, "_");
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timestamp = now.getTime();
    const ext = path.extname(file.originalname) || ".mp3";
    
    const filename = `${leadName}_${date}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

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
  res.json({ status: "ok", stripeConfigured: !!process.env.STRIPE_SECRET_KEY, revolutConfigured: !!process.env.REVOLUT_CLIENT_ID });
});

// Revolut OAuth Routes
app.get("/api/revolut/auth/url", (req, res) => {
  const clientId = process.env.REVOLUT_CLIENT_ID;
  // The redirect_uri must match exactly what is in the Revolut portal
  const redirectUri = "https://ais-dev-bpc4hriw762xnyob4rna32-61089527881.europe-west2.run.app/api/revolut/auth/callback";
  
  // Using the Revolut Business API authorization endpoint
  const authUrl = `https://business.revolut.com/app-confirm?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.json({ url: authUrl });
});

app.get("/api/revolut/auth/callback", async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.REVOLUT_CLIENT_ID;
  const privateKey = process.env.REVOLUT_PRIVATE_KEY;
  const redirectUri = `${req.protocol}://${req.get("host")}/api/revolut/auth/callback`;

  if (!clientId || !privateKey) {
      return res.status(500).send("REVOLUT_CLIENT_ID or REVOLUT_PRIVATE_KEY is not configured");
  }

  // Sign JWT for Revolut authentication
  const jwtPayload = {
      iss: clientId,
      sub: clientId,
      aud: "https://revolut.com",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
  };

  // Ensure private key has PEM headers and actual newlines
  let formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  
  if (!formattedPrivateKey.includes('-----BEGIN')) {
      formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${formattedPrivateKey}\n-----END PRIVATE KEY-----`;
  }

  const clientAssertion = jwt.sign(jwtPayload, formattedPrivateKey, { algorithm: 'RS256' });

  try {
    const response = await axios.post("https://b2b.revolut.com/oauth2/token", {
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
      redirect_uri: redirectUri,
    }, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    revolutAccessToken = response.data.access_token;
    revolutRefreshToken = response.data.refresh_token;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Revolut OAuth error:", error.response?.data || error.message);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/stripe/customers", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const customers = await stripe.customers.list({ limit: 100 }).autoPagingToArray({ limit: 10000 });
    res.json(customers);
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
    }).autoPagingToArray({ limit: 10000 });
    res.json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stripe/payments", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  try {
    const payments = await stripe.paymentIntents.list({ limit: 100 }).autoPagingToArray({ limit: 10000 });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/stripe/sync-payments", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

  const { email, name, phone, stripeCustomerId } = req.body;

  try {
    let customers: Stripe.Customer[] = [];
    if (stripeCustomerId) {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer && !customer.deleted) {
            customers = [customer as Stripe.Customer];
        }
    } else {
        // Search by email first (most reliable)
        if (email) {
            const searchResult = await stripe.customers.search({ query: `email:"${email}"` });
            customers = searchResult.data;
        }
        
        // Fallback to phone
        if (customers.length === 0 && phone) {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (cleanedPhone) {
                const searchResult = await stripe.customers.search({ query: `phone:"${cleanedPhone}"` });
                customers = searchResult.data;
            }
        }
        
        // Fallback to exact name match (less reliable)
        if (customers.length === 0 && name) {
            const searchResult = await stripe.customers.search({ query: `name:"${name}"` });
            customers = searchResult.data;
        }
    }

    if (customers.length === 0) {
      return res.json({ payments: [], subscription: null }); // No customer found
    }

    const allCharges: Stripe.Charge[] = [];
    let activeSubscription: any = null;

    for (const customer of customers) {
      // Get all successful charges for the customer
      const charges = await stripe.charges.list({ customer: customer.id, limit: 100 }).autoPagingToArray({ limit: 10000 });
      const successfulCharges = charges.filter(charge => charge.paid && !charge.refunded && charge.amount > 0);
      allCharges.push(...successfulCharges);

      // Get active subscriptions
      if (!activeSubscription) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1
        });
        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0] as any;
          let planName = 'Unknown Plan';
          const productId = sub.items?.data[0]?.plan?.product || sub.items?.data[0]?.price?.product;
          
          if (typeof productId === 'string') {
            try {
              const product = await stripe.products.retrieve(productId);
              planName = product.name;
            } catch (e) {
              console.error('Failed to retrieve product:', e);
            }
          } else if (productId && productId.name) {
            planName = productId.name;
          }

          activeSubscription = {
            status: sub.status,
            current_period_end: sub.current_period_end,
            planName: planName
          };
        }
      }
    }

    // Deduplicate charges by ID
    const uniqueChargesMap = new Map<string, Stripe.Charge>();
    for (const charge of allCharges) {
      if (!uniqueChargesMap.has(charge.id)) {
        uniqueChargesMap.set(charge.id, charge);
      }
    }
    
    const uniqueCharges = Array.from(uniqueChargesMap.values());

    // Map to final format and sort
    const finalPayments = uniqueCharges.map(charge => ({
      id: charge.id,
      paymentIntentId: typeof charge.payment_intent === 'string' ? charge.payment_intent : (charge.payment_intent as any)?.id,
      date: new Date(charge.created * 1000).toISOString().split('T')[0],
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      description: charge.description || 'Plată Stripe',
      status: 'success',
      invoiceUrl: charge.receipt_url || ''
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ payments: finalPayments, subscription: activeSubscription });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/recordings/upload", upload.single("recording"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Return the relative path for database storage
  const relativePath = path.join("uploads", "recordings", req.file.filename);
  
  res.json({ 
    success: true, 
    filePath: relativePath,
    filename: req.file.filename
  });
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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