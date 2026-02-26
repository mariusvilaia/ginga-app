
import React, { useState, useMemo } from 'react';
import { Calendar, CalendarRange } from 'lucide-react';
import { UserProfile, DanceClass, DanceStyle } from '../../types';
import { Switch } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';

import { normalizeLevel, getCurrentWeekDate, getWeekRangeString } from './components/schedule/scheduleHelpers';
import { ScheduleClassCard } from './components/schedule/ScheduleClassCard';
import { ScheduleClassModal } from './components/schedule/ScheduleClassModal';

interface StudentSchedulePageProps {
  user: UserProfile;
  onBack: () => void;
  onNavigateToMembership: () => void;
}

export const StudentSchedulePage: React.FC<StudentSchedulePageProps> = ({ user }) => {
  const { classes, groups, instructors } = useData(); 
  
  const [selectedClass, setSelectedClass] = useState<DanceClass | null>(null);
  const [mobileSelectedDay, setMobileSelectedDay] = useState<string>('Luni');
  
  // Filter States
  const [styleFilter, setStyleFilter] = useState<string>('Toate');
  const [levelFilter, setLevelFilter] = useState<string>('Toate');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  // Helper to get the correct avatar from the Instructors Collection (Dynamic)
  const getInstructorAvatar = (inst: { id?: string; name: string; avatarUrl?: string }) => {
      if (inst.id) {
          const match = instructors.find(i => i.id === inst.id);
          if (match) return match.avatarUrl;
      }
      const safeInstName = (inst.name || '').toLowerCase();
      const matchName = instructors.find(i => (i.name || '').toLowerCase().includes(safeInstName) || safeInstName.includes((i.name || '').toLowerCase()));
      if (matchName) return matchName.avatarUrl;
      return inst.avatarUrl || 'https://via.placeholder.com/150?text=Instr';
  };

  // Intelligent check: Does this specific class instance match any of the user's enrolled groups?
  const isEnrolled = (cls: DanceClass) => {
      // 1. Get Day Name from Class Date to match Group Schedule
      const d = new Date(cls.date);
      const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
      const dayName = days[d.getDay()];

      return user.enrollments.some(enr => {
          // Find the group object for this enrollment
          const group = groups.find(g => g.id === enr.groupId);
          if (!group) return false;

          // Check if Group matches Class Instance
          // Match logic: Same Day, Same Time, Same Style
          // This allows matching specific instances to the recurring group enrollment
          return group.schedule.day === dayName && 
                 group.schedule.time === cls.time && 
                 group.style === cls.style;
      });
  };

  const isFull = (cls: DanceClass) => {
      return (cls.occupancy?.current || 0) >= (cls.occupancy?.max || 999);
  };

  // Filter classes directly from Context (Real Data)
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesStyle = styleFilter === 'Toate' || cls.style === styleFilter;
      const matchesLevel = levelFilter === 'Toate' || normalizeLevel(cls.level) === levelFilter || cls.level === levelFilter;
      const matchesEnrollment = !showEnrolledOnly || isEnrolled(cls);
      return matchesStyle && matchesLevel && matchesEnrollment;
    });
  }, [styleFilter, levelFilter, showEnrolledOnly, user, classes, groups]);

  // Mobile Filtered Classes (Date based on mobileSelectedDay)
  const mobileClasses = useMemo(() => {
      const dayMap: Record<string, number> = { 'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6, 'Duminică': 0 };
      const targetDate = getCurrentWeekDate(dayMap[mobileSelectedDay] || 1);

      return filteredClasses.filter(c => c.date === targetDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredClasses, mobileSelectedDay]);

  const renderDayColumn = (dayName: string, dayIndex: number, classList: DanceClass[]) => {
      const dateStr = getCurrentWeekDate(dayIndex);
      // Filter the global class list for this specific date
      const dayClasses = classList.filter(c => c.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

      return (
          <div className="flex flex-col h-full flex-1 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm min-w-[280px]">
              <div className="p-4 text-center border-b border-gray-100 bg-white">
                  <h3 className="text-lg font-black text-gray-900 mb-0.5">{dayName}</h3>
                  <p className="text-xs font-medium text-gray-400">{dateStr}</p>
              </div>
              <div className="flex-1 p-3 space-y-3 bg-[#F9FAFB] overflow-y-auto no-scrollbar">
                  {dayClasses.length > 0 ? (
                      dayClasses.map(cls => (
                          <ScheduleClassCard 
                            key={cls.id}
                            cls={cls}
                            isEnrolled={isEnrolled(cls)}
                            isFull={isFull(cls)}
                            onClick={setSelectedClass}
                            getInstructorAvatar={getInstructorAvatar}
                          />
                      ))
                  ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-2xl mx-2">
                          <Calendar size={24} className="mb-2 opacity-20"/>
                          <span className="text-xs font-bold uppercase">Liber</span>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-10 font-sans antialiased flex flex-col">
      <main className="flex-1 overflow-y-auto no-scrollbar p-6">
        
        {/* Header with Week Range */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Orar Săptămânal</h1>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <CalendarRange size={16} />
                    <span className="text-sm font-bold">{getWeekRangeString()}</span>
                </div>
            </div>
        </div>

        {/* Quick Filters - Sticky Top */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4 items-center sticky top-0 bg-[#F9FAFB]/95 backdrop-blur-sm z-30 pt-2 md:justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm h-[42px] shrink-0">
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Doar cursurile mele</span>
                <Switch checked={showEnrolledOnly} onChange={setShowEnrolledOnly} />
            </div>
            <select 
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-gray-900 shadow-sm min-w-[120px]"
            >
              <option value="Toate">Toate Stilurile</option>
              {Object.values(DanceStyle).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-gray-900 shadow-sm min-w-[120px]"
            >
              <option value="Toate">Toate Nivelurile</option>
              {['Start', 'Începător', 'Intermediar', 'Avansat'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
        </div>

        {/* --- MOBILE VIEW (md:hidden) --- */}
        <div className="md:hidden flex flex-col gap-4">
            {/* Day Tabs (Mon-Thu) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
                {['Luni', 'Marți', 'Miercuri', 'Joi'].map(day => (
                    <button
                        key={day}
                        onClick={() => setMobileSelectedDay(day)}
                        className={`px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all ${
                            mobileSelectedDay === day 
                            ? 'bg-gray-900 text-white shadow-lg transform scale-105' 
                            : 'bg-white text-gray-400 border border-gray-200'
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Mobile List */}
            <div className="space-y-3 pb-20">
                {mobileClasses.length > 0 ? (
                    mobileClasses.map(cls => (
                        <ScheduleClassCard 
                            key={cls.id}
                            cls={cls}
                            isEnrolled={isEnrolled(cls)}
                            isFull={isFull(cls)}
                            onClick={setSelectedClass}
                            getInstructorAvatar={getInstructorAvatar}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Calendar size={48} className="mb-3 opacity-20"/>
                        <p className="text-sm font-bold">Nicio clasă găsită</p>
                        <p className="text-xs">Încearcă altă zi sau alte filtre.</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- DESKTOP VIEW (hidden md:block) --- */}
        <div className="hidden md:block">
            {/* UNIFIED SCHEDULE GRID */}
            <div className="flex gap-4 items-stretch overflow-x-auto pb-4">
                {['Luni', 'Marți', 'Miercuri', 'Joi'].map((day, idx) => (
                    <div key={day} className="flex-1 min-w-[280px]">
                        {renderDayColumn(day, idx + 1, filteredClasses)}
                    </div>
                ))}
            </div>
        </div>

      </main>

      <ScheduleClassModal 
          cls={selectedClass}
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          isEnrolled={selectedClass ? isEnrolled(selectedClass) : false}
          isFull={selectedClass ? isFull(selectedClass) : false}
          getInstructorAvatar={getInstructorAvatar}
      />
    </div>
  );
};
