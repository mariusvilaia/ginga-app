
import { FinancialSummary, SubscriptionPlan } from '../types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    // PAYG
    { id: 'payg_1', category: 'payg', name: '1 Curs', sessions: 1, price: 79, durationDays: 30, allowedStylesCount: 1, socialPartiesIncluded: 0, currency: 'RON', isActive: true },
    { id: 'payg_2', category: 'payg', name: '2 Cursuri', sessions: 2, price: 139, durationDays: 30, allowedStylesCount: 1, socialPartiesIncluded: 0, currency: 'RON', isActive: true },
    { id: 'payg_3', category: 'payg', name: '3 Cursuri', sessions: 3, price: 179, durationDays: 45, allowedStylesCount: 1, socialPartiesIncluded: 0, currency: 'RON', isActive: true },
    { id: 'payg_4', category: 'payg', name: '4 Cursuri', sessions: 4, price: 239, durationDays: 60, allowedStylesCount: 1, socialPartiesIncluded: 0, currency: 'RON', isActive: true },

    // Monthly Bases - Updated prices: Bronze=189, Silver=269, Gold=349, Platinum=449
    { id: 'sub_bronze', category: 'monthly', name: 'Bronze Plan (704)', sessions: 999, price: 189, durationDays: 30, allowedStylesCount: 1, socialPartiesIncluded: 0, currency: 'RON', isActive: true, interval: 'month' },
    { id: 'sub_silver', category: 'monthly', name: 'Silver Plan (704)', sessions: 999, price: 269, durationDays: 30, allowedStylesCount: 2, socialPartiesIncluded: 2, currency: 'RON', isActive: true, interval: 'month' },
    { id: 'sub_gold', category: 'monthly', name: 'Gold Plan (704)', sessions: 999, price: 349, durationDays: 30, allowedStylesCount: 3, socialPartiesIncluded: 999, currency: 'RON', isActive: true, interval: 'month' },
    { id: 'sub_platinum', category: 'monthly', name: 'Platinum Plan (704)', sessions: 999, price: 449, durationDays: 30, allowedStylesCount: 999, socialPartiesIncluded: 999, currency: 'RON', isActive: true, interval: 'month' },
    
    // STAFF Plan
    { id: 'sub_staff', category: 'monthly', name: 'Staff', sessions: 999, price: 0, durationDays: 30, allowedStylesCount: 999, socialPartiesIncluded: 999, currency: 'RON', isActive: true, interval: 'month' },
];

export const MOCK_TRANSACTIONS = [];
export const MOCK_PAYMENT_METHODS = [];

// --- MOCK FINANCIAL DATA (MANAGERIAL CONTROL) ---
// Re-calibrated revenue based on approx 124 students and ~280 RON avg revenue
export const MOCK_FINANCIAL_DATA: FinancialSummary = {
    month: 'Noiembrie 2024',
    revenue: 35450, // Approx 124 students * 285 avg
    cogs: 24850, // Reduced slightly to maintain ratio
    grossProfit: 10600,
    expenses: 8900,
    operatingProfit: 1700,
    taxes: 450,
    netIncome: 1250,
    
    // --- NEW MANAGERIAL DATA ---
    budgetVariance: {
        revenue: 5.5, 
        expenses: -12.4, 
        profit: -10.3,
    },
    cashflowForecast: {
        currentBalance: 9200,
        estimatedInflow30d: 36000,
        recurringOutflow30d: 34000,
        runwayDays: 35,
    },
    subscriptionHealth: {
        activeTotal: 124,
        renewalRate: 92,
        churnRate: 3.5,
        newSubs30d: 18,
    },
    instructorRoi: [
        { name: 'Robert Dragomir', cost: 2400, revenueGenerated: 7500, roi: 312 },
        { name: 'Adrian Popita', cost: 3360, revenueGenerated: 8200, roi: 244 },
        { name: 'Agata Faye', cost: 2900, revenueGenerated: 6100, roi: 210 },
        { name: 'Marius Vilaia', cost: 2400, revenueGenerated: 4200, roi: 175 },
        { name: 'Marius Coman', cost: 1680, revenueGenerated: 3200, roi: 190 },
        { name: 'Andra', cost: 1560, revenueGenerated: 3000, roi: 192 },
        { name: 'Andreea', cost: 1300, revenueGenerated: 2500, roi: 192 },
        { name: 'Diana', cost: 1400, revenueGenerated: 2800, roi: 200 },
        { name: 'Adelin', cost: 960, revenueGenerated: 1600, roi: 166 },
        { name: 'Laura', cost: 960, revenueGenerated: 1900, roi: 197 },
    ],
    costStructure: {
        fixed: 18000,
        variable: 13850,
    },
    breakEven: {
        subscribersTarget: 110,
        subscribersActual: 124,
    },
    trends: [
        { month: 'Iun', revenue: 29000, expenses: 22000, profit: 7000, subscribers: 105 },
        { month: 'Iul', revenue: 28500, expenses: 21500, profit: 7000, subscribers: 102 },
        { month: 'Aug', revenue: 31000, expenses: 23000, profit: 8000, subscribers: 110 },
        { month: 'Sep', revenue: 33000, expenses: 24000, profit: 9000, subscribers: 118 },
        { month: 'Oct', revenue: 34500, expenses: 24500, profit: 10000, subscribers: 121 },
        { month: 'Nov', revenue: 35450, expenses: 33750, profit: 1700, subscribers: 124 },
    ],
    alerts: [
        'Chirie Săli: Cost total 14.350 RON (Mille18 + VB)',
        'Salarii: Majorare salariu minim la 4.050 RON',
        'Monitorizare Cashflow: Runway moderat (35 zile)',
    ],

    incomeStreams: [
        { 
            id: 'inc_1', name: 'Abonamente Lunare', amount: 28500, type: 'income',
            subCategories: [
                { name: 'Silver Plan', amount: 12000 },
                { name: 'Gold Plan', amount: 10500 },
                { name: 'Bronze Plan', amount: 6000 }
            ]
        },
        { 
            id: 'inc_2', name: 'Drop-ins & Pack', amount: 3500, type: 'income',
            subCategories: [
                { name: '10 Pack', amount: 2500 },
                { name: 'Single Pass', amount: 1000 }
            ]
        },
        { 
            id: 'inc_3', name: 'Evenimente & Workshop', amount: 3450, type: 'income',
            subCategories: [
                { name: 'Salsa Weekend Workshop', amount: 2200 },
                { name: 'Social Party Entry', amount: 1250 }
            ]
        }
    ],
    expenseStreams: [
        {
            id: 'exp_1', name: 'Costuri Directe (COGS)', amount: 24850, type: 'cogs',
            subCategories: [
                { name: 'Plăți Instructori', amount: 16500 },
                { name: 'Chirie Săli (Fixă)', amount: 8350 } // Partial allocated here
            ]
        },
        {
            id: 'exp_2', name: 'Cheltuieli Operaționale', amount: 8900, type: 'expense',
            subCategories: [
                { name: 'Marketing & Ads', amount: 2500 },
                { name: 'Software & Utilități', amount: 1200 },
                { name: 'Salarii Admin', amount: 4050 }, 
                { name: 'Consumabile', amount: 500 },
                { name: 'Chirie (Restul)', amount: 650 }
            ]
        }
    ],
    transactions: [
        { id: 't1', date: 'Azi, 14:30', amount: 349, currency: 'RON', description: 'Abonament Gold - Ionut Radu', status: 'success' },
        { id: 't2', date: 'Azi, 12:15', amount: -450, currency: 'RON', description: 'Facebook Ads - Meta Platforms', status: 'success' },
        { id: 't3', date: 'Ieri, 18:00', amount: 269, currency: 'RON', description: 'Abonament Silver - Maria Ionescu', status: 'success' },
        { id: 't4', date: 'Ieri, 10:00', amount: -6850, currency: 'RON', description: 'Chirie Sala Victoriei', status: 'success' },
        { id: 't5', date: '12 Nov', amount: 79, currency: 'RON', description: 'Drop In - Vizitator', status: 'success' },
    ]
};
