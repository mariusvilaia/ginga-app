
import React, { useState, useMemo } from 'react';
import { QrCode, AlertTriangle, Clock, MapPin, Flame, Zap, Trophy, Calendar, ArrowRight, Sparkles, ChevronRight, CreditCard, PlayCircle, Star, User } from 'lucide-react';
import { Button, Badge } from '../../../components/UIComponents';
import { StudentProgressChart } from '../StudentProgressChart';
import { AiCoachWidget } from '../components/AiCoachWidget';
import { UserProfile, DanceClass, GroupDetailedProfile } from '../../../types';
import { useData } from '../../../contexts/DataContext';

interface StudentHomeViewProps {
    user: UserProfile;
    alerts: { type: string; text: string }[];
    setActiveTab: (t: any) => void;
    onShowQr: () => void;
    getInstructorAvatar: (i: any) => string;
}

const getNextDateForDay = (dayName: string, timeStr: string): Date => {
    const dayMap: Record<string, number> = { 'Duminică': 0, 'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6 };
    const targetDayIndex = dayMap[dayName] ?? 1;
    const now = new Date();
    const currentDayIndex = now.getDay();
    const date = new Date();
    let diff = targetDayIndex - currentDayIndex;
    if (diff === 0) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const classTime = new Date();
        classTime.setHours(hours, mins, 0, 0);
        if (classTime < now) diff = 7;
    } else if (diff < 0) diff += 7;
    date.setDate(now.getDate() + diff);
    const [h, m] = timeStr.split(':').map(Number);
    date.setHours(h, m, 0, 0);
    return date;
};

export const StudentHomeView: React.FC<StudentHomeViewProps> = ({ 
    user, alerts, setActiveTab, onShowQr, getInstructorAvatar 
}) => {
    const { groups } = useData();
    const [chartMetric, setChartMetric] = useState<'hours' | 'classes'>('hours');
    
    const upcomingClass = useMemo(() => {
        const enrolledGroupIds = user.enrollments.map(e => e.groupId);
        const enrolledGroupNames = user.enrollments.map(e => e.groupName);
        const myGroups = groups.filter(g => enrolledGroupIds.includes(g.id) || enrolledGroupNames.includes(g.name));
        if (myGroups.length === 0) return null;
        const upcomingInstances = myGroups.map(g => ({ group: g, date: getNextDateForDay(g.schedule.day, g.schedule.time) }));
        upcomingInstances.sort((a, b) => a.date.getTime() - b.date.getTime());
        const next = upcomingInstances[0];
        if (next) {
            return {
                id: next.group.id, title: next.group.name, instructors: next.group.instructors,
                time: next.group.schedule.time, duration: next.group.schedule.duration,
                room: next.group.schedule.room, level: next.group.level, style: next.group.style,
                date: next.date.toISOString(), occupancy: { current: next.group.stats.enrolledCount, max: next.group.stats.maxCapacity }
            } as DanceClass;
        }
        return null;
    }, [groups, user.enrollments]);

    const isStaff = user.subscription.type === 'Staff';
    const expiryDate = new Date(user.subscription.expiryDate);
    const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    const isUnlimited = user.subscription.sessionsTotal > 50;
    const maxDots = 10; 
    let ratio = 0; let labelLeft = "";
    if (isStaff) { ratio = 1; labelLeft = "Nelimitat"; }
    else if (isUnlimited) { ratio = Math.max(0, Math.min(1, daysLeft / 30)); labelLeft = `${Math.max(0, daysLeft)} zile rămase`; }
    else { ratio = Math.max(0, Math.min(1, user.subscription.sessionsLeft / user.subscription.sessionsTotal)); labelLeft = `${user.subscription.sessionsLeft} rămase`; }
    const activeDots = Math.ceil(ratio * maxDots);

    const getTimeUntil = (dateStr: string) => {
        const now = new Date();
        const classDate = new Date(dateStr);
        const diffMs = classDate.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffHrs < 0) return 'În desfășurare';
        if (diffHrs === 0) return 'Începe curând';
        if (diffHrs < 24) return `În ${diffHrs} ore`;
        if (diffDays === 1) return 'Mâine';
        return `În ${diffDays} zile`;
    };

    const CHART_DATA = {
        hours: [ { label: 'Aug', value: 8 }, { label: 'Sep', value: 12 }, { label: 'Oct', value: 10 }, { label: 'Nov', value: 18 }, { label: 'Dec', value: 24 }, { label: 'Ian', value: user.stats.hoursDanced || 14 } ],
        classes: [ { label: 'Aug', value: 6 }, { label: 'Sep', value: 8 }, { label: 'Oct', value: 8 }, { label: 'Nov', value: 12 }, { label: 'Dec', value: 16 }, { label: 'Ian', value: user.stats.totalClasses || 10 } ]
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                  <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Bine ai revenit,</p>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">{(user.name || '').split(' ')[0]} 👋</h2>
                  </div>
                  <button 
                    onClick={onShowQr}
                    className="flex flex-col items-center gap-1 group"
                  >
                      <div className="p-3 bg-[#111827] text-white rounded-2xl shadow-xl shadow-gray-200 group-active:scale-95 transition-all">
                        <QrCode size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-500">Cod Intrare</span>
                  </button>
              </div>
              
              {alerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl flex items-center gap-3 border-l-4 shadow-sm ${alert.type === 'critical' ? 'bg-red-50 text-red-900 border-red-500' : 'bg-amber-50 text-amber-900 border-amber-400'}`}>
                      <AlertTriangle size={20} />
                      <span className="text-sm font-bold flex-1">{alert.text}</span>
                      <button className="ml-auto text-xs font-black underline hover:opacity-75" onClick={() => setActiveTab('membership')}>Rezolvă</button>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  {upcomingClass ? (
                      <div onClick={() => setActiveTab('schedule')} className="relative overflow-hidden rounded-[32px] bg-[#111827] text-white shadow-xl group cursor-pointer transition-all hover:scale-[1.01]">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600 to-purple-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                          <div className="p-8 relative z-10">
                              <div className="flex justify-between items-start mb-10">
                                  <Badge color="bg-white/10 text-white border border-white/20 backdrop-blur-md flex items-center gap-1.5 px-3 py-1">
                                      <Clock size={12} className="text-blue-400"/> {getTimeUntil(upcomingClass.date)}
                                  </Badge>
                                  <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Următoarea Clasă</p><p className="text-sm font-bold text-white">{new Date(upcomingClass.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric' })}</p></div>
                              </div>
                              <div className="mb-8"><h3 className="text-3xl md:text-4xl font-black mb-3 leading-tight tracking-tight text-white group-hover:text-blue-200 transition-colors">{upcomingClass.title}</h3><div className="flex items-center gap-3 text-sm font-medium text-gray-300"><div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><MapPin size={14} className="text-[#E53935]"/><span>{upcomingClass.room}</span></div><div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Clock size={14} className="text-blue-400"/><span>{upcomingClass.time}</span></div></div></div>
                              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                  <div className="flex items-center gap-3"><div className="flex -space-x-3">{upcomingClass.instructors.slice(0,3).map((i: any, idx: number) => (<img key={idx} src={getInstructorAvatar(i)} className="w-10 h-10 rounded-full border-2 border-[#111827] bg-gray-800 object-cover" />))}</div><p className="text-xs font-medium text-gray-400">cu <span className="text-white font-bold">{upcomingClass.instructors.map((i: any) => i.name.split(' ')[0]).join(' & ')}</span></p></div>
                                  <Button onClick={(e) => { e.stopPropagation(); onShowQr(); }} className="!w-auto px-6 h-11 text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 border-none shadow-lg shadow-white/10 gap-2 uppercase tracking-wide rounded-xl"><QrCode size={18}/> Check-in</Button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm text-center py-16"><p className="text-gray-400 font-bold mb-4">Nu ai nicio clasă programată curând.</p><Button onClick={() => setActiveTab('schedule')} variant="secondary" className="!w-auto mx-auto">Vezi Orarul Complet</Button></div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2 hover:border-orange-200 transition-colors"><div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><Flame size={20}/></div><div><p className="text-xl font-black text-gray-900">{user.stats.streakWeeks}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Streak</p></div></div>
                      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2 hover:border-blue-200 transition-colors"><div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><Zap size={20}/></div><div><p className="text-xl font-black text-gray-900">{user.stats.hoursDanced}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ore</p></div></div>
                      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2 hover:border-purple-200 transition-colors col-span-2 md:col-span-1"><div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center"><Trophy size={20}/></div><div className="w-full">{user.enrollments.length > 0 ? (<><p className="text-xs font-black text-gray-900 truncate max-w-[100px] mx-auto">{user.enrollments[0].level}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nivel</p></>) : (<><p className="text-xs font-black text-gray-900">Nou</p><p className="text-[10px] font-bold text-gray-400 uppercase">Nivel</p></>)}</div></div>
                  </div>

                  <StudentProgressChart title="Progres Activitate" data={chartMetric === 'hours' ? CHART_DATA.hours : CHART_DATA.classes} activeMetric={chartMetric} onMetricChange={(m) => setChartMetric(m)} />
              </div>

              <div className="space-y-6">
                  <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6"><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Abonament</p><span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide border ${user.subscription.type.includes('Gold') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>{user.subscription.type}</span></div><div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p><span className={`text-xs font-black ${user.subscription.active ? 'text-green-600' : 'text-red-500'}`}>{user.subscription.active ? 'ACTIV' : 'EXPIRAT'}</span></div></div>
                      <div className="mb-6"><div className="flex justify-between text-xs font-bold text-gray-500 mb-2"><span>Utilizat</span><span>{labelLeft}</span></div><div className="flex gap-1.5">{[...Array(maxDots)].map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-full ${i < activeDots ? 'bg-gray-900' : 'bg-gray-100'}`} />))}</div></div>
                      {!isStaff && (<Button onClick={() => setActiveTab('membership')} variant="secondary" className="w-full h-10 text-xs font-bold uppercase tracking-wide border-gray-200">{user.subscription.active ? 'Gestionează' : 'Reînnoiește'}</Button>)}
                  </div>
                  <AiCoachWidget user={user} />
              </div>
          </div>
      </div>
    );
};
