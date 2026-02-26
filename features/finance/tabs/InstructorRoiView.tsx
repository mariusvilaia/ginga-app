
import React from 'react';
import { Badge } from '../../../components/UIComponents';
import { FinancialSummary } from '../../../types';

export const InstructorRoiView = ({ data }: { data: FinancialSummary }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white">Performanță Financiară Instructori</h3>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold uppercase text-gray-500">
                <tr>
                    <th className="px-6 py-3">Instructor</th>
                    <th className="px-6 py-3 text-right">Cost Total</th>
                    <th className="px-6 py-3 text-right">Venit Generat</th>
                    <th className="px-6 py-3 text-right">ROI</th>
                    <th className="px-6 py-3 text-center">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.instructorRoi.sort((a: any, b: any) => b.roi - a.roi).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.name}</td>
                        <td className="px-6 py-4 text-right text-gray-500">{row.cost.toLocaleString()} RON</td>
                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">{row.revenueGenerated.toLocaleString()} RON</td>
                        <td className="px-6 py-4 text-right font-black">{row.roi}%</td>
                        <td className="px-6 py-4 text-center">
                            {row.roi > 200 ? <Badge color="bg-green-100 text-green-700">Top Performer</Badge> : 
                             row.roi > 100 ? <Badge color="bg-blue-100 text-blue-700">Profitabil</Badge> :
                             <Badge color="bg-red-100 text-red-700">Necesită Atenție</Badge>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
