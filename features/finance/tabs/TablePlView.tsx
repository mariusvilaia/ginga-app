
import React from 'react';
import { FileText } from 'lucide-react';
import { FinancialSummary } from '../../../types';

export const TablePlView = ({ data }: { data: FinancialSummary }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(val);

    const incomeStreams = data.incomeStreams;
    
    // Extract subcategories for COGS and OPEX to display them as top-level rows in the table sections
    const cogsStream = data.expenseStreams.find(s => s.type === 'cogs');
    const cogsItems = cogsStream?.subCategories || [];
    
    const opexStream = data.expenseStreams.find(s => s.type === 'expense');
    const opexItems = opexStream?.subCategories || [];

    // Helper to sort OPEX by Account Code
    const getAccountCode = (name: string): number => {
        if (name.includes('Consumabile')) return 602;
        if (name.includes('Marketing')) return 623;
        if (name.includes('Software')) return 628;
        if (name.includes('Salarii')) return 641;
        return 999;
    };

    const sortedOpexItems = [...opexItems].sort((a, b) => getAccountCode(a.name) - getAccountCode(b.name));

    const renderRow = (label: string, amount: number, subItems?: {name: string, amount: number}[]) => (
        <div key={label}>
            <div className="flex justify-between items-center mb-1 py-1">
                <span className="font-bold text-gray-900 dark:text-white text-sm">{label} <span className="text-gray-400 text-xs font-normal ml-1">{getAccountCode(label) !== 999 ? `(${getAccountCode(label)})` : ''}</span></span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(amount)}</span>
            </div>
            {subItems && subItems.length > 0 && (
                <div className="pl-4 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 ml-1 mb-3">
                    {subItems.map((sub, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-gray-500">
                            <span>{sub.name}</span>
                            <span>{formatCurrency(sub.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-gray-400"/> Statement Detaliat
                </h3>
                <button className="text-xs font-bold text-blue-600 hover:underline">Vezi Detalii</button>
            </div>
            <div className="p-6">
                
                {/* --- REVENUE SECTION --- */}
                <div className="mb-6">
                    <div className="flex justify-between items-center px-4 py-3 rounded-lg mb-4 bg-gray-100 dark:bg-gray-800">
                        <h4 className="font-black text-xs uppercase tracking-wider text-gray-900 dark:text-white">VENITURI (REVENUE)</h4>
                        <span className="font-black text-sm text-gray-900 dark:text-white">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="space-y-2 px-2">
                        {incomeStreams.map(stream => renderRow(stream.name, stream.amount, stream.subCategories))}
                    </div>
                </div>

                {/* --- COGS SECTION --- */}
                <div className="mb-6">
                    <div className="flex justify-between items-center px-4 py-3 rounded-lg mb-4 bg-red-50 dark:bg-red-900/20">
                        <h4 className="font-black text-xs uppercase tracking-wider text-red-700 dark:text-red-400">COST OF GOODS SOLD (COGS)</h4>
                        <span className="font-black text-sm text-red-700 dark:text-red-400">({formatCurrency(data.cogs)})</span>
                    </div>
                    <div className="space-y-2 px-2">
                        {cogsItems.map(item => renderRow(item.name, item.amount))}
                    </div>
                </div>

                {/* --- GROSS PROFIT --- */}
                <div className="flex justify-between items-center px-4 py-3 mb-6 border-t border-b border-gray-100 dark:border-gray-800">
                    <h4 className="font-black text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400">PROFIT BRUT</h4>
                    <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(data.grossProfit)}</span>
                </div>

                {/* --- OPEX SECTION --- */}
                <div className="mb-6">
                    <div className="flex justify-between items-center px-4 py-3 rounded-lg mb-4 bg-orange-50 dark:bg-orange-900/20">
                        <h4 className="font-black text-xs uppercase tracking-wider text-orange-700 dark:text-orange-400">CHELTUIELI OPERAȚIONALE (OPEX)</h4>
                        <span className="font-black text-sm text-orange-700 dark:text-orange-400">({formatCurrency(data.expenses)})</span>
                    </div>
                    <div className="space-y-2 px-2">
                        {sortedOpexItems.map(item => renderRow(item.name, item.amount))}
                    </div>
                </div>

                {/* --- NET PROFIT --- */}
                <div className="flex justify-between items-center px-6 py-4 bg-gray-900 dark:bg-white rounded-xl shadow-lg mt-8">
                    <h4 className="font-black text-sm uppercase tracking-wider text-white dark:text-gray-900">PROFIT NET</h4>
                    <span className="font-black text-xl text-white dark:text-gray-900">{formatCurrency(data.netIncome)}</span>
                </div>

            </div>
        </div>
    );
};
