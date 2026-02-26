
import React from 'react';
import { FinancialSummary } from '../../../types';

export const BreakEvenView = ({ data }: { data: FinancialSummary }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Break-Even Abonați</p>
                <div className="flex items-center justify-center gap-4">
                    <div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{data.breakEven.subscribersTarget}</p>
                        <p className="text-[10px] text-gray-400">Target</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div>
                        <p className="text-3xl font-black text-blue-600">{data.breakEven.subscribersActual}</p>
                        <p className="text-[10px] text-gray-400">Actual</p>
                    </div>
                </div>
                <div className="mt-4 inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    +{data.breakEven.subscribersActual - data.breakEven.subscribersTarget} peste prag
                </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm text-center flex flex-col justify-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Venit Necesar (Lunar)</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{(data.costStructure.fixed + data.costStructure.variable).toLocaleString()} RON</p>
                <p className="text-xs text-gray-500 mt-1">Pentru acoperire totală costuri</p>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-bold text-red-600 uppercase">Pesimist</p>
                <p className="text-xl font-black mt-1">85 Abonați</p>
                <p className="text-[10px] text-red-500 opacity-80">-10 vs Target</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <p className="text-xs font-bold text-blue-600 uppercase">Realist</p>
                <p className="text-xl font-black mt-1">100 Abonați</p>
                <p className="text-[10px] text-blue-500 opacity-80">Base case</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30">
                <p className="text-xs font-bold text-green-600 uppercase">Optimist</p>
                <p className="text-xl font-black mt-1">130 Abonați</p>
                <p className="text-[10px] text-green-500 opacity-80">Target de creștere</p>
            </div>
        </div>
    </div>
);
