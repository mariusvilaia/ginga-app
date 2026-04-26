
import React, { useState, useMemo, useCallback } from 'react';
import { Users, UserPlus, UserMinus, Percent, Wallet, XCircle, CheckCircle, AlertOctagon as AlertOctagonIcon, UserX, TrendingDown, TrendingUp, Sparkles, BrainCircuit, CheckSquare, CalendarCheck, BarChart3, PauseCircle, AlertTriangle, Star, ArrowRight, ArrowUpRight, ArrowDownRight, RefreshCw, User } from 'lucide-react';
import { MOCK_INSTRUCTOR_ATTENDANCE, MOCK_ATTENDANCE_SESSIONS } from '../../constants';
import { Button, Badge } from '../../components/UIComponents';
import { SalesChart } from '../../components/shared/SalesChart';
import { TimelineCard } from '../../components/dashboard/widgets/TimelineCard';
import { TaskWidget } from '../../components/dashboard/widgets/TaskWidget';
import { TargetIcon } from '../../components/shared/TargetIcon';
import { AdminTask, DanceClass } from '../../types';
import { useData } from '../../contexts/DataContext';
import { TaskEditModal } from '../tasks/components/TaskEditModal';
import { calculateSubscriptionExpiryDate } from '../../utils/dateUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface OverviewViewProps {
    isDarkMode: boolean;
    onNavigate: (tab: any, id?: string) => void;
    tasks: AdminTask[];
    onAddTask: (title: string, priority?: 'high'|'medium'|'low', tag?: string, assignee?: {name: string, avatarUrl: string}, description?: string, status?: 'inbox' | 'pending' | 'done' | 'archived', projectId?: string) => void;
    onUpdateTask: (task: AdminTask) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ isDarkMode, onNavigate, tasks, onAddTask, onUpdateTask }) => {
  const { language, t } = useLanguage();
  const { students, groups, instructors, classes, financials, vacationPeriods } = useData(); // USE LIVE CONTEXT
  const [selectedKpi, setSelectedKpi] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleTaskClick = (task: AdminTask) => {
      setEditingTask(task);
      setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: any) => {
      if (editingTask) {
          onUpdateTask({ ...editingTask, ...taskData });
      } else {
          onAddTask(taskData.title, taskData.priority, taskData.tag, taskData.assignee, taskData.description, taskData.status, taskData.projectId);
      }
      setIsTaskModalOpen(false);
  };

  // Helper for expiry check
  const getDaysLeft = useCallback((student: any) => {
      if (!student.subscription?.expiryDate) return 0;
      const expiryDate = new Date(student.subscription.expiryDate);
      const now = new Date().getTime();
      return Math.ceil((expiryDate.getTime() - now) / (1000 * 3600 * 24));
  }, []);

  // Live Calculations
  // Active means: subscription.active=true AND subscription not expired
  const activeSubscriptionsCount = students.filter(s => {
      if (!s.subscription?.active) return false;
      
      const isStaff = s.subscription.type === 'Staff';
      if (isStaff) return true;

      if (s.subscription.expiryDate) {
          return getDaysLeft(s) >= 0;
      }
      return true;
  }).length;

  // Active means: status='active' AND subscription.active=true AND subscription not expired
  const activeStudentsCount = students.filter(s => {
      if (s.status !== 'active') return false;
      if (!s.subscription?.active) return false;
      
      const isStaff = s.subscription.type === 'Staff';
      if (isStaff) return true;

      if (s.subscription.expiryDate) {
          return getDaysLeft(s) >= 0;
      }
      return true;
  }).length;
  
  // New Signups (Last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const newStudentsCount = students.filter(s => s.joinDate && new Date(s.joinDate) >= thirtyDaysAgo).length;
  const lostStudentsCount = students.filter(s => s.status === 'inactive').length;
  
  // Retention Average
  const retentionRates = students.map(s => s.kpi?.retentionRate || 0);
  const avgRetention = retentionRates.length > 0 
      ? Math.round(retentionRates.reduce((a, b) => a + b, 0) / retentionRates.length) 
      : 0;
  
  // Calculate Churn Rate: Monthly Churn Rate (Churned in last 30 days / Active 30 days ago)
  const churnRate = useMemo(() => {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const churnedLast30Days = students.filter(s => {
          const isActive = s.status === 'active' && s.subscription?.active && (!s.subscription.expiryDate || getDaysLeft(s) >= 0);
          if (isActive) return false;
          
          if (s.subscription?.expiryDate) {
              const expiry = new Date(s.subscription.expiryDate);
              return expiry >= thirtyDaysAgo && expiry <= now;
          }
          return false;
      }).length;

      const currentlyActiveJoinedBefore30Days = students.filter(s => {
          const isActive = s.status === 'active' && s.subscription?.active && (!s.subscription.expiryDate || getDaysLeft(s) >= 0);
          if (!isActive) return false;
          if (!s.joinDate) return true;
          return new Date(s.joinDate) < thirtyDaysAgo;
      }).length;

      const active30DaysAgo = currentlyActiveJoinedBefore30Days + churnedLast30Days;

      if (active30DaysAgo === 0) return '0%';
      
      return ((churnedLast30Days / active30DaysAgo) * 100).toFixed(1) + '%';
  }, [students, getDaysLeft]);

  // Calculate MRR: Sum of monthly prices of all active subscriptions
  const calculatedMRR = useMemo(() => {
      return students.reduce((sum, s) => {
          if (!s.subscription?.active) return sum;
          
          const isStaff = s.subscription.type === 'Staff';
          if (isStaff) return sum;
          
          if (s.subscription.expiryDate) {
              if (getDaysLeft(s) < 0) return sum;
          }

          let price = 0;
          const plan = s.subscription?.type || '';
          
          if (plan.includes('Bronze')) price = 189;
          else if (plan.includes('Silver')) price = 269;
          else if (plan.includes('Gold')) price = 349;
          else if (plan.includes('Platinum')) price = 449;
          
          return sum + price;
      }, 0);
  }, [students, getDaysLeft]);
  
  const currentRevenue = calculatedMRR.toLocaleString();

  const failedPaymentsCount = students.filter(s => s.kpi?.paymentStatus === 'unpaid').length;
  
  const todayStr = today.toISOString().split('T')[0];

  // --- TODAYS CLASSES LOGIC ---
  const todaysClasses = useMemo(() => {
      const dayOfWeek = today.getDay();
      
      // Filter classes for today (by date match or day of week match fallback)
      let matches = classes.filter(c => c.date === todayStr);
      
      // If no exact date matches (demo data usually has future dates), fallback to day of week matching
      if (matches.length === 0) {
          matches = classes.filter(c => c.date && new Date(c.date).getDay() === dayOfWeek);
      }
      
      // Demo Fallback: If still empty (e.g. Sunday), show Monday classes to keep UI populated
      if (matches.length === 0) {
           matches = classes.filter(c => c.date && new Date(c.date).getDay() === 1);
      }

      return matches.sort((a, b) => a.time.localeCompare(b.time));
  }, [classes, todayStr]);

  const checkinsToday = todaysClasses.reduce((acc, c) => acc + (c.occupancy?.current || 0), 0);

  const getClassStatus = (cls: DanceClass) => {
      if (!cls.date) return 'upcoming';
      const now = new Date();
      // Handle demo fallback where dates might not be today
      // Only compare times if the date is actually today
      const classDate = new Date(cls.date);
      const isActuallyToday = classDate.toISOString().split('T')[0] === todayStr || 
                              classDate.getDay() === now.getDay(); // Loose check for demo fallback

      if (!isActuallyToday) return 'upcoming';

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [hours, mins] = cls.time.split(':').map(Number);
      const startMinutes = hours * 60 + mins;
      const durationMinutes = parseInt(cls.duration) || 60;
      const endMinutes = startMinutes + durationMinutes;

      if (currentMinutes > endMinutes) return 'finished';
      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) return 'live';
      return 'upcoming';
  };

  // Calculate LTV: Average total revenue per paying student
  const calculatedLtv = useMemo(() => {
      const payingStudents = students.filter(s => 
          s.paymentHistory && s.paymentHistory.some(t => t.status === 'success')
      );
      if (payingStudents.length === 0) return 0;
      
      const totalRevenue = payingStudents.reduce((sum, s) => {
          return sum + (s.paymentHistory?.reduce((studentSum, t) => studentSum + (t.status === 'success' ? t.amount : 0), 0) || 0);
      }, 0);
      
      return Math.round(totalRevenue / payingStudents.length);
  }, [students]);

  // Calculate Average Membership Lifetime (in days)
  const avgLifetime = useMemo(() => {
      let validStudentsCount = 0;
      const totalDays = students.reduce((sum, s) => {
          if (!s.joinDate) return sum;
          const joinDate = new Date(s.joinDate);
          let endDate = new Date(); // default to now for active
          
          const isActive = s.status === 'active' && s.subscription?.active && (!s.subscription.expiryDate || getDaysLeft(s) >= 0);
          
          if (!isActive) {
              // Student is inactive, use expiry date or last payment date
              if (s.subscription?.expiryDate) {
                  endDate = new Date(s.subscription.expiryDate);
              } else if (s.subscription?.lastPaymentDate) {
                  endDate = new Date(s.subscription.lastPaymentDate);
                  endDate.setMonth(endDate.getMonth() + 1); // approximate 1 month after last payment
              } else {
                  endDate = joinDate;
              }
          }
          
          // Ensure endDate is not before joinDate
          if (endDate < joinDate) endDate = joinDate;
          
          const diffInDays = Math.floor((endDate.getTime() - joinDate.getTime()) / (1000 * 3600 * 24));
          validStudentsCount++;
          return sum + diffInDays;
      }, 0);

      const avgDays = validStudentsCount > 0 ? Math.round(totalDays / validStudentsCount) : 0;
      
      return `${avgDays} zile`;
  }, [students, getDaysLeft]);

  const dashboardKPIs = [
    { id: 'members', label: t('dashboard.activeMembers'), value: activeSubscriptionsCount.toString(), color: 'bg-blue-50 text-blue-600', icon: Users, change: '+12%', trend: 'up' },
    { id: 'churn', label: t('dashboard.churnRate'), value: churnRate, color: 'bg-green-50 text-green-600', icon: UserPlus, change: '-0.5%', trend: 'down' },
    { id: 'mrr', label: t('dashboard.monthlyRevenue'), value: currentRevenue, color: 'bg-emerald-50 text-emerald-600', icon: TrendingUp, change: '+5%', trend: 'up' },
    { id: 'arpu', label: 'Venit / Membru (RON)', value: activeSubscriptionsCount > 0 ? Math.round(calculatedMRR / activeSubscriptionsCount).toString() : '0', color: 'bg-purple-50 text-purple-600', icon: User, change: '+2%', trend: 'up' },
    { id: 'ltv', label: t('dashboard.ltv'), value: calculatedLtv.toLocaleString(), color: 'bg-emerald-50 text-emerald-600', icon: Wallet, change: '+18%', trend: 'up' },
    { id: 'lifetime', label: t('dashboard.avgLifetime'), value: avgLifetime, color: 'bg-orange-50 text-orange-600', icon: CalendarCheck, change: '+0.2', trend: 'up' },
    { id: 'checkins', label: t('dashboard.checkins'), value: checkinsToday.toString(), color: 'bg-cyan-50 text-cyan-600', icon: CheckCircle, change: '+8', trend: 'up' },
  ];

  const handleKpiClick = (kpiId: string) => {
      switch(kpiId) {
          case 'members':
          case 'churn':
              onNavigate('members');
              break;
          case 'ltv':
          case 'mrr':
          case 'arpu':
          case 'lifetime':
          case 'failed_payments':
              onNavigate('finance');
              break;
          case 'checkins':
              onNavigate('attendance');
              break;
          default:
              break;
      }
  };

  // Logic to find uncovered classes (future absences without substitute)
  const uncoveredClasses = MOCK_INSTRUCTOR_ATTENDANCE.filter(rec => {
      // Is absent?
      const isAbsent = rec.status === 'absent';
      // Is in future or today?
      const recordDate = new Date(rec.date);
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      const isFuture = recordDate >= todayDate;
      // Is not cancelled (cancelled doesn't need sub)
      return isAbsent && isFuture;
  });

  return (
    <div className="space-y-6 max-w-full mx-auto pb-12 px-2">
      
      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
         {dashboardKPIs.map((kpi, idx) => (
            <div 
              key={idx} 
              onClick={() => handleKpiClick(kpi.id)}
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-28 hover:shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 group"
            >
               <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-xl ${kpi.color.split(' ')[0]} ${kpi.color.split(' ')[1]} dark:bg-opacity-20`}>
                     <kpi.icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                      kpi.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      kpi.trend === 'down' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : // Good down (churn)
                      kpi.trend === 'down_bad' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                      {kpi.trend === 'up' && <ArrowUpRight size={10}/>}
                      {kpi.trend === 'down' && <ArrowDownRight size={10}/>}
                      {kpi.trend === 'down_bad' && <ArrowUpRight size={10}/>}
                      {kpi.change}
                  </span>
               </div>
               <div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1 group-hover:text-blue-600 transition-colors">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{kpi.label}</p>
               </div>
            </div>
         ))}
      </div>

      {/* RISK & AI (CRITICAL ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Critical Alerts */}
         <div className="lg:col-span-2 bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
               <AlertOctagonIcon size={180} className="text-red-500" />
            </div>
            <div className="flex items-center gap-3 mb-4 z-10">
               <div className="bg-white dark:bg-red-900/50 p-2.5 rounded-full shadow-sm text-red-600"><AlertOctagonIcon size={20} /></div>
               <h3 className="text-xl font-black text-red-700 dark:text-red-400">Atenție Necesară</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
               {/* STAFFING ALERT WIDGET */}
               {uncoveredClasses.length > 0 && (
                   <div className="bg-amber-50 dark:bg-amber-900/20 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer ring-2 ring-amber-400/20" onClick={() => onNavigate('instructor_attendance')}>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 animate-pulse"><RefreshCw size={18}/></div>
                         <div>
                            <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">{uncoveredClasses.length} Clase Fără Instructor</p>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">Necesită Suplinire</p>
                         </div>
                      </div>
                      <ArrowRight size={16} className="text-amber-600"/>
                   </div>
               )}

               <div className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('members')}>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600"><UserX size={18}/></div>
                     <div>
                        <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">3 Cursanți în Risc</p>
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase">Inactivitate &gt; 14 zile</p>
                     </div>
                  </div>
                  <ArrowRight size={16} className="text-red-400"/>
               </div>
               
               {uncoveredClasses.length === 0 && (
                   <div className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('groups', 'g_kizomba_adv')}>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600"><TrendingDown size={18}/></div>
                         <div>
                            <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">Grupa Kizomba Adv</p>
                            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase">Prezență sub 40%</p>
                         </div>
                      </div>
                      <ArrowRight size={16} className="text-red-400"/>
                   </div>
               )}
            </div>
         </div>

         {/* AI Daily Brief */}
         <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-indigo-900 dark:to-purple-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <BrainCircuit size={140} className="text-white" />
            </div>
            <div className="z-10">
               <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-yellow-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Ginga AI Insight</p>
               </div>
               <h3 className="text-lg font-bold leading-snug mb-6">"Concentrează-te azi pe retenția începătorilor de la Salsa."</h3>
               <div className="space-y-3">
                  <div className="flex items-start gap-3 text-xs font-medium bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors cursor-pointer" onClick={() => onAddTask("Trimite mesaj bun venit (AI Rec)", "medium", "Retenție")}>
                     <CheckSquare size={16} className="text-green-400 mt-0.5" />
                     <span>Trimite mesaj de bun venit celor 3 noi înscriși.</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs font-medium bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors cursor-pointer" onClick={() => onAddTask("Verifică plata chirie Sala VB", "high", "Admin")}>
                     <CheckSquare size={16} className="text-green-400 mt-0.5" />
                     <span>Verifică plata chirie Sala VB.</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* MAIN OPERATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
         
         {/* Left: Today's Operations (Timeline) - Span 4 */}
         <div className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
               <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><CalendarCheck size={18} className="text-blue-600"/> {t('dashboard.todayClasses')}</h3>
               <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
               </span>
            </div>
            <div className="space-y-1 relative ml-2 flex-1">
               {/* Timeline Line */}
               <div className="absolute left-[7px] top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800"></div>
               
               {todaysClasses.map(cls => {
                   const session = MOCK_ATTENDANCE_SESSIONS.find(s => s.classId === cls.id);
                   const unpaidCount = session ? session.unpaidPresent : 0;
                   const attendees = cls.occupancy?.current || 0;
                   
                   return (
                       <TimelineCard 
                           key={cls.id}
                           time={cls.time}
                           title={cls.title}
                           instructor={cls.instructors.map(i => i.name.split(' ')[0]).join(' & ')}
                           room={cls.room}
                           status={getClassStatus(cls)}
                           attendees={attendees}
                           unpaid={unpaidCount}
                       />
                   );
               })}
               
               {todaysClasses.length === 0 && (
                   <p className="text-sm text-gray-400 italic p-4 text-center">Nicio clasă programată pentru azi.</p>
               )}
            </div>
         </div>

         {/* Middle: Finance & Trends - Span 5 */}
         <div className="lg:col-span-5 h-full">
            {/* Quick Finance */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 h-full flex flex-col">
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wallet size={18} className="text-emerald-600"/> Finanțe Rapide</h3>
                  <button onClick={() => onNavigate('finance')} className="text-xs font-bold text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">Vezi Raport <ArrowRight size={12}/></button>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                     <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Încasări Azi</p>
                     <p className="text-2xl font-black text-gray-900 dark:text-white">1,250 <span className="text-sm font-medium text-gray-400">RON</span></p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                     <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider mb-1">Facturi Urgente</p>
                     <p className="text-2xl font-black text-gray-900 dark:text-white">2</p>
                  </div>
               </div>
               {/* Chart Area - Flexible Height */}
               <div className="flex-1 w-full bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden relative min-h-[160px]">
                  <div className="absolute inset-0 flex items-center justify-center opacity-70">
                     <SalesChart isDarkMode={isDarkMode} />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 flex items-center gap-1">
                      <TrendingDown size={12} className="text-green-500 rotate-180"/> +15% vs Luna Trecută
                  </div>
               </div>
            </div>
         </div>

         {/* Right: Task Manager - Span 3 */}
         <div className="lg:col-span-3 h-full">
            <TaskWidget tasks={tasks} onAddTask={(title) => onAddTask(title, 'medium', 'General')} onTaskClick={handleTaskClick} />
         </div>
      </div>

      <TaskEditModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
      />

      {/* 5. BOTTOM SECTION: DETAILED GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         
         {/* Group Status Grid */}
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Status Grupe</h3>
                <button className="text-xs font-bold text-blue-600 hover:underline" onClick={() => onNavigate('groups')}>Vezi toate</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {groups.slice(0, 4).map(group => (
                  <div key={group.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onNavigate('groups', group.id)}>
                     <div className="flex justify-between items-start mb-3">
                        <Badge color="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{group.level}</Badge>
                        {group.risk.level === 'high' ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full"><AlertTriangle size={10}/> Risc</div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"><CheckCircle size={10}/> OK</div>
                        )}
                     </div>
                     <h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 transition-colors">{group.name}</h4>
                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{group.schedule.day} • {group.schedule.time}</p>
                     <div className="pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-xs font-medium">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Users size={12}/> {group.stats.enrolledCount}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={`${group.stats.energyLevel === 'High' ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>{group.stats.energyLevel} Energy</span>
                            {group.stats.trend === 'growing' ? <ArrowUpRight size={12} className="text-green-500"/> : <ArrowDownRight size={12} className="text-red-500"/>}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Instructor Overview */}
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Instructori Top</h3>
                <button className="text-xs font-bold text-blue-600 hover:underline" onClick={() => onNavigate('instructors')}>Vezi toți</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {instructors.slice(0, 4).map(instr => (
                  <div key={instr.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('instructors', instr.id)}>
                     <div className="relative">
                        <img src={instr.avatarUrl} className="w-14 h-14 rounded-full border border-gray-100 dark:border-gray-700 object-cover" />
                        {instr.riskScore > 15 && <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-0.5 rounded-full border-2 border-white"><AlertTriangle size={10}/></div>}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{instr.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                           <span className="flex items-center gap-1 font-bold text-gray-900 dark:text-white"><Star size={10} className="text-yellow-400 fill-yellow-400"/> {instr.kpi?.averageRating || 0}</span>
                           <span>•</span>
                           <span className="flex items-center gap-1">{instr.kpi?.retentionRate || 0}% Ret. <ArrowUpRight size={10} className="text-green-500"/></span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

      </div>
    </div>
  );
};
