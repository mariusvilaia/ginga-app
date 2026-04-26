
import React, { useMemo, useState } from 'react';
import { 
    CalendarCheck, Flame, Trophy, MapPin, Clock, ChevronLeft, ChevronRight, 
    Calendar as CalendarIcon, Filter 
} from 'lucide-react';
import { UserProfile, DanceClass, DanceStyle } from '../../types';
import { Badge } from '../../components/UIComponents';
import { getStyleTheme } from '../../utils/themeUtils';
import { useData } from '../../contexts/DataContext';

interface StudentAttendancePageProps {
  user: UserProfile;
  onBack: () => void;
}

export const StudentAttendancePage: React.FC<StudentAttendancePageProps> = ({ user, onBack }) => {
  const { classes } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // 1. Get Attended Classes Data
  const attendedClasses = useMemo(() => {
      // Filter classes the user has attended
      const list = classes.filter(cls => user.attendedClasses?.includes(cls.id));
      // Sort descending (newest first)
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [classes, user.attendedClasses]);

  // 2. Compute KPIs
  const stats = useMemo(() => {
      const total = attendedClasses.length;
      
      // Calculate favorite style
      const styleCounts: Record<string, number> = {};
      attendedClasses.forEach(c => { styleCounts[c.style] = (styleCounts[c.style] || 0) + 1; });
      const favStyleEntry = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
      const favoriteStyle = favStyleEntry ? favStyleEntry[0] : 'N/A';

      // Streak is passed from user stats usually, but fallback to 0
      const streak = user.stats.streakWeeks || 0;

      return { total, favoriteStyle, streak };
  }, [attendedClasses, user]);

  // 3. Calendar Logic
  const calendarData = useMemo(() => {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
      // Adjust for Monday start (RO locale usually)
      const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

      const days = [];
      // Empty slots for start offset
      for (let i = 0; i < startOffset; i++) days.push(null);
      
      // Actual days
      for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          // Check if user attended any class on this date
          const hasAttended = attendedClasses.some(c => c.date === dateStr);
          days.push({ day: d, date: dateStr, hasAttended });
      }

      return days;
  }, [selectedMonth, attendedClasses]);

  const changeMonth = (offset: number) => {
      const newDate = new Date(selectedMonth);
      newDate.setMonth(newDate.getMonth() + offset);
      setSelectedMonth(newDate);
  };

  // 4. Group History by Month
  const historyByMonth = useMemo(() => {
      const groups: Record<string, DanceClass[]> = {};
      attendedClasses.forEach(cls => {
          const date = new Date(cls.date);
          const key = date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          if (!groups[capitalizedKey]) groups[capitalizedKey] = [];
          groups[capitalizedKey].push(cls);
      });
      return groups;
  }, [attendedClasses]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-12 font-sans antialiased animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Presence */}
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarCheck size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Prezențe</p>
                    <h3 className="text-2xl font-black text-gray-900">{stats.total}</h3>
                </div>
            </div>

            {/* Streak */}
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <Flame size={24} fill="currentColor" className="opacity-20" />
                    <Flame size={24} className="absolute" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Săptămâni la rând</p>
                    <h3 className="text-2xl font-black text-gray-900">{stats.streak} <span className="text-sm font-medium text-gray-400">săpt</span></h3>
                </div>
            </div>

            {/* Favorite Style */}
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Trophy size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Stil Favorit</p>
                    <h3 className="text-xl font-black text-gray-900 truncate max-w-[140px]" title={stats.favoriteStyle}>{stats.favoriteStyle}</h3>
                </div>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* LEFT: CALENDAR WIDGET */}
            <div className="w-full lg:w-80 bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex flex-col shrink-0 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-black text-gray-900 capitalize">
                        {selectedMonth.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-400">{day}</span>
                    ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                    {calendarData.map((item, idx) => {
                        if (!item) return <div key={idx} className="aspect-square"></div>;
                        
                        const isToday = item.date === new Date().toISOString().split('T')[0];
                        
                        return (
                            <div 
                                key={idx} 
                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all relative
                                    ${item.hasAttended 
                                        ? 'bg-gray-900 text-white shadow-md scale-105' 
                                        : 'bg-gray-50 text-gray-400'
                                    }
                                    ${isToday && !item.hasAttended ? 'border-2 border-blue-200 text-blue-600' : ''}
                                `}
                            >
                                {item.day}
                                {item.hasAttended && (
                                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-green-400"></span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-gray-900"></div>
                        <span>Zile cu prezență</span>
                    </div>
                </div>
            </div>

            {/* RIGHT: TIMELINE HISTORY */}
            <div className="flex-1 w-full space-y-8">
                {Object.keys(historyByMonth).length > 0 ? (
                    Object.entries(historyByMonth).map(([month, data]) => {
                        const monthClasses = data as DanceClass[];
                        return (
                        <div key={month}>
                            <div className="flex items-center gap-4 mb-4">
                                <h3 className="font-bold text-gray-900 text-lg">{month}</h3>
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                                    {monthClasses.length} cursuri
                                </span>
                            </div>

                            <div className="space-y-3">
                                {monthClasses.map((cls, idx) => {
                                    const theme = getStyleTheme(cls.style, cls.level);
                                    return (
                                        <div key={idx} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 relative overflow-hidden">
                                            
                                            {/* Style Color Bar */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.bg}`}></div>

                                            {/* Date Box */}
                                            <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 bg-gray-50 sm:w-16 sm:h-16 rounded-xl shrink-0 px-3 py-2 sm:p-0">
                                                <span className="text-sm sm:text-xl font-black text-gray-900 leading-none">
                                                    {new Date(cls.date).getDate()}
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 uppercase">
                                                    {new Date(cls.date).toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '')}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900 text-sm truncate">{cls.title}</h4>
                                                    <Badge color={`${theme.softBg} ${theme.softText} !text-[9px] !px-1.5 !py-0 border-none`}>
                                                        {cls.style}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1"><Clock size={12}/> {cls.time}</span>
                                                    <span className="flex items-center gap-1"><MapPin size={12}/> {cls.room}</span>
                                                </div>
                                            </div>

                                            {/* Instructor */}
                                            <div className="sm:text-right flex items-center sm:block gap-2 border-t sm:border-0 border-gray-50 pt-2 sm:pt-0 mt-1 sm:mt-0">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Instructor</p>
                                                <p className="text-xs font-bold text-gray-900">
                                                    {cls.instructors.map(i => (i.name || '').split(' ')[0]).join(' & ')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})
                ) : (
                    <div className="bg-white rounded-[32px] border border-dashed border-gray-200 p-12 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                            <CalendarIcon size={40} />
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2">Nu ai prezențe încă</h4>
                        <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">
                            După ce vei scana codul QR la prima ta clasă, istoricul tău va începe să apară aici.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
