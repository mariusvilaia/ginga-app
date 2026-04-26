
import React, { useState, useMemo } from 'react';
import { 
    Wallet, TrendingUp, TrendingDown, DollarSign, Download, 
    FileText, GitMerge, Table, AlertTriangle, Activity, Target, Clock, Users, 
    Layers, ShieldAlert, LineChart, Scale, RefreshCw, Link as LinkIcon, CheckCircle2,
    CreditCard
} from 'lucide-react';
import { Button } from '../../components/UIComponents';
import { FinanceFlowChart } from './FinanceFlowChart';
import { useData } from '../../contexts/DataContext';

import { BudgetVarianceView } from './tabs/BudgetVarianceView';
import { CashflowView } from './tabs/CashflowView';
import { SubscriptionHealthView } from './tabs/SubscriptionHealthView';
import { CostStructureView } from './tabs/CostStructureView';
import { InstructorRoiView } from './tabs/InstructorRoiView';
import { BreakEvenView } from './tabs/BreakEvenView';
import { TrendsView } from './tabs/TrendsView';
import { RiskView } from './tabs/RiskView';
import { TablePlView } from './tabs/TablePlView';
import { StripeIntegrationView } from './tabs/StripeIntegrationView';

export const FinanceView: React.FC = () => {
    const { financials, syncFinancials, lastFinancialSync, students } = useData(); // Added students from context
    const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'year'>('month');
    const [activeTab, setActiveTab] = useState<'flow' | 'table' | 'budget' | 'cashflow' | 'subs' | 'costs' | 'roi' | 'breakeven' | 'trends' | 'risks' | 'stripe'>('flow');
    const [isSyncing, setIsSyncing] = useState(false);
    
    const handleConnectRevolut = async () => {
        try {
            const response = await fetch('/api/revolut/auth/url');
            const { url } = await response.json();
            const authWindow = window.open(url, 'revolut_auth', 'width=600,height=700');
            
            window.addEventListener('message', (event) => {
                if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                    alert('Revolut conectat cu succes!');
                    handleSync();
                }
            }, { once: true });
        } catch (error) {
            console.error('Revolut auth error:', error);
        }
    };
    
    const multiplier = viewMode === 'quarter' ? 3 : viewMode === 'year' ? 12 : 1;

    // Calculate derived data based on the Base Financials from Context + View Mode + LIVE STUDENTS
    const data = useMemo(() => {
        // 1. Clone base financials
        const scaled = JSON.parse(JSON.stringify(financials));

        // 2. DYNAMIC CALCULATION: Subscription Revenue based on Students List
        const PRICES: Record<string, number> = { 
            'Bronze': 189, 
            'Silver': 269, 
            'Gold': 349, 
            'Platinum': 449 
        };
        const counts: Record<string, number> = { 'Bronze': 0, 'Silver': 0, 'Gold': 0, 'Platinum': 0 };

        students.forEach(s => {
            // Check if student is relevant (active or has active sub)
            if (s.status === 'active' || s.subscription?.active) {
                const type = (s.subscription?.type || '').toLowerCase();
                let planKey = '';
                
                if (type.includes('bronze')) planKey = 'Bronze';
                else if (type.includes('silver')) planKey = 'Silver';
                else if (type.includes('gold')) planKey = 'Gold';
                else if (type.includes('platinum')) planKey = 'Platinum';

                if (planKey) {
                    counts[planKey]++;
                }
            }
        });

        const subRevenue = {
            'Bronze': counts['Bronze'] * PRICES['Bronze'],
            'Silver': counts['Silver'] * PRICES['Silver'],
            'Gold': counts['Gold'] * PRICES['Gold'],
            'Platinum': counts['Platinum'] * PRICES['Platinum']
        };
        
        const totalSubRevenue = Object.values(subRevenue).reduce((a, b) => a + b, 0);

        // 3. Update Income Stream: 'Abonamente Lunare' (id: inc_1)
        const subStream = scaled.incomeStreams.find((s: any) => s.id === 'inc_1');
        if (subStream) {
            subStream.amount = totalSubRevenue;
            subStream.subCategories = [
                { name: 'Silver Plan', amount: subRevenue['Silver'] },
                { name: 'Gold Plan', amount: subRevenue['Gold'] },
                { name: 'Bronze Plan', amount: subRevenue['Bronze'] },
                { name: 'Platinum Plan', amount: subRevenue['Platinum'] }
            ].filter((sc: any) => sc.amount > 0);
        }

        // 4. Update Subscription Health Metrics based on real data
        scaled.subscriptionHealth.activeTotal = students.filter(s => s.status === 'active').length;
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        scaled.subscriptionHealth.newSubs30d = students.filter(s => (s.joinDate || '').startsWith(thisMonth)).length;

        // 5. Recalculate Total Revenue (Subs + Other static streams)
        const otherRevenue = scaled.incomeStreams
            .filter((s: any) => s.id !== 'inc_1')
            .reduce((sum: number, s: any) => sum + s.amount, 0);
        
        scaled.revenue = totalSubRevenue + otherRevenue;

        // 6. Apply View Mode Multiplier to EVERYTHING
        scaled.revenue *= multiplier;
        scaled.cogs *= multiplier;
        scaled.expenses *= multiplier;
        scaled.operatingProfit *= multiplier; // Will be recalculated below anyway
        scaled.taxes *= multiplier; // Will be recalculated below
        scaled.netIncome *= multiplier; // Will be recalculated below

        // Scale streams for display
        scaled.incomeStreams.forEach((stream: any) => {
            stream.amount *= multiplier;
            if (stream.subCategories) stream.subCategories.forEach((sub: any) => sub.amount *= multiplier);
        });
        scaled.expenseStreams.forEach((stream: any) => {
            stream.amount *= multiplier;
            if (stream.subCategories) stream.subCategories.forEach((sub: any) => sub.amount *= multiplier);
        });

        // 7. Recalculate P&L Tree to ensure consistency
        scaled.grossProfit = scaled.revenue - scaled.cogs;
        scaled.operatingProfit = scaled.grossProfit - scaled.expenses;
        // Assume 16% Profit Tax
        scaled.taxes = scaled.operatingProfit > 0 ? Math.round(scaled.operatingProfit * 0.16) : 0;
        scaled.netIncome = scaled.operatingProfit - scaled.taxes;

        if (viewMode === 'quarter') scaled.month = 'Trimestrul 4 2024';
        if (viewMode === 'year') scaled.month = 'Anul 2024';
        
        return scaled;
    }, [viewMode, multiplier, financials, students]);

    const handleSync = async () => {
        setIsSyncing(true);
        await syncFinancials(); // Call context function
        setIsSyncing(false);
    };

    const allTabs = [
        { id: 'flow', label: 'Visual Flow', icon: GitMerge },
        { id: 'table', label: 'Tabel P&L', icon: Table },
        { id: 'budget', label: 'Buget', icon: Target },
        { id: 'cashflow', label: 'Cashflow', icon: Clock },
        { id: 'subs', label: 'Abonamente', icon: Activity },
        { id: 'costs', label: 'Costuri', icon: Layers },
        { id: 'roi', label: 'ROI Instructori', icon: Users },
        { id: 'breakeven', label: 'Break-Even', icon: Scale },
        { id: 'trends', label: 'Trenduri', icon: LineChart },
        { id: 'risks', label: 'Riscuri', icon: ShieldAlert },
    ];

    const formatTime = (date: Date | null) => {
        if (!date) return 'Niciodată';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Finanțe & Control</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Situația financiară pentru <span className="text-gray-900 dark:text-white font-bold">{data.month}</span></p>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                            <LinkIcon size={10} /> Sursă: Stripe & Revolut
                        </span>
                        {lastFinancialSync && (
                            <span className="text-[10px] text-gray-400 ml-2 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Actualizat: {formatTime(lastFinancialSync)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="secondary" 
                        onClick={handleConnectRevolut}
                        className="!w-auto px-4 h-10 text-xs gap-2 border-dashed border-gray-300 hover:border-blue-300 hover:text-blue-600"
                    >
                        <RefreshCw size={14} /> 
                        Conectează Revolut
                    </Button>
                    <Button 
                        variant="secondary" 
                        onClick={handleSync}
                        className="!w-auto px-4 h-10 text-xs gap-2 border-dashed border-gray-300 hover:border-blue-300 hover:text-blue-600"
                        isLoading={isSyncing}
                    >
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''}/> 
                        {isSyncing ? 'Se sincronizează...' : 'Sync Stripe/Revolut'}
                    </Button>

                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex">
                        {['month', 'quarter', 'year'].map((m) => (
                            <button key={m} onClick={() => setViewMode(m as any)} className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${viewMode === m ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{m === 'month' ? 'Lună' : m === 'quarter' ? 'Trimestru' : 'An'}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 mb-6 overflow-x-auto no-scrollbar shrink-0 pb-1">
                {allTabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1 pb-4">
                <div className="flex flex-col xl:flex-row gap-8 mb-8">
                    <div className="flex-1 flex flex-col gap-6">
                        {activeTab === 'flow' && <div className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 min-h-[500px] overflow-hidden"><FinanceFlowChart data={data} multiplier={multiplier} /></div>}
                        {activeTab === 'table' && <TablePlView data={data} />}
                        {activeTab === 'budget' && <BudgetVarianceView data={data} />}
                        {activeTab === 'cashflow' && <CashflowView data={data} />}
                        {activeTab === 'subs' && <SubscriptionHealthView data={data} />}
                        {activeTab === 'costs' && <CostStructureView data={data} />}
                        {activeTab === 'roi' && <InstructorRoiView data={data} />}
                        {activeTab === 'breakeven' && <BreakEvenView data={data} />}
                        {activeTab === 'trends' && <TrendsView data={data} />}
                        {activeTab === 'risks' && <RiskView data={data} />}
                    </div>

                    <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm"><Clock size={16} className="text-blue-500"/> Cashflow Estimat</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end pb-3 border-b border-gray-100 dark:border-gray-700"><span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">RUNWAY</span><span className="text-lg font-black text-blue-800 dark:text-blue-300">{data.cashflowForecast.runwayDays} Zile</span></div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-xs text-blue-700 dark:text-blue-300 leading-snug">
                                    <span className="font-bold">Notă AI:</span> Fluxul de numerar este stabil, dar monitorizați cheltuielile variabile săptămâna viitoare.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};