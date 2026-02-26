
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const SimpleLineChart = ({ data, lines, height = 200 }: { data: any[], lines: { key: string, color: string, dash?: string }[], height?: number }) => {
    const maxVal = Math.max(...data.map(d => Math.max(...lines.map(l => d[l.key] || 0)))) * 1.1;
    const width = 100; // percent

    const getY = (val: number) => height - (val / maxVal) * height;
    const getX = (i: number) => (i / (data.length - 1)) * width;

    return (
        <div className="w-full relative" style={{ height: `${height}px` }}>
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => (
                    <line key={p} x1="0" y1={height * p} x2="100" y2={height * p} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" className="text-gray-400" />
                ))}
                
                {lines.map(line => {
                    const d = data.map((point, i) => 
                        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(point[line.key])}`
                    ).join(' ');
                    return (
                        <path 
                            key={line.key} 
                            d={d} 
                            fill="none" 
                            stroke={line.color} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeDasharray={line.dash}
                            vectorEffect="non-scaling-stroke" 
                        />
                    );
                })}
            </svg>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                {data.map((d: any, i: number) => <span key={i}>{d.month || d.label}</span>)}
            </div>
        </div>
    );
};

export const MetricCard = ({ label, value, trend, subtext, color = "text-gray-900" }: { label: string, value: string, trend?: 'up'|'down', subtext?: string, color?: string }) => (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full">
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <div className="flex items-center justify-between">
                <p className={`text-2xl font-black ${color} dark:text-white`}>{value}</p>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    </div>
);
