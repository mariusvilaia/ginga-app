
import React, { useMemo } from 'react';
import { 
    Users, TrendingUp, TrendingDown, Star, DollarSign, Wallet, 
    AlertTriangle, CheckCircle, Lightbulb, ArrowUpRight, ArrowDownRight,
    MessageCircle, Calendar, Plus, UserPlus, Info, ChevronRight,
    BarChart3, Activity, Target, LayoutGrid
} from 'lucide-react';
import { 
    InstructorProfile, InstructorMetrics, GroupSummary, SkillLevel, DanceStyle 
} from '../../../types';
import { Badge, Button } from '../../../components/UIComponents';
import { 
    LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip 
} from 'recharts';

interface InstructorManagerGeneralTabProps {
    instructor: InstructorProfile;
    onAction?: (action: string, data?: any) => void;
}

export const InstructorManagerGeneralTab: React.FC<InstructorManagerGeneralTabProps> = ({ instructor, onAction }) => {
    
    // 1. MOCK DATA GENERATION (if missing)
    const metrics: InstructorMetrics = useMemo(() => {
        if (instructor.managerMetrics) return instructor.managerMetrics;
        
        const schoolAverages = {
            ratingAvg: 4.7,
            retentionPct: 82,
            newStudents30d: 5,
            revenueMonth: 4500,
            profitMonth: 2800
        };

        const activeStudents = 42;
        const totalCapacity = 60;
        const occupancyPct = Math.round((activeStudents / totalCapacity) * 100);

        // Score calculation
        const normalizedProfit = Math.min(100, (3600 / 4000) * 100);
        const retention = 85;
        const rating = 4.8 * 20; // normalize 5 to 100
        const growth = 20; // mock growth score
        
        const score = Math.round(
            (0.35 * normalizedProfit) + 
            (0.25 * retention) + 
            (0.20 * rating) + 
            (0.20 * growth)
        );

        return {
            ratingAvg: instructor.kpi?.averageRating || 4.8,
            ratingTrend: [4.5, 4.6, 4.8, 4.7, 4.8, 4.9],
            ratingDelta: 0.2,
            
            retentionPct: instructor.kpi?.retentionRate || 85,
            retentionTrend: [78, 80, 82, 85, 84, 85],
            retentionDelta: 3,
            
            punctualityPct: instructor.kpi?.punctuality || 98,
            punctualityTrend: [95, 96, 98, 97, 99, 98],
            
            activeStudents,
            activeStudentsTrend: [30, 32, 35, 38, 40, 42],
            activeStudentsDelta: 5,
            
            newStudents30d: instructor.kpi?.newStudentsThisMonth || 6,
            newStudentsTrend: [2, 4, 3, 5, 4, 6],
            newStudentsDelta: 2,

            lostStudents30d: 2,
            lostStudentsDelta: -1,
            
            revenueMonth: 5200,
            revenueTrend: [3800, 4100, 4400, 4800, 5000, 5200],
            revenueDelta: 400,
            
            costMonth: instructor.contract?.hourlyRate * 40 || 1600,
            costTrend: [1200, 1400, 1400, 1600, 1600, 1600],
            
            profitMonth: 3600,
            profitTrend: [2600, 2700, 3000, 3200, 3400, 3600],
            profitDelta: 400,

            occupancyPct,
            instructorScore: score,
            instructorScoreLabel: score > 80 ? "Top 20% instructori" : "Peste media școlii",

            forecastStudents: 46,
            forecastRevenue: 5800,
            
            schoolAverages
        };
    }, [instructor]);

    const groups: GroupSummary[] = useMemo(() => {
        if (instructor.managerGroups) return instructor.managerGroups;
        
        return (instructor.groups || []).map((g, i) => {
            const studentsCount = g.students || 12;
            const studentsChange30d = i === 0 ? 3 : i === 1 ? -3 : 0;
            const retentionPct = i === 0 ? 92 : i === 1 ? 72 : 85;
            const capacity = 15;
            const occupancyPct = Math.round((studentsCount / capacity) * 100);
            
            // Rules for status
            let statusComputed: 'Growing' | 'Stable' | 'Declining' = 'Stable';
            if (studentsChange30d >= 2) statusComputed = 'Growing';
            else if (studentsChange30d <= -2 || retentionPct < (metrics.schoolAverages.retentionPct - 8)) statusComputed = 'Declining';
            
            // Rules for risk
            const riskComputed = statusComputed === 'Declining' || (i === 1);
            
            // Rules for opportunity
            const opportunityComputed = occupancyPct >= 85 || (studentsChange30d >= 4);

            return {
                id: `g-${i}`,
                name: g.name,
                level: SkillLevel.BEGINNER,
                studentsCount,
                studentsChange30d,
                dropouts30d: i === 1 ? 4 : 1,
                retentionPct,
                capacity,
                occupancyPct,
                trendStudentsByMonth: [8, 9, 10, 11, 12, studentsCount],
                revenueMonth: studentsCount * 250,
                statusComputed,
                riskComputed,
                opportunityComputed
            };
        });
    }, [instructor, metrics]);

    // 2. ALERTS LOGIC
    const alerts = useMemo(() => {
        const list = [];
        groups.filter(g => g.riskComputed).forEach(g => {
            list.push({
                type: 'Critical',
                title: `Risc de abandon: ${g.name}`,
                description: `Retenția a scăzut la ${g.retentionPct}% și grupa este în declin (-${Math.abs(g.studentsChange30d)} elevi).`,
                icon: <AlertTriangle className="text-red-500" size={18} />
            });
        });
        if (metrics.ratingDelta < 0) {
            list.push({
                type: 'Warning',
                title: 'Scădere Rating',
                description: `Rating-ul mediu a scăzut cu ${Math.abs(metrics.ratingDelta)} puncte față de luna trecută.`,
                icon: <Star className="text-amber-500" size={18} />
            });
        }
        groups.filter(g => g.opportunityComputed).forEach(g => {
            list.push({
                type: 'Opportunity',
                title: `Oportunitate extindere: ${g.name}`,
                description: `Grad de ocupare ${g.occupancyPct}% (${g.studentsCount}/${g.capacity}). Consideră deschiderea unei grupe noi de nivel următor.`,
                icon: <Lightbulb className="text-emerald-500" size={18} />
            });
        });
        return list;
    }, [groups, metrics]);

    // 3. INSIGHTS LOGIC
    const insights = useMemo(() => {
        const list = [];
        const growing = groups.find(g => g.statusComputed === 'Growing');
        const declining = groups.find(g => g.statusComputed === 'Declining');
        
        if (growing) {
            list.push(`Grupa ${growing.name} crește cu +${growing.studentsChange30d} elevi în ultimele 30 zile.`);
        }
        if (declining) {
            list.push(`Grupa ${declining.name} pierde elevi (${declining.studentsChange30d}). Retenția este sub media școlii.`);
        }
        
        const highOccupancy = groups.find(g => g.occupancyPct >= 85);
        if (highOccupancy) {
            list.push(`Gradul de ocupare este ${highOccupancy.occupancyPct}%. Recomandare: deschide o grupă nouă.`);
        }

        if (metrics.retentionPct < metrics.schoolAverages.retentionPct) {
            list.push(`Retenția generală este sub media școlii cu ${metrics.schoolAverages.retentionPct - metrics.retentionPct}%.`);
        }

        return list;
    }, [groups, metrics]);

    // 4. RENDER HELPERS
    const KPICard = ({ label, value, delta, avg, icon, color }: any) => (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <div className={`p-2 rounded-xl ${color.bg} ${color.text}`}>{icon}</div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{value}</span>
                    {delta !== undefined && (
                        <span className={`text-[10px] font-bold flex items-center ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {delta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {Math.abs(delta)}{typeof value === 'string' && value.includes('%') ? '%' : ''}
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Media Școlii: <span className="text-gray-900 dark:text-white">{avg}{typeof value === 'string' && value.includes('%') ? '%' : ''}</span></p>
            </div>
        </div>
    );

    const TrendSparkline = ({ data, color }: { data: number[], color: string }) => (
        <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.map((v, i) => ({ v, i }))}>
                    <Line 
                        type="monotone" 
                        dataKey="v" 
                        stroke={color} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            
            {/* A) KPI STRIP - PRIMARY */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> KPI Principali
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard 
                        label="Elevi Activi" 
                        value={metrics.activeStudents} 
                        delta={metrics.activeStudentsDelta}
                        avg={35}
                        icon={<Users size={16} />}
                        color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                    />
                    <KPICard 
                        label="Venit Lunar" 
                        value={`${metrics.revenueMonth} RON`} 
                        delta={metrics.revenueDelta}
                        avg={4500}
                        icon={<DollarSign size={16} />}
                        color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                    />
                    <KPICard 
                        label="Profit Net" 
                        value={`${metrics.profitMonth} RON`} 
                        delta={metrics.profitDelta}
                        avg={2800}
                        icon={<TrendingUp size={16} />}
                        color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                    />
                    <KPICard 
                        label="Retenție" 
                        value={`${metrics.retentionPct}%`} 
                        delta={metrics.retentionDelta}
                        avg={metrics.schoolAverages.retentionPct}
                        icon={<Activity size={16} />}
                        color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                    />
                </div>
            </div>

            {/* A) KPI STRIP - SECONDARY */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={14} /> KPI Secundari
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <KPICard 
                        label="Rating" 
                        value={metrics.ratingAvg} 
                        delta={metrics.ratingDelta}
                        avg={metrics.schoolAverages.ratingAvg}
                        icon={<Star size={16} />}
                        color={{ bg: 'bg-yellow-50', text: 'text-yellow-600' }}
                    />
                    <KPICard 
                        label="Elevi Noi" 
                        value={metrics.newStudents30d} 
                        delta={metrics.newStudentsDelta}
                        avg={metrics.schoolAverages.newStudents30d}
                        icon={<UserPlus size={16} />}
                        color={{ bg: 'bg-cyan-50', text: 'text-cyan-600' }}
                    />
                    <KPICard 
                        label="Cost Instructor" 
                        value={`${metrics.costMonth} RON`} 
                        avg={1800}
                        icon={<Wallet size={16} />}
                        color={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                    />
                    <KPICard 
                        label="Elevi pierduți" 
                        value={metrics.lostStudents30d} 
                        delta={metrics.lostStudentsDelta}
                        avg={4}
                        icon={<TrendingDown size={16} />}
                        color={{ bg: 'bg-red-50', text: 'text-red-600' }}
                    />
                    <KPICard 
                        label="Grad ocupare" 
                        value={`${metrics.occupancyPct}%`} 
                        avg={75}
                        icon={<LayoutGrid size={16} />}
                        color={{ bg: 'bg-gray-50', text: 'text-gray-600' }}
                    />
                </div>
            </div>

            {/* D) ALERTS PANEL */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={14} /> Alerte Manageriale
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`p-4 rounded-[24px] border flex gap-4 items-start transition-all hover:shadow-md ${
                                alert.type === 'Critical' ? 'bg-red-50/50 border-red-100' : 
                                alert.type === 'Warning' ? 'bg-amber-50/50 border-amber-100' : 
                                'bg-emerald-50/50 border-emerald-100'
                            }`}>
                                <div className="p-2 bg-white rounded-xl shadow-sm">{alert.icon}</div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{alert.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{alert.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: TRENDS & GROUPS */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* B) TRENDS SECTION */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BarChart3 size={18} className="text-gray-400"/> Evoluție (Ultimele 6 luni)
                            </h3>
                            <Badge color="bg-gray-100 text-gray-600">Actualizat azi</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: 'Elevi Activi', data: metrics.activeStudentsTrend, color: '#3b82f6' },
                                { label: 'Venit Lunar', data: metrics.revenueTrend, color: '#10b981' },
                                { label: 'Retenție %', data: metrics.retentionTrend, color: '#8b5cf6' },
                                { label: 'Rating Mediu', data: metrics.ratingTrend, color: '#f59e0b' }
                            ].map((trend, i) => (
                                <div key={i} className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{trend.label}</p>
                                    <TrendSparkline data={trend.data} color={trend.color} />
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-black text-gray-900 dark:text-white">{trend.data[trend.data.length - 1]}</span>
                                        <span className={`text-[9px] font-bold ${trend.data[trend.data.length - 1] >= trend.data[0] ? 'text-green-600' : 'text-red-600'}`}>
                                            {trend.data[trend.data.length - 1] >= trend.data[0] ? '+' : ''}
                                            {Math.round((trend.data[trend.data.length - 1] / trend.data[0] - 1) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* C) GROUP PERFORMANCE SECTION */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Users size={18} className="text-gray-400"/> Performanță Grupe
                            </h3>
                            <Button variant="secondary" className="h-8 text-xs px-3" onClick={() => onAction?.('add_group')}>
                                <Plus size={14} className="mr-1" /> Adaugă Grupă
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groups.map((group, idx) => (
                                <div key={idx} className="group p-5 bg-gray-50 dark:bg-gray-800/50 rounded-[24px] border border-gray-100 dark:border-gray-700 transition-all hover:bg-white hover:shadow-lg hover:border-blue-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                                group.statusComputed === 'Growing' ? 'bg-green-100 text-green-600' : 
                                                group.statusComputed === 'Declining' ? 'bg-red-100 text-red-600' : 
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                {group.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{group.name}</h4>
                                                <p className="text-[10px] text-gray-500">{group.level}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge color={
                                                group.statusComputed === 'Growing' ? 'bg-green-100 text-green-700' : 
                                                group.statusComputed === 'Declining' ? 'bg-red-100 text-red-700' : 
                                                'bg-gray-100 text-gray-600'
                                            }>
                                                {group.statusComputed}
                                            </Badge>
                                            {group.statusComputed === 'Declining' && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Elevi</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{group.studentsCount}</p>
                                            <p className={`text-[10px] font-bold ${group.studentsChange30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {group.studentsChange30d >= 0 ? '+' : ''}{group.studentsChange30d} (30z)
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Abandonuri</p>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{group.dropouts30d}</p>
                                            <p className="text-[10px] font-bold text-gray-400">Ult. 30z</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Retenție</p>
                                            <p className={`text-sm font-black ${group.retentionPct >= 85 ? 'text-green-600' : 'text-amber-600'}`}>{group.retentionPct}%</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Ocupare: {group.occupancyPct}%</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">{group.studentsCount}/{group.capacity}</p>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${group.occupancyPct >= 85 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                style={{ width: `${group.occupancyPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button onClick={() => onAction?.('view_attendance', group.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all">
                                            <Calendar size={12} /> Prezență
                                        </button>
                                        <button onClick={() => onAction?.('view_feedback', group.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-600 hover:text-yellow-600 hover:border-yellow-200 transition-all">
                                            <MessageCircle size={12} /> Feedback
                                        </button>
                                        <button onClick={() => onAction?.('view_revenue', group.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                                            <DollarSign size={12} /> Venit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: SCORE, INSIGHTS & FORECAST */}
                <div className="space-y-8">
                    
                    {/* 6) INSTRUCTOR PERFORMANCE SCORE */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Scor Instructor</h3>
                        <div className="relative inline-flex items-center justify-center mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-100 dark:text-gray-800"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={364.4}
                                    strokeDashoffset={364.4 - (364.4 * metrics.instructorScore) / 100}
                                    className="text-blue-600 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{metrics.instructorScore}</span>
                                <span className="text-[10px] font-bold text-gray-400">/ 100</span>
                            </div>
                        </div>
                        <p className="text-sm font-black text-blue-600">{metrics.instructorScoreLabel}</p>
                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-[8px] font-bold text-gray-400 uppercase">Profit (35%)</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">Excelent</p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-[8px] font-bold text-gray-400 uppercase">Retenție (25%)</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white">Stabil</p>
                            </div>
                        </div>
                    </div>

                    {/* 10) CAPACITY FORECAST */}
                    <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                        <h3 className="font-bold flex items-center gap-2 mb-6">
                            <TrendingUp size={18} /> Proiecție lună viitoare
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Elevi estimat</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black">{metrics.forecastStudents}</span>
                                    <Badge color="bg-white/20 text-white border-none">+{metrics.forecastStudents - metrics.activeStudents}</Badge>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Venit estimat</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black">{metrics.forecastRevenue} RON</span>
                                    <Badge color="bg-white/20 text-white border-none">+{metrics.forecastRevenue - metrics.revenueMonth} RON</Badge>
                                </div>
                            </div>
                            <p className="text-[9px] opacity-60 italic">*Bazat pe trendul de creștere din ultimele 3 luni.</p>
                        </div>
                    </div>

                    {/* E) INSIGHTS PANEL */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Lightbulb size={18} className="text-amber-500"/> Insight-uri Manageriale
                        </h3>
                        <div className="space-y-4">
                            {insights.map((insight, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{insight}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* G) QUICK ACTIONS */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <Target size={18} className="text-indigo-500"/> Acțiuni Rapide
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <button onClick={() => onAction?.('add_group')} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
                                <div className="flex items-center gap-3">
                                    <Plus size={16} />
                                    <span className="text-xs font-bold">Adaugă Grupă Nouă</span>
                                </div>
                                <ChevronRight size={14} />
                            </button>
                            <button onClick={() => onAction?.('move_students')} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-700 dark:text-gray-300 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100">
                                <div className="flex items-center gap-3">
                                    <Activity size={16} />
                                    <span className="text-xs font-bold">Mută Elevi</span>
                                </div>
                                <ChevronRight size={14} />
                            </button>
                            <button onClick={() => onAction?.('message_group')} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <MessageCircle size={16} />
                                    <span className="text-xs font-bold">Mesaj către Grupe</span>
                                </div>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
