
import React from 'react';
import { Scale, CheckCircle, XCircle, TrendingUp, Sparkles } from 'lucide-react';
import { MetricCard, SimpleLineChart } from '../components/FinanceShared';
import { FinancialSummary } from '../../../types';

export const BudgetVarianceView = ({ data }: { data: FinancialSummary }) => {
    // Mocking specific breakdown data based on the general MOCK_DATA
    const varianceItems = [
        { category: 'Venituri Abonamente', budget: 30000, actual: 32000 },
        { category: 'Drop-ins & Pack', budget: 4000, actual: 4500 },
        { category: 'Costuri Instructori', budget: 15500, actual: 14500 }, // Under budget (Good)
        { category: 'Chirie Săli', budget: 14350, actual: 14350 },
        { category: 'Marketing & Ads', budget: 2800, actual: 3500 }, // Over budget (Bad)
        { category: 'Software & Utilități', budget: 1200, actual: 1200 },
        { category: 'Salarii Admin', budget: 3300, actual: 4050 }, // Over budget due to min wage hike
        { category: 'Consumabile', budget: 300, actual: 500 }, // Over budget
    ];

    // Prepare chart data
    const budgetTrendData = data.trends.map((t: any) => ({
        month: t.month,
        actual: t.revenue,
        budget: t.revenue * 0.95 // Mock budget as slightly lower than actual
    }));

    return (
        <div className="space-y-6">
            {/* 1. KPI Variance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Venit vs Buget" 
                    value={`${data.budgetVariance.revenue > 0 ? '+' : ''}${data.budgetVariance.revenue}%`} 
                    trend={data.budgetVariance.revenue > 0 ? 'up' : 'down'} 
                    subtext="Peste plan"
                    color="text-blue-600"
                />
                <MetricCard 
                    label="Cheltuieli vs Buget" 
                    value={`${Math.abs(data.budgetVariance.expenses)}%`} 
                    trend={data.budgetVariance.expenses < 0 ? 'up' : 'down'} // Negative expenses variance usually means under budget (Good)
                    subtext={data.budgetVariance.expenses < 0 ? 'Sub buget' : 'Peste buget'}
                    color={data.budgetVariance.expenses < 0 ? 'text-green-600' : 'text-red-600'}
                />
                <MetricCard 
                    label="Profit vs Buget" 
                    value={`${data.budgetVariance.profit > 0 ? '+' : ''}${data.budgetVariance.profit}%`} 
                    trend={data.budgetVariance.profit > 0 ? 'up' : 'down'} 
                    subtext="Realizat"
                    color="text-emerald-600"
                />
            </div>

            {/* 2. Variance Breakdown Table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Scale size={20} className="text-gray-400"/> Variance Breakdown
                    </h3>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/80 dark:bg-gray-800 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Categorie</th>
                                <th className="px-6 py-4 text-right">Bugetat</th>
                                <th className="px-6 py-4 text-right">Actual</th>
                                <th className="px-6 py-4 text-right">Deviație</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {varianceItems.map((row, i) => {
                                const variance = row.actual - row.budget;
                                const variancePct = ((variance / row.budget) * 100).toFixed(1);
                                // Logic: For Income, Positive is Good. For Expense, Negative is Good.
                                // Assuming first 2 are income, rest expenses for simple logic
                                const isIncome = i < 2;
                                const isGood = isIncome ? variance >= 0 : variance <= 0;

                                return (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.category}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">{row.budget.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">{row.actual.toLocaleString()}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                                            {variance > 0 ? '+' : ''}{variance.toLocaleString()} <span className="text-[10px] opacity-70">({variance > 0 ? '+' : ''}{variancePct}%)</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                isGood 
                                                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20' 
                                                : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20'
                                            }`}>
                                                {isGood ? <CheckCircle size={10}/> : <XCircle size={10}/>}
                                                {isGood ? 'On Track' : 'Alert'}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Budget vs Actual Trendline */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-sm flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-400"/> Evoluție Buget vs Actual (Venituri)
                </h4>
                <SimpleLineChart 
                    data={budgetTrendData} 
                    lines={[
                        {key: 'actual', color: '#3b82f6'}, // Blue Solid
                        {key: 'budget', color: '#9ca3af', dash: '5 5'} // Gray Dashed
                    ]} 
                    height={250}
                />
                <div className="flex gap-6 mt-4 justify-center">
                    <span className="flex items-center text-xs font-bold text-gray-500"><span className="w-3 h-0.5 bg-blue-500 mr-2"></span> Actual</span>
                    <span className="flex items-center text-xs font-bold text-gray-500"><span className="w-3 h-0.5 border-t-2 border-dashed border-gray-400 mr-2"></span> Buget</span>
                </div>
            </div>

            {/* 4. Automated Insights */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-500"/> Key Insights
                </h4>
                <ul className="space-y-2">
                    <li className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                        Costurile cu <span className="font-bold text-gray-900 dark:text-white">Salariile</span> au crescut conform majorării salariului minim brut (4.050 RON).
                    </li>
                    <li className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                        Veniturile din <span className="font-bold text-gray-900 dark:text-white">Abonamente</span> au depășit planul cu <span className="text-green-600 font-bold">6.7%</span>.
                    </li>
                    <li className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="font-bold text-gray-900 dark:text-white">Profitul Net</span> este pozitiv (1.200 RON) în ciuda creșterii costurilor.
                    </li>
                </ul>
            </div>
        </div>
    );
};
