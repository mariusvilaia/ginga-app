
import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { FinancialSummary } from '../../../types';

export const RiskView = ({ data }: { data: FinancialSummary }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={20}/></div>
            <h3 className="font-bold text-gray-900 dark:text-white">Analiză Risc & Alerte</h3>
        </div>
        
        <div className="space-y-4">
            {data.alerts.map((alert: string, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5"/>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{alert}</p>
                        <p className="text-xs text-red-600/80 mt-1">Acțiune recomandată: Verifică detaliile și contactează responsabilul.</p>
                    </div>
                </div>
            ))}
            {data.subscriptionHealth.churnRate > 5 && (
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                    <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5"/>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Churn Rate Ridicat ({data.subscriptionHealth.churnRate}%)</p>
                        <p className="text-xs text-orange-600/80 mt-1">Depășește pragul de alertă de 5%. Inițiază campanie de retenție.</p>
                    </div>
                </div>
            )}
        </div>
    </div>
);
