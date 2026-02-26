
import React from 'react';
import { SimpleLineChart } from '../components/FinanceShared';
import { FinancialSummary } from '../../../types';

export const TrendsView = ({ data }: { data: FinancialSummary }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm h-full">
        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Trenduri Financiare (6 Luni)</h3>
        <SimpleLineChart 
            data={data.trends} 
            lines={[
                {key: 'revenue', color: '#3b82f6'},
                {key: 'expenses', color: '#ef4444'},
                {key: 'profit', color: '#10b981'},
            ]} 
            height={300}
        />
        <div className="flex gap-6 mt-6 justify-center">
            <span className="flex items-center text-xs font-bold text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Venituri</span>
            <span className="flex items-center text-xs font-bold text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Cheltuieli</span>
            <span className="flex items-center text-xs font-bold text-gray-500"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Profit</span>
        </div>
    </div>
);
