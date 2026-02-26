
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
            expand: ['data.subscriptions']
        });

        // D. Mapare Date (Stripe -> Model Ginga)
        const mappedStudents = customers.data.map(cus => {
            const sub = cus.subscriptions && cus.subscriptions.data.length > 0 ? cus.subscriptions.data[0] : null;
            
            let planName = 'Fără Abonament';
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
  res.json({received: true});
});
