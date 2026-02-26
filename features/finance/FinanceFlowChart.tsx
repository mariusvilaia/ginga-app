
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { User, Building2, Megaphone, Monitor, CreditCard, Briefcase, Ticket, Calendar, Maximize, Minimize } from 'lucide-react';
import { FinancialSummary } from '../../types';
import { useData } from '../../contexts/DataContext';

interface FinanceFlowChartProps {
    data: FinancialSummary;
    multiplier: number;
}

export const FinanceFlowChart: React.FC<FinanceFlowChartProps> = ({ data, multiplier }) => {
    const { instructors } = useData(); // Use Live Instructors

    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeNode, setActiveNode] = useState<string | null>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    
    // --- LAYOUT CONFIGURATION ---
    const WIDTH = 1300; 
    const HEIGHT = 850; 
    const PADDING_X = 20;
    const PADDING_Y = 40;
    const NODE_WIDTH = 160;
    const COLUMN_GAP = (WIDTH - (PADDING_X * 2) - (NODE_WIDTH * 5)) / 4; 

    // --- DATA PREPARATION ---

    // 1. INPUTS (Income Streams)
    const incomeNodes = data.incomeStreams.flatMap(stream => {
        if (stream.subCategories) {
            return stream.subCategories.map(sub => {
                let color = 'bg-blue-400 border-blue-500';
                let fill = 'fill-blue-300 dark:fill-blue-400';
                let stroke = 'stroke-blue-400';
                let icon = CreditCard;

                if (stream.name.includes('Drop')) {
                    color = 'bg-cyan-400 border-cyan-500';
                    fill = 'fill-cyan-300 dark:fill-cyan-400';
                    stroke = 'stroke-cyan-400';
                    icon = Ticket;
                } else if (stream.name.includes('Evenimente')) {
                    color = 'bg-violet-400 border-violet-500';
                    fill = 'fill-violet-300 dark:fill-violet-400';
                    stroke = 'stroke-violet-400';
                    icon = Calendar;
                } else if (sub.name.includes('Gold')) {
                    color = 'bg-yellow-400 border-yellow-500';
                    fill = 'fill-yellow-300 dark:fill-yellow-400';
                    stroke = 'stroke-yellow-400';
                } else if (sub.name.includes('Silver')) {
                    color = 'bg-slate-400 border-slate-500';
                    fill = 'fill-slate-300 dark:fill-slate-400';
                    stroke = 'stroke-slate-400';
                } else if (sub.name.includes('Bronze')) {
                    color = 'bg-orange-400 border-orange-500';
                    fill = 'fill-orange-300 dark:fill-orange-400';
                    stroke = 'stroke-orange-400';
                } else if (sub.name.includes('Platinum')) {
                    color = 'bg-indigo-400 border-indigo-500';
                    fill = 'fill-indigo-300 dark:fill-indigo-400';
                    stroke = 'stroke-indigo-400';
                }

                return {
                    id: sub.name,
                    label: `${sub.name} (704)`,
                    subLabel: stream.name,
                    value: sub.amount,
                    color,
                    fill,
                    stroke,
                    icon
                };
            });
        }
        return [];
    }).sort((a, b) => b.value - a.value);

    // 2. AGGREGATES
    const totalRevenue = data.revenue;
    const grossProfit = data.grossProfit;
    const operatingProfit = data.operatingProfit;
    const taxes = data.taxes;
    const netIncome = data.netIncome;

    // 3. COGS NODES
    const cogsStream = data.expenseStreams.find(s => s.type === 'cogs');
    const totalInstructorBudget = cogsStream?.subCategories?.find(c => c.name.includes('Instructori'))?.amount || 0;
    
    // Normalize Instructor Data
    const rawInstructorTotal = instructors.reduce((acc, curr) => acc + (curr.contract?.totalToPay || 0), 0);
    const normalizationRatio = rawInstructorTotal > 0 ? (totalInstructorBudget / (rawInstructorTotal * multiplier)) : 1;

    const instructorNodes = instructors.map(inst => ({
        id: `cogs_inst_${inst.id}`,
        label: `${(inst.name || '').split(' ')[0]} (621)`,
        subLabel: 'Instructor',
        value: (inst.contract?.totalToPay || 0) * multiplier * normalizationRatio, 
        avatar: inst.avatarUrl,
        type: 'instructor',
        color: 'bg-rose-400 border-rose-500',
        fill: 'fill-rose-300 dark:fill-rose-400',
        stroke: 'stroke-rose-400'
    })).filter(n => n.value > 0).sort((a, b) => b.value - a.value);

    const rentNodes = [
        { id: 'cogs_rent_1', label: 'Mille 18 (612)', subLabel: 'Chirie Sală', value: 7500 * multiplier, type: 'rent', color: 'bg-rose-500', fill: 'fill-rose-400', stroke: 'stroke-rose-500', avatar: undefined },
        { id: 'cogs_rent_2', label: 'Victoriei (612)', subLabel: 'Chirie Sală', value: 6850 * multiplier, type: 'rent', color: 'bg-rose-500', fill: 'fill-rose-400', stroke: 'stroke-rose-500', avatar: undefined }
    ].filter(n => n.value > 0);

    const allCogsNodes = [...instructorNodes, ...rentNodes].sort((a, b) => b.value - a.value);
    const totalCogs = allCogsNodes.reduce((acc, curr) => acc + curr.value, 0);

    // 4. OPEX NODES
    const marketingTotal = data.expenseStreams.find(s => s.id === 'exp_2')?.subCategories?.find(c => c.name.includes('Marketing'))?.amount || (3500 * multiplier);
    const softwareTotal = data.expenseStreams.find(s => s.id === 'exp_2')?.subCategories?.find(c => c.name.includes('Software'))?.amount || (1200 * multiplier);
    const salaryTotal = data.expenseStreams.find(s => s.id === 'exp_2')?.subCategories?.find(c => c.name.includes('Salarii'))?.amount || (4050 * multiplier);
    const otherTotal = Math.max(0, data.expenses - marketingTotal - softwareTotal - salaryTotal);

    const opexNodes = [
        { id: 'opex_fb', label: 'Meta Ads (623)', subLabel: 'Marketing', value: Math.round(marketingTotal * 0.6), icon: Megaphone, color: 'bg-purple-400', fill: 'fill-purple-300', stroke: 'stroke-purple-400' },
        { id: 'opex_google', label: 'Google Ads (623)', subLabel: 'Marketing', value: Math.round(marketingTotal * 0.3), icon: Megaphone, color: 'bg-purple-400', fill: 'fill-purple-300', stroke: 'stroke-purple-400' },
        { id: 'opex_admin1', label: 'Ana M. (641)', subLabel: 'Salariu Brut', value: salaryTotal, icon: User, color: 'bg-indigo-400', fill: 'fill-indigo-300', stroke: 'stroke-indigo-400' },
        { id: 'opex_stripe', label: 'Stripe (628)', subLabel: 'Procesare', value: Math.round(softwareTotal * 0.5), icon: CreditCard, color: 'bg-cyan-400', fill: 'fill-cyan-300', stroke: 'stroke-cyan-400' },
        { id: 'opex_smartbill', label: 'SmartBill (628)', subLabel: 'Facturare', value: Math.round(softwareTotal * 0.3), icon: Monitor, color: 'bg-cyan-400', fill: 'fill-cyan-300', stroke: 'stroke-cyan-400' },
        { id: 'opex_misc', label: 'Diverse (602)', subLabel: 'Consumabile', value: otherTotal, icon: Briefcase, color: 'bg-gray-400', fill: 'fill-gray-300', stroke: 'stroke-gray-400' }
    ].filter(n => n.value > 50).sort((a, b) => b.value - a.value);
    
    const totalOpex = opexNodes.reduce((acc, curr) => acc + curr.value, 0);

    // --- SCALE CALCULATION ---
    // Ensure scale fits the tallest column (Revenue vs COGS+Profit vs OpEx+OpProfit)
    // We treat negative profit as positive height for layout spacing
    const maxColumnHeight = Math.max(
        totalRevenue, 
        totalCogs + Math.abs(grossProfit) + 1000, 
        totalOpex + Math.abs(operatingProfit) + Math.abs(grossProfit) + 1000
    );
    const scale = (HEIGHT - (PADDING_Y * 2)) / (maxColumnHeight * 1.05);
    
    const fmt = (val: number) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 0 }).format(val);
    const pct = (val: number, total: number) => `${Math.round((val / total) * 100)}%`;

    // --- NODE POSITIONS ---
    // KEY CHANGE: Stack Expenses FIRST (Top), then Profit/Loss (Bottom)
    
    // COL 1: Income Sources
    let currentY = PADDING_Y;
    const sourceNodesCoords = incomeNodes.map(node => {
        const h = Math.max(node.value * scale, 30);
        const y = currentY;
        currentY += h + 8;
        return { ...node, x: PADDING_X, y, h, w: NODE_WIDTH };
    });

    // COL 2: Revenue
    const revenueNode = {
        id: 'node_revenue',
        x: PADDING_X + NODE_WIDTH + COLUMN_GAP,
        y: PADDING_Y,
        h: Math.max(totalRevenue * scale, 40),
        w: NODE_WIDTH,
        value: totalRevenue,
        label: 'Venit Total (704)',
        color: 'bg-blue-500',
        stroke: 'stroke-blue-500'
    };

    // COL 3: COGS + Gross Profit
    let col3Y = PADDING_Y;
    // 3a. COGS Nodes (Stacked Top)
    const cogsNodesCoords = allCogsNodes.map(node => {
        const h = Math.max(node.value * scale, 30);
        const y = col3Y;
        col3Y += h + 10;
        return { ...node, x: revenueNode.x + NODE_WIDTH + COLUMN_GAP, y, h, w: NODE_WIDTH };
    });
    
    // 3b. Gross Profit Node (Stacked Below COGS)
    const grossProfitNode = {
        id: 'node_gross',
        x: revenueNode.x + NODE_WIDTH + COLUMN_GAP,
        y: col3Y + 30, // Spacing from COGS
        h: Math.max(Math.abs(grossProfit) * scale, 40),
        w: NODE_WIDTH,
        value: grossProfit,
        label: grossProfit >= 0 ? 'Profit Brut (121)' : 'Pierdere Brută (121)',
        color: grossProfit >= 0 ? 'bg-teal-400' : 'bg-red-500',
        stroke: grossProfit >= 0 ? 'stroke-teal-400' : 'stroke-red-500'
    };

    // COL 4: OpEx + Operating Profit
    let col4Y = PADDING_Y;
    // 4a. OpEx Nodes (Stacked Top)
    const opexNodesCoords = opexNodes.map(node => {
        const h = Math.max(node.value * scale, 30);
        const y = col4Y;
        col4Y += h + 10;
        return { ...node, x: grossProfitNode.x + NODE_WIDTH + COLUMN_GAP, y, h, w: NODE_WIDTH };
    });

    // 4b. Operating Profit Node (Stacked Below OpEx)
    const operatingProfitNode = {
        id: 'node_op',
        x: grossProfitNode.x + NODE_WIDTH + COLUMN_GAP,
        y: col4Y + 30,
        h: Math.max(Math.abs(operatingProfit) * scale, 40),
        w: NODE_WIDTH,
        value: operatingProfit,
        label: operatingProfit >= 0 ? 'Profit Op. (121)' : 'Pierdere Op. (121)',
        color: operatingProfit >= 0 ? 'bg-blue-400' : 'bg-red-500',
        stroke: operatingProfit >= 0 ? 'stroke-blue-400' : 'stroke-red-500'
    };

    // COL 5: Taxes + Net Income
    let col5Y = PADDING_Y;
    // 5a. Taxes (Only if profit > 0 usually, but we stack it top)
    const taxesNode = {
        id: 'node_tax',
        x: operatingProfitNode.x + NODE_WIDTH + COLUMN_GAP,
        y: col5Y,
        h: Math.max(Math.abs(taxes) * scale, 30),
        w: NODE_WIDTH,
        value: taxes,
        label: 'Taxe (446)',
        color: 'bg-gray-400',
        stroke: 'stroke-gray-400'
    };
    if (taxes > 0) col5Y += taxesNode.h + 20;

    // 5b. Net Income
    const netIncomeNode = {
        id: 'node_net',
        x: operatingProfitNode.x + NODE_WIDTH + COLUMN_GAP,
        y: col5Y,
        h: Math.max(Math.abs(netIncome) * scale, 60),
        w: NODE_WIDTH,
        value: netIncome,
        label: netIncome >= 0 ? 'Profit Net (121)' : 'Pierdere Netă (121)',
        color: netIncome >= 0 ? 'bg-green-400' : 'bg-red-500',
        stroke: netIncome >= 0 ? 'stroke-green-400' : 'stroke-red-500'
    };

    // --- SVG PATH GENERATION ---
    const drawLink = (sourceId: string, targetId: string, x1: number, y1: number, x2: number, y2: number, height: number, colorClass: string) => {
        const cp1x = x1 + (x2 - x1) / 2;
        const cp2x = x2 - (x2 - x1) / 2;
        const h = Math.max(height, 2);
        
        const isRelated = activeNode 
            ? (activeNode === sourceId || activeNode === targetId)
            : true;

        const opacity = activeNode 
            ? (isRelated ? 0.8 : 0.1) 
            : 0.4;

        const path = `
            M ${x1} ${y1}
            L ${x1} ${y1 + h}
            C ${cp1x} ${y1 + h}, ${cp2x} ${y2 + h}, ${x2} ${y2 + h}
            L ${x2} ${y2}
            C ${cp2x} ${y2}, ${cp1x} ${y1}, ${x1} ${y1}
            Z
        `;
        
        return (
            <path 
                d={path} 
                className={`${colorClass} transition-all duration-300 cursor-pointer flow-link`} 
                fillOpacity={opacity}
                onMouseEnter={() => setActiveNode(sourceId)} 
                onMouseLeave={() => setActiveNode(null)}
            />
        );
    };

    const getRoiBadge = (instructorId: string) => {
        const instructor = instructors.find(i => `cogs_inst_${i.id}` === instructorId);
        if (!instructor) return null;
        
        const roiData = data.instructorRoi.find(r => r.name === instructor.name);
        if (!roiData) return null;

        return (
            <div className={`absolute -right-3 -top-2 px-1.5 py-0.5 rounded text-[8px] font-bold border shadow-sm z-10 ${
                roiData.roi > 150 ? 'bg-green-100 text-green-700 border-green-200' : 
                roiData.roi < 100 ? 'bg-red-100 text-red-700 border-red-200' : 
                'bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}>
                ROI: {roiData.roi}%
            </div>
        );
    };

    return (
        <div ref={containerRef} className="w-full h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 overflow-x-auto">
            <style>{`
                .flow-link {
                    animation: dash 1.5s ease-out forwards;
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                }
                @keyframes dash { to { stroke-dashoffset: 0; } }
                .node-enter {
                    animation: fadeUp 0.8s ease-out forwards;
                    opacity: 0;
                    transform: translateY(10px);
                }
                @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
            `}</style>
            
            <div className="min-w-[1300px] h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Analiză Flux Financiar (Sankey)
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded">Live Data</span>
                        </h3>
                        <p className="text-xs text-gray-500">Venituri → Profit Brut → Profit Operațional → Profit Net</p>
                    </div>
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
                
                <div className="relative flex-1">
                    <svg width={WIDTH} height={Math.max(HEIGHT, col4Y + 100)} className="w-full h-full">
                        
                        {/* 1. SOURCES -> REVENUE */}
                        {sourceNodesCoords.map((src, i) => {
                            // Align flow to stack neatly into Revenue Node Top
                            const prevHeights = sourceNodesCoords.slice(0, i).reduce((acc, curr) => acc + (curr.value * scale), 0);
                            const targetY = revenueNode.y + prevHeights;
                            return <g key={src.id}>{drawLink(src.id, revenueNode.id, src.x + src.w, src.y, revenueNode.x, targetY, src.value * scale, src.fill)}</g>;
                        })}

                        {/* 2. REVENUE -> COGS (Expenses First Logic) */}
                        {cogsNodesCoords.map((node, i) => {
                            // Stack these links starting from top of Revenue
                            const prevCogsHeight = cogsNodesCoords.slice(0, i).reduce((acc, curr) => acc + (curr.value * scale), 0);
                            const startY = revenueNode.y + prevCogsHeight;
                            
                            // If Revenue is less than COGS, we clamp the source height to available revenue (visual only)
                            const linkHeight = Math.min(node.value * scale, Math.max(0, revenueNode.h - prevCogsHeight));
                            
                            if (linkHeight > 0) {
                                return <g key={`link_${node.id}`}>{drawLink(revenueNode.id, node.id, revenueNode.x + revenueNode.w, startY, node.x, node.y, linkHeight, node.fill)}</g>;
                            }
                            return null;
                        })}

                        {/* 3. REVENUE -> GROSS PROFIT (Only if positive) */}
                        {grossProfit > 0 && (
                            drawLink(
                                revenueNode.id, grossProfitNode.id,
                                revenueNode.x + revenueNode.w, revenueNode.y + (totalCogs * scale),
                                grossProfitNode.x, grossProfitNode.y,
                                grossProfitNode.h, 'fill-teal-300 dark:fill-teal-500'
                            )
                        )}

                        {/* 4. GROSS PROFIT -> OPEX */}
                        {grossProfit > 0 && opexNodesCoords.map((node, i) => {
                            const prevOpexHeight = opexNodesCoords.slice(0, i).reduce((acc, curr) => acc + (curr.value * scale), 0);
                            const startY = grossProfitNode.y + prevOpexHeight;
                            return <g key={`link_${node.id}`}>{drawLink(grossProfitNode.id, node.id, grossProfitNode.x + grossProfitNode.w, startY, node.x, node.y, node.value * scale, node.fill)}</g>;
                        })}

                        {/* 5. GROSS PROFIT -> OPERATING PROFIT (Only if positive) */}
                        {operatingProfit > 0 && grossProfit > 0 && (
                            drawLink(
                                grossProfitNode.id, operatingProfitNode.id,
                                grossProfitNode.x + grossProfitNode.w, grossProfitNode.y + (totalOpex * scale),
                                operatingProfitNode.x, operatingProfitNode.y,
                                operatingProfitNode.h, 'fill-blue-300 dark:fill-blue-500'
                            )
                        )}

                        {/* 6. OP PROFIT -> TAXES & NET INCOME */}
                        {operatingProfit > 0 && (
                            <>
                                {taxes > 0 && drawLink(
                                    operatingProfitNode.id, taxesNode.id,
                                    operatingProfitNode.x + operatingProfitNode.w, operatingProfitNode.y,
                                    taxesNode.x, taxesNode.y,
                                    taxesNode.h, 'fill-gray-300 dark:fill-gray-500'
                                )}
                                {netIncome > 0 && drawLink(
                                    operatingProfitNode.id, netIncomeNode.id,
                                    operatingProfitNode.x + operatingProfitNode.w, operatingProfitNode.y + (taxesNode.value > 0 ? taxesNode.h : 0),
                                    netIncomeNode.x, netIncomeNode.y,
                                    netIncomeNode.h, 'fill-green-300 dark:fill-green-500'
                                )}
                            </>
                        )}

                    </svg>

                    {/* --- NODES --- */}
                    
                    {/* Sources */}
                    {sourceNodesCoords.map((node, i) => (
                        <div key={node.id} className={`absolute flex items-center px-3 border-l-4 shadow-sm rounded-r-lg group ${node.color} bg-white dark:bg-gray-800 node-enter`} style={{ left: node.x, top: node.y, width: node.w, height: node.h, animationDelay: `${i * 50}ms` }} onMouseEnter={() => setActiveNode(node.id)} onMouseLeave={() => setActiveNode(null)}>
                            <div className="p-1 rounded bg-gray-100 dark:bg-gray-700 mr-2 shrink-0"><node.icon size={12}/></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{node.label}</p>
                                <p className="text-[9px] font-medium truncate">{fmt(node.value)}</p>
                            </div>
                        </div>
                    ))}

                    {/* Revenue */}
                    <div className={`absolute flex flex-col items-center justify-center bg-blue-500 text-white shadow-lg rounded-xl z-10 node-enter ${activeNode && activeNode !== revenueNode.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: revenueNode.x, top: revenueNode.y, width: revenueNode.w, height: revenueNode.h, animationDelay: '300ms' }} onMouseEnter={() => setActiveNode(revenueNode.id)} onMouseLeave={() => setActiveNode(null)}>
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">{revenueNode.label}</p>
                        <p className="text-xl font-black">{fmt(revenueNode.value)}</p>
                    </div>

                    {/* COGS Nodes */}
                    {cogsNodesCoords.map((node, i) => (
                        <div key={node.id} className={`absolute flex items-center px-3 border-l-4 bg-white dark:bg-gray-800 shadow-sm rounded-r-lg ${node.color} node-enter cursor-pointer ${activeNode && activeNode !== node.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: node.x, top: node.y, width: node.w, height: node.h, animationDelay: `${500 + i * 50}ms` }} onMouseEnter={() => setActiveNode(node.id)} onMouseLeave={() => setActiveNode(null)}>
                            {node.avatar ? <img src={node.avatar} className="w-6 h-6 rounded-full mr-2"/> : <div className="p-1 rounded bg-gray-100 mr-2"><Building2 size={12}/></div>}
                            <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{node.label}</p><p className="text-[9px] font-medium truncate">{fmt(node.value)}</p></div>
                            {node.id.includes('inst') && getRoiBadge(node.id)}
                        </div>
                    ))}

                    {/* Gross Profit */}
                    <div className={`absolute flex flex-col items-center justify-center text-white shadow-lg rounded-xl z-10 node-enter ${grossProfitNode.color} ${activeNode && activeNode !== grossProfitNode.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: grossProfitNode.x, top: grossProfitNode.y, width: grossProfitNode.w, height: grossProfitNode.h, animationDelay: '600ms' }} onMouseEnter={() => setActiveNode(grossProfitNode.id)} onMouseLeave={() => setActiveNode(null)}>
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">{grossProfitNode.label}</p>
                        <p className="text-lg font-black">{fmt(Math.abs(grossProfitNode.value))}</p>
                    </div>

                    {/* OpEx Nodes */}
                    {opexNodesCoords.map((node, i) => (
                        <div key={node.id} className={`absolute flex items-center px-3 border-l-4 bg-white dark:bg-gray-800 shadow-sm rounded-r-lg ${node.color} node-enter cursor-pointer ${activeNode && activeNode !== node.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: node.x, top: node.y, width: node.w, height: node.h, animationDelay: `${700 + i * 50}ms` }} onMouseEnter={() => setActiveNode(node.id)} onMouseLeave={() => setActiveNode(null)}>
                            <div className="p-1 rounded bg-gray-100 mr-2"><node.icon size={12}/></div>
                            <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{node.label}</p><p className="text-[9px] font-medium truncate">{fmt(node.value)}</p></div>
                        </div>
                    ))}

                    {/* Operating Profit */}
                    <div className={`absolute flex flex-col items-center justify-center text-white shadow-lg rounded-xl z-10 node-enter ${operatingProfitNode.color} ${activeNode && activeNode !== operatingProfitNode.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: operatingProfitNode.x, top: operatingProfitNode.y, width: operatingProfitNode.w, height: operatingProfitNode.h, animationDelay: '800ms' }} onMouseEnter={() => setActiveNode(operatingProfitNode.id)} onMouseLeave={() => setActiveNode(null)}>
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">{operatingProfitNode.label}</p>
                        <p className="text-lg font-black">{fmt(Math.abs(operatingProfitNode.value))}</p>
                    </div>

                    {/* Taxes */}
                    {taxes > 0 && (
                        <div className={`absolute flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm rounded-xl z-10 border border-gray-200 dark:border-gray-700 node-enter ${activeNode && activeNode !== taxesNode.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: taxesNode.x, top: taxesNode.y, width: taxesNode.w, height: taxesNode.h, animationDelay: '850ms' }} onMouseEnter={() => setActiveNode(taxesNode.id)} onMouseLeave={() => setActiveNode(null)}>
                            <p className="text-[10px] font-bold uppercase mb-1">{taxesNode.label}</p>
                            <p className="text-sm font-black">{fmt(taxesNode.value)}</p>
                        </div>
                    )}

                    {/* Net Income */}
                    <div className={`absolute flex flex-col items-center justify-center text-white shadow-xl rounded-xl z-20 node-enter ${netIncomeNode.color} ${activeNode && activeNode !== netIncomeNode.id ? 'opacity-30' : 'opacity-100'}`} style={{ left: netIncomeNode.x, top: netIncomeNode.y, width: netIncomeNode.w, height: netIncomeNode.h, animationDelay: '900ms' }} onMouseEnter={() => setActiveNode(netIncomeNode.id)} onMouseLeave={() => setActiveNode(null)}>
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">{netIncomeNode.label}</p>
                        <p className="text-2xl font-black">{fmt(Math.abs(netIncomeNode.value))}</p>
                        <span className="text-[10px] bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded mt-1">Marjă: {pct(netIncomeNode.value, totalRevenue)}</span>
                    </div>

                </div>
            </div>
        </div>
    );
};
