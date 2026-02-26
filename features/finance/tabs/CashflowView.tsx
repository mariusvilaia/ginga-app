
import React from 'react';
import { MetricCard, SimpleLineChart } from '../components/FinanceShared';
import { FinancialSummary } from '../../../types';

export const CashflowView = ({ data }: { data: FinancialSummary }) => {
    const mockFlow = Array.from({length: 10}, (_, i) => ({
        label: `Z${i*3+1}`,
        inflow: 1000 + Math.random() * 500,
        outflow: 800 + Math.random() * 400
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <MetricCard label="Sold Conturi" value={data.cashflowForecast.currentBalance.toLocaleString() + " RON"} subtext="Disponibil azi" />
                <MetricCard label="Flux Estimat (30z)" value={`+${(data.cashflowForecast.estimatedInflow30d - data.cashflowForecast.recurringOutflow30d).toLocaleString()}`} subtext="Net estimat" color="text-green-600" />
                <MetricCard label="Cash Runway" value={`${data.cashflowForecast.runwayDays} Zile`} subtext="La rata actuală" color="text-blue-600" />
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Previziune Intrări vs Ieșiri (30 Zile)</h4>
                <SimpleLineChart 
                    data={mockFlow} 
                    lines={[{key: 'inflow', color: '#10b981'}, {key: 'outflow', color: '#ef4444'}]} 
                />
            </div>
        </div>
    );
};
