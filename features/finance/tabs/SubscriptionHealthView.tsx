
import React from 'react';
import { MetricCard, SimpleLineChart } from '../components/FinanceShared';
import { FinancialSummary } from '../../../types';

export const SubscriptionHealthView = ({ data }: { data: FinancialSummary }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
            <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Abonamente Active</p>
            <h2 className="text-5xl font-black">{data.subscriptionHealth.activeTotal}</h2>
            <div className="flex gap-6 mt-4 opacity-90">
                <span><span className="font-bold text-green-300">+{data.subscriptionHealth.newSubs30d}</span> Noi (30z)</span>
                <span>•</span>
                <span><span className="font-bold text-red-300">{data.subscriptionHealth.churnRate}%</span> Churn Rate</span>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Renewal Rate" value={`${data.subscriptionHealth.renewalRate}%`} trend="up" />
            <MetricCard label="ARPU" value="285 RON" subtext="Venit mediu" />
            <MetricCard label="LTV Estimat" value="2,450 RON" subtext="Lifetime Value" />
            <MetricCard label="Conversie" value="42%" trend="down" />
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Trend Abonați Activi (6 Luni)</h4>
            <SimpleLineChart 
                data={data.trends} 
                lines={[{key: 'subscribers', color: '#6366f1'}]} 
                height={150}
            />
        </div>
    </div>
);
