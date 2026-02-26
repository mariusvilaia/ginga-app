
import React from 'react';
import { FinancialSummary } from '../../../types';

export const CostStructureView = ({ data }: { data: FinancialSummary }) => {
    const total = data.costStructure.fixed + data.costStructure.variable;
    const fixedPct = Math.round((data.costStructure.fixed / total) * 100);
    const varPct = 100 - fixedPct;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                    <p className="text-xs font-bold text-orange-600 uppercase mb-2">Costuri Fixe</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{data.costStructure.fixed.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Chirie, Salarii, Software</p>
                </div>
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-2">Costuri Variabile</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{data.costStructure.variable.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Comisioane, Instructori</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Raport Fix vs Variabil</h4>
                <div className="h-4 w-full rounded-full flex overflow-hidden mb-2">
                    <div className="h-full bg-orange-500" style={{ width: `${fixedPct}%` }}></div>
                    <div className="h-full bg-blue-500" style={{ width: `${varPct}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-orange-600">{fixedPct}% Fixe</span>
                    <span className="text-blue-600">{varPct}% Variabile</span>
                </div>
            </div>
        </div>
    );
};
