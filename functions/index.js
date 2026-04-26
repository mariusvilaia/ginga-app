
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * ------------------------------------------------------------------
 * 1. Salvare Configurare Stripe (Set API Key)
 * ------------------------------------------------------------------
 * 
 * COMENTARII EXPLICATIVE (ROMÂNĂ):
 * 
 * 1. Ce este CORS și de ce permitem toate originile?
 *    - CORS (Cross-Origin Resource Sharing) este un mecanism de securitate al browserului care împiedică 
 *      site-ul tău (ex: ginga-app.web.app) să facă cereri către un alt server (Cloud Functions) 
 *      dacă serverul nu permite explicit acest lucru.
 *    - Setând `{ cors: true }` în opțiunile `onCall`, instruim Firebase să adauge automat headerele 
 *      `Access-Control-Allow-Origin` la răspuns, rezolvând eroarea din consolă.
 * 
 * 2. Verificarea Identității (Auth):
 *    - Legătura dintre `auth.currentUser` din React și backend se face prin "ID Token".
 *    - Când folosim `httpsCallable` în frontend, SDK-ul Firebase atașează automat acest token.
 *    - Aici, `request.auth` conține datele utilizatorului decodificate. Dacă `request.auth` este null, 
 *      utilizatorul nu este logat.
 */
exports.setStripeConfig = onCall({ cors: true }, async (request) => {
    // A. Verificare Autentificare
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Trebuie să fii autentificat pentru a efectua această acțiune.');
    }

    // B. Verificare Permisiuni (Doar Adminul)
    const userEmail = request.auth.token.email;
    if (userEmail !== 'contact@ginga.ro') {
        logger.warn(`Încercare neautorizată de la: ${userEmail}`);
        throw new HttpsError('permission-denied', 'Doar administratorul principal are permisiunea de a modifica setările de plată.');
    }

    const data = request.data || {};
    const apiKey = (data.apiKey || '').trim();

    // C. Validare Input
    if (!apiKey || (!apiKey.startsWith('rk_') && !apiKey.startsWith('sk_'))) {
        return { success: false, message: 'Cheie invalidă. Trebuie să înceapă cu "rk_" sau "sk_".' };
    }

    try {
        const db = admin.firestore();
        
        // D. Salvare în Firestore
        // Salvăm în colecția `app_settings` documentul `stripe_config`.
        // Această colecție ar trebui securizată prin Firestore Rules să nu poată fi citită public.
        await db.collection('app_settings').doc('stripe_config').set({
            apiKey: apiKey,
            updatedAt: new Date().toISOString(),
            updatedBy: userEmail
        }, { merge: true });

        logger.info("Stripe API Key updated successfully by admin.");
        return { success: true, message: "Cheia Stripe a fost salvată securizat." };

    } catch (error) {
        logger.error("Database Write Error", error);
        // Returnăm un mesaj curat către client, nu eroarea brută de sistem
        throw new HttpsError('internal', 'Eroare la scrierea în baza de date. Verificați logurile.');
    }
});

/**
 * ------------------------------------------------------------------
 * 2. Sincronizare Date Stripe (Fetch & Map)
 * ------------------------------------------------------------------
 * 
 * DE CE FOLOSIM `httpsCallable` vs `fetch`?
 * - `fetch` este o cerere HTTP standard. Ar necesita să gestionăm manual token-ul de auth în header 
 *   (`Authorization: Bearer ...`) și să gestionăm manual erorile de rețea.
 * - `httpsCallable` este metoda recomandată de Firebase. Ea se ocupă automat de:
 *    1. Serializarea datelor (JSON).
 *    2. Autentificare (trimite token-ul userului curent).
 *    3. Gestionarea erorilor specifice Firebase (HttpsError).
 */
exports.syncStripeCustomers = onCall({ cors: true }, async (request) => {
    // A. Verificare Admin
    if (!request.auth || request.auth.token.email !== 'contact@ginga.ro') {
        throw new HttpsError('permission-denied', 'Acces interzis.');
    }

    // Lazy load Stripe
    const Stripe = require("stripe");

    try {
        const db = admin.firestore();
        
        // B. Citire Cheie din DB (Securizat - cheia nu ajunge niciodată la client)
        const configDoc = await db.collection('app_settings').doc('stripe_config').get();
        
        if (!configDoc.exists || !configDoc.data() || !configDoc.data().apiKey) {
            return { success: false, message: 'Cheia Stripe nu este configurată. Mergi la tab-ul Integrări.' };
        }
        
        const apiKey = configDoc.data().apiKey.trim();
        const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });

        // C. Apel către Stripe API
        const customers = await stripe.customers.list({
            limit: 100,
            expand: ['data.subscriptions', 'data.payment_methods']
        });

        // D. Mapare Date (Stripe -> Model Ginga)
        const mappedStudents = customers.data.map(cus => {
            const sub = cus.subscriptions?.data?.find(s => s.status === 'active') || (cus.subscriptions?.data?.length > 0 ? cus.subscriptions.data[0] : null);
            
            // Get payment methods
            const paymentMethods = cus.payment_methods?.data?.map((pm) => ({
                id: pm.id,
                type: pm.type === 'card' ? 'card' : 'other',
                last4: pm.card?.last4,
                brand: pm.card?.brand,
                expiry: pm.card ? `${pm.card.exp_month}/${pm.card.exp_year}` : undefined,
                isDefault: cus.invoice_settings?.default_payment_method === pm.id
            })) || [];
            let planName = 'Fără abonament';
            if (sub) {
                // Încercăm să luăm numele produsului sau nickname-ul planului
                planName = sub.plan.nickname || 'Abonament Activ';
                
                // Logică simplă de deducere bazată pe sumă (dacă nu avem nickname)
                if (!sub.plan.nickname && sub.plan.amount) {
                    if (sub.plan.amount >= 40000) planName = 'Platinum';
                    else if (sub.plan.amount >= 30000) planName = 'Gold';
                    else if (sub.plan.amount >= 20000) planName = 'Silver';
                    else planName = 'Bronze';
                }
            }

            // Conversie Unix Timestamp -> ISO Date String
            const expiryDateReadable = sub 
                ? new Date(sub.current_period_end * 1000).toISOString().split('T')[0] 
                : new Date().toISOString().split('T')[0];

            return {
                id: cus.id,
                name: cus.name || (cus.email ? cus.email.split('@')[0] : 'Client Stripe'),
                email: cus.email || '',
                phone: cus.phone || '',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cus.name || 'User')}&background=random&color=fff`,
                role: 'student',
                status: sub && sub.status === 'active' ? 'active' : 'inactive',
                
                subscription: {
                    type: planName,
                    planId: sub ? sub.plan.id : 'manual',
                    active: sub ? sub.status === 'active' : false,
                    expiryDate: expiryDateReadable,
                    lastPaymentDate: sub ? new Date(sub.current_period_start * 1000).toISOString().split('T')[0] : '',
                    autoPayEnabled: sub ? !sub.cancel_at_period_end : false,
                    sessionsLeft: 999,
                    sessionsTotal: 999,
                    socialPartiesUsed: 0
                },
                
                // Valori default pentru câmpuri lipsă în Stripe
                gender: 'M', 
                age: 25,
                enrollments: [],
                favoriteStyle: 'Bachata',
                goal: 'Distracție',
                joinDate: new Date(cus.created * 1000).toISOString().split('T')[0],
                mainGroup: 'General',
                stats: { streakWeeks: 0, totalClasses: 0, hoursDanced: 0, points: 0 },
                paymentMethods: paymentMethods,
                preferences: { notificationsEnabled: true, reminderMinutes: 60 },
                risk: { level: 'low' },
                kpi: { lastAttendanceDays: 0, consecutiveAbsences: 0, paymentStatus: sub?.status === 'active' ? 'paid' : 'unpaid', retentionRate: 100, engagementScore: 100, hasFeedback: false },
                achievements: [],
                personalVideos: [],
                attendedClasses: [],
                feedbackHistory: [],
                attendanceHistory: [],
                paymentHistory: [],
                adminNotes: []
            };
        });

        // E. Salvare Batch în Firestore (Cache local al clienților)
        if (mappedStudents.length > 0) {
            const batch = db.batch();
            mappedStudents.forEach(std => {
                const ref = db.collection('students').doc(std.id);
                batch.set(ref, std, { merge: true });
            });
            await batch.commit();
        }

        return { success: true, count: mappedStudents.length, students: mappedStudents };

    } catch (error) {
        logger.error("Stripe Sync Error", error);
        
        if (error.type === 'StripeAuthenticationError') {
             return { success: false, message: 'Cheia Stripe este invalidă sau expirată.' };
        }
        
        throw new HttpsError('internal', `Eroare Backend: ${error.message}`);
    }
});

exports.stripeWebhook = onRequest(async (req, res) => {
  const Stripe = require("stripe");
  const db = admin.firestore();

  // 1. Get API Key and Webhook Secret from Firestore
  let apiKey, webhookSecret;
  try {
    const configDoc = await db.collection('app_settings').doc('stripe_config').get();
    if (!configDoc.exists || !configDoc.data() || !configDoc.data().apiKey) {
      logger.error("Stripe not configured in Firestore");
      return res.status(500).send("Stripe not configured");
    }
    apiKey = configDoc.data().apiKey.trim();
    webhookSecret = configDoc.data().webhookSecret; // Optional but recommended
  } catch (err) {
    logger.error("Error fetching Stripe config:", err);
    return res.status(500).send("Internal Server Error");
  }

  const stripe = new Stripe(apiKey);
  let event;

  // 2. Verify Signature
  if (webhookSecret) {
    const sig = req.headers['stripe-signature'];
    try {
      // Use req.rawBody for signature verification if available, otherwise req.body
      const payload = req.rawBody || JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    event = req.body;
  }

  // 3. Idempotency Check by event.id
  const eventId = event.id;
  if (!eventId) {
    return res.status(400).send("Missing event ID");
  }

  const eventRef = db.collection('processed_events').doc(eventId);
  
  try {
    const doc = await eventRef.get();
    if (doc.exists) {
      logger.info(`Event ${eventId} already processed`);
      return res.status(200).json({ received: true, duplicate: true });
    }
    
    // Mark as processed early to prevent race conditions
    await eventRef.set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      type: event.type
    });
  } catch (err) {
    logger.error(`Error checking idempotency for event ${eventId}:`, err);
    return res.status(500).send("Internal Server Error");
  }

  // 4. Handle Events
  try {
    const object = event.data.object;

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const invoice = object;
      
      // RULE A: A “Payment” record is created ONLY when an invoice becomes paid
      if (invoice.status === 'paid' && invoice.paid === true) {
        const paymentData = {
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: invoice.subscription,
          stripe_customer_id: invoice.customer,
          amount: invoice.amount_paid / 100,
          currency: (invoice.currency || 'ron').toUpperCase(),
          paid_at: invoice.status_transitions?.paid_at 
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : new Date(invoice.created * 1000).toISOString(),
          stripe_payment_intent_id: invoice.payment_intent,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          description: invoice.description || 'Subscription renewal',
          status: 'success'
        };

        // Fetch charge ID if payment_intent is present
        if (invoice.payment_intent) {
          try {
            const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent);
            paymentData.stripe_charge_id = pi.latest_charge;
          } catch (err) {
            logger.warn(`Could not fetch payment intent ${invoice.payment_intent}: ${err.message}`);
          }
        }

        // RULE C: Use invoice.id as the unique primary key
        await db.collection('payments').doc(invoice.id).set(paymentData, { merge: true });
        logger.info(`Payment recorded for invoice ${invoice.id}`);
      }
    } else if (event.type?.startsWith('customer.subscription.')) {
      // RULE B: Never create payments from subscription events
      // Store subscription events for timeline only
      await db.collection('subscription_events').add({
        stripe_subscription_id: object.id,
        type: event.type.replace('customer.subscription.', ''),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        payload: object
      });
      logger.info(`Subscription event ${event.type} recorded for ${object.id}`);
    } else if (event.type === 'invoice.payment_failed') {
      // Optional: Store failed payments for "Datorii" section
      logger.info(`Payment failed for invoice ${object.id}`);
    }

    return res.json({ received: true });
  } catch (err) {
    logger.error(`Error handling event ${event.type}:`, err);
    return res.status(500).send("Error processing webhook");
  }
});

const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.hourlyStripeSync = onSchedule("every 1 hours", async (event) => {
    const Stripe = require("stripe");
    const db = admin.firestore();
    
    try {
        const configDoc = await db.collection('app_settings').doc('stripe_config').get();
        if (!configDoc.exists || !configDoc.data() || !configDoc.data().apiKey) {
            logger.error('Cheia Stripe nu este configurată.');
            return;
        }
        
        const apiKey = configDoc.data().apiKey.trim();
        const stripe = new Stripe(apiKey, { apiVersion: '2023-10-16' });

        // Fetch customers
        const customers = await stripe.customers.list({
            limit: 100,
            expand: ['data.subscriptions']
        });

        // Fetch students from Firestore
        const studentsSnapshot = await db.collection('students').get();
        const students = [];
        studentsSnapshot.forEach(doc => students.push({ id: doc.id, ...doc.data() }));

        const batch = db.batch();

        for (const cus of customers.data) {
            // Find matching student
            let student = students.find(s => s.stripeCustomerId === cus.id) || students.find(s => s.email && s.email.toLowerCase() === cus.email?.toLowerCase());
            
            if (!student) continue;

            const sub = cus.subscriptions?.data?.find(s => s.status === 'active') || (cus.subscriptions?.data?.length > 0 ? cus.subscriptions.data[0] : null);
            
            // Fetch payments for this customer
            const charges = await stripe.charges.list({
                customer: cus.id,
                limit: 100,
            });

            const syncedPayments = charges.data.map(charge => ({
                id: charge.id,
                date: new Date(charge.created * 1000).toISOString(),
                amount: charge.amount / 100,
                currency: charge.currency.toUpperCase(),
                description: charge.description || 'Plată Stripe',
                status: charge.status,
                invoiceUrl: charge.receipt_url || ''
            }));

            const existingPayments = student.paymentHistory || [];
            const uniqueNewPaymentsMap = new Map();
            
            for (const sp of syncedPayments) {
                const spDate = new Date(sp.date).getTime();
                const isDuplicate = existingPayments.some(ep => {
                    if (ep.id === sp.id) return true;
                    if (ep.amount !== sp.amount) return false;
                    const epDate = new Date(ep.date).getTime();
                    const diffDays = Math.abs(spDate - epDate) / (1000 * 3600 * 24);
                    return diffDays <= 3;
                });

                if (!isDuplicate && !uniqueNewPaymentsMap.has(sp.id)) {
                    uniqueNewPaymentsMap.set(sp.id, sp);
                }
            }
            
            const newPayments = Array.from(uniqueNewPaymentsMap.values());
            let updatedPaymentHistory = [...existingPayments, ...newPayments];
            updatedPaymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const latestPayment = updatedPaymentHistory[0];
            let newExpiryDateStr = student.subscription?.expiryDate || new Date().toISOString().split('T')[0];
            let newLastPaymentDate = student.subscription?.lastPaymentDate || '';

            if (latestPayment) {
                // Simple logic for expiry date: +30 days from latest payment
                const paymentDate = new Date(latestPayment.date);
                paymentDate.setDate(paymentDate.getDate() + 30);
                newExpiryDateStr = paymentDate.toISOString().split('T')[0];
                newLastPaymentDate = latestPayment.date;
            }

            let planName = student.subscription?.type || 'Fără abonament';
            if (sub) {
                planName = sub.plan.nickname || 'Abonament Activ';
                if (!sub.plan.nickname && sub.plan.amount) {
                    if (sub.plan.amount >= 40000) planName = 'Platinum';
                    else if (sub.plan.amount >= 30000) planName = 'Gold';
                    else if (sub.plan.amount >= 20000) planName = 'Silver';
                    else planName = 'Bronze';
                }
            }

            const expiryDateReadable = sub 
                ? new Date(sub.current_period_end * 1000).toISOString().split('T')[0] 
                : newExpiryDateStr;

            const studentRef = db.collection('students').doc(student.id);
            batch.set(studentRef, {
                stripeCustomerId: cus.id,
                paymentHistory: updatedPaymentHistory,
                subscription: {
                    ...(student.subscription || {}),
                    type: planName,
                    active: sub ? sub.status === 'active' : (student.subscription?.active || false),
                    lastPaymentDate: newLastPaymentDate,
                    expiryDate: expiryDateReadable,
                }
            }, { merge: true });
        }

        await batch.commit();
        logger.info("Hourly Stripe Sync completed successfully.");

    } catch (error) {
        logger.error("Hourly Stripe Sync Error", error);
    }
});