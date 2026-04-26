
import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  CheckCircle2,
  CalendarRange
} from 'lucide-react';
import { UserProfile, DanceClass, DanceStyle, SkillLevel } from '../../types';
import { Button, Modal, Badge, Switch } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';

interface StudentSchedulePageProps {
  user: UserProfile;
  onBack: () => void;
  onNavigateToMembership: () => void;
}

// --- HELPERS ---

// 1. Normalize Terminology (Improvers -> Intermediar)
const normalizeLevel = (level: SkillLevel): string => {
    if (level === SkillLevel.IMPROVERS) return 'Intermediar';
    return level;
};

// 2. Get Dates for Current Week (Mon-Thu only as requested)
const getCurrentWeekDate = (dayIndex: number): string => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon...
    // Calculate distance to Monday (1)
    // If Sunday (0), diff is -6. If Monday (1), diff is 0.
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    
    // Target date based on Monday
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (dayIndex - 1));
    
    return targetDate.toISOString().split('T')[0];
};

const getWeekRangeString = () => {
    const startStr = getCurrentWeekDate(1); // Monday
    const endStr = getCurrentWeekDate(4);   // Thursday (since we only have classes Mon-Thu)
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    return `${start.toLocaleDateString('ro-RO', options)} – ${end.toLocaleDateString('ro-RO', options)} ${end.getFullYear()}`;
};

// 3. Format Title (Remove Level Redundancy)
const formatClassTitle = (title: string): string => {
    // Remove content in parenthesis if it looks like level info
    let cleaned = (title || '').replace(/\(([^)]*?)(Începători|Incepatori|Intermediari|Avansați|Advanced|Beginners|Improvers)([^)]*?)\)/gi, '');

    // Aggressively remove level keywords
    cleaned = cleaned.replace(/\b(Începători|Începător|Incepatori|Incepator|Intermediari|Intermediar|Avansați|Avansati|Avansat|Improvers|Beginners|Beginner|Advanced|Adv|Inter-Adv|Inter-Advanced|Intermediate|Int|Gen|General|All Levels|Open Level)\b/gi, '');
    
    // Remove standalone numbers often used for levels (e.g. "Bachata 1") but preserve "On1", "On2"
    // We use a negative lookbehind to ensure the number isn't preceded by letters (like "On")
    cleaned = cleaned.replace(/(?<![a-zA-Z])\b[1-4]\b/g, '');

    // Cleanup: collapse multiple spaces to one, trim ends, remove trailing hyphens
    return cleaned
        .replace(/\s+/g, ' ')
        .replace(/\s-\s?$/, '')
        .trim();
};

export const StudentSchedulePage: React.FC<StudentSchedulePageProps> = ({ user, onBack, onNavigateToMembership }) => {
  const { classes, instructors } = useData(); // Get Live Data
  
  const [selectedClass, setSelectedClass] = useState<DanceClass | null>(null);
  const [mobileSelectedDay, setMobileSelectedDay] = useState<string>('Luni');
  
  // Filter States
  const [styleFilter, setStyleFilter] = useState<string>('Toate');
  const [levelFilter, setLevelFilter] = useState<string>('Toate');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  // Helper to get the correct avatar from the Instructors Collection (Dynamic)
  const getInstructorAvatar = (inst: { id?: string; name: string; avatarUrl?: string }) => {
      // 1. Try matching by ID
      if (inst.id) {
          const match = instructors.find(i => i.id === inst.id);
          if (match) return match.avatarUrl;
      }
      // 2. Try matching by Name (fuzzy)
      const safeInstName = (inst.name || '').toLowerCase();
      const matchName = instructors.find(i => (i.name || '').toLowerCase().includes(safeInstName) || safeInstName.includes((i.name || '').toLowerCase()));
      if (matchName) return matchName.avatarUrl;

      // 3. Fallback to placeholder
      return inst.avatarUrl || 'https://via.placeholder.com/150?text=Instr';
  };

  const isEnrolled = (classId: string) => {
      return classId === 'c_tue_1930_salsa' || user.attendedClasses?.includes(classId);
  };

  const isFull = (cls: DanceClass) => {
      return cls.occupancy && cls.occupancy.current >= cls.occupancy.max;
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesStyle = styleFilter === 'Toate' || cls.style === styleFilter;
      // Loose matching for levels due to normalization
      const matchesLevel = levelFilter === 'Toate' || normalizeLevel(cls.level) === levelFilter || cls.level === levelFilter;
      const matchesEnrollment = !showEnrolledOnly || isEnrolled(cls.id);
      return matchesStyle && matchesLevel && matchesEnrollment;
    });
  }, [styleFilter, levelFilter, showEnrolledOnly, user, classes]);

  // Mobile Filtered Classes
  const mobileClasses = useMemo(() => {
      return filteredClasses.filter(c => {
          const d = new Date(c.date);
          const dayIndex = d.getDay(); // 0=Sun, 1=Mon
          const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
          return days[dayIndex] === mobileSelectedDay;
      }).sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredClasses, mobileSelectedDay]);

  // Helper to determine badge color based on Ginga palette
  const getLevelStyle = (levelName: string) => {
      const l = (levelName || '').toLowerCase();
      if (l.includes('începător') || l.includes('incepator') || l.includes('beginner')) {
          return 'bg-brand-green border-brand-green text-white shadow-sm';
      }
      if (l.includes('intermediar') || l.includes('improvers')) {
          return 'bg-brand-yellow border-brand-yellow text-gray-900 shadow-sm';
      }
      if (l.includes('avansat') || l.includes('advanced')) {
          return 'bg-ginga-600 border-ginga-600 text-white shadow-sm';
      }
      return 'bg-slate-800 border-slate-700 text-white shadow-sm';
  };

  const renderClassCard = (cls: DanceClass) => {
      const enrolled = isEnrolled(cls.id);
      const full = isFull(cls) && !enrolled;
      const normalizedLevel = normalizeLevel(cls.level);
      const levelStyle = getLevelStyle(normalizedLevel);
      const isMille = cls.room.includes('Mille');
      const locColor = isMille 
        ? 'bg-gray-100 text-gray-500 border-gray-200' 
        : 'bg-purple-50 text-purple-600 border-purple-100';

      return (
          <div 
              key={cls.id}
              onClick={() => !full && setSelectedClass(cls)}
              className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden group
                  ${enrolled 
                    ? 'bg-white border-brand-green shadow-md cursor-pointer hover:scale-[1.02] ring-1 ring-brand-green/20' 
                    : full 
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed grayscale'
                        : 'bg-white border-gray-100 text-gray-900 hover:shadow-md cursor-pointer hover:border-gray-200 hover:scale-[1.01]'
                  }
              `}
          >
              {/* STATUS BADGES (Absolute) */}
              {enrolled && (
                  <div className="absolute top-0 right-0 bg-brand-green text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl z-10 uppercase tracking-wider">
                      Înscris
                  </div>
              )}
              {full && (
                  <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-bl-xl z-10 uppercase tracking-wider">
                      Full
                  </div>
              )}

              {/* 1. TIME & LOCATION */}
              <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-black tracking-tight text-gray-900">
                      {cls.time}
                  </span>
                  <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${locColor}`}>
                      <MapPin size={10} /> 
                      {isMille ? 'Mille 18' : 'Victoriei'}
                  </div>
              </div>

              {/* 2. TITLE */}
              <h4 className="font-black text-base leading-tight line-clamp-2 text-gray-900 mb-2">
                  {formatClassTitle(cls.title)}
              </h4>

              {/* 3. FOOTER (Level & Instructors - STACKED LAYOUT) */}
              <div className="mt-auto pt-3 flex flex-col gap-3 border-t border-gray-50/50">
                  {/* Row 1: Level Badge */}
                  <div className="flex justify-start">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm ${levelStyle}`}>
                          {normalizedLevel}
                      </span>
                  </div>
                  
                  {/* Row 2: Instructors - Bigger Avatars & Names */}
                  <div className="flex items-center gap-3">
                      <div className="flex -space-x-4">
                          {(cls.instructors || []).slice(0,2).map((i, idx) => (
                              <img 
                                key={idx} 
                                src={getInstructorAvatar(i)} 
                                className="w-12 h-12 rounded-full border-2 object-cover border-white bg-gray-100 shadow-sm" 
                                alt={i.name}
                              />
                          ))}
                      </div>
                      <div className="flex flex-col justify-center">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Instructori</span>
                          <span className="text-sm font-black text-gray-900 leading-none">
                              {(cls.instructors || []).map(i => (i.name || '').split(' ')[0]).join(' & ')}
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderDayColumn = (dayName: string, dayIndex: number, classes: DanceClass[]) => {
      const dateStr = getCurrentWeekDate(dayIndex);
      const dayClasses = classes.filter(c => {
          const d = new Date(c.date);
          const cDayIndex = d.getDay() === 0 ? 7 : d.getDay();
          return cDayIndex === dayIndex;
      }).sort((a, b) => a.time.localeCompare(b.time));

      return (
          <div className="flex flex-col h-full flex-1 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm min-w-[280px]">
              <div className="p-4 text-center border-b border-gray-100 bg-white">
                  <h3 className="text-lg font-black text-gray-900 mb-0.5">{dayName}</h3>
                  <p className="text-xs font-medium text-gray-400">{dateStr}</p>
              </div>
              <div className="flex-1 p-3 space-y-3 bg-[#F9FAFB] overflow-y-auto no-scrollbar">
                  {dayClasses.length > 0 ? (
                      dayClasses.map(cls => renderClassCard(cls))
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
              {['Începător', 'Intermediar', 'Avansat'].map(l => <option key={l} value={l}>{l}</option>)}
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
                    mobileClasses.map(cls => renderClassCard(cls)) 
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

      {/* CLASS DETAIL MODAL */}
      <Modal 
        isOpen={!!selectedClass} 
        onClose={() => setSelectedClass(null)} 
        title="Detalii Curs"
      >
        {selectedClass && (
          <div className="space-y-6 pb-4">
             <div className="flex flex-col items-center text-center pt-2">
                <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{formatClassTitle(selectedClass.title)}</h2>
                <div className="flex gap-2">
                   <Badge color="bg-gray-900 text-white border-none">{selectedClass.style}</Badge>
                   <Badge color={getLevelStyle(normalizeLevel(selectedClass.level))}>{normalizeLevel(selectedClass.level)}</Badge>
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                      <Clock size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Ora</p>
                      <p className="text-sm font-black text-gray-900">{selectedClass.time} ({selectedClass.duration})</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                      <MapPin size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Locație</p>
                      <p className="text-sm font-black text-gray-900">{selectedClass.room}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm overflow-hidden">
                      {selectedClass.instructors?.[0] ? (
                        <img src={getInstructorAvatar(selectedClass.instructors[0])} className="w-full h-full object-cover" alt="Instructor" />
                      ) : (
                        <User size={20} />
                      )}
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Instructori</p>
                      <p className="text-sm font-black text-gray-900">{(selectedClass.instructors || []).map(i => (i.name || '').split(' ')[0]).join(' & ')}</p>
                   </div>
                </div>
             </div>

             {/* Action Buttons Logic */}
             <div className="pt-2">
                {isEnrolled(selectedClass.id) ? (
                    <div className="w-full py-4 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center justify-center text-green-700">
                        <CheckCircle2 size={32} className="mb-2"/>
                        <span className="font-black text-lg">Ești înscris!</span>
                        <span className="text-xs font-medium opacity-80">Te așteptăm la curs.</span>
                    </div>
                ) : isFull(selectedClass) ? (
                    <div className="w-full">
                        <Button 
                            disabled
                            className="w-full bg-gray-100 text-gray-400 border-none h-14 text-sm font-bold uppercase tracking-wide rounded-xl cursor-not-allowed"
                        >
                            Grupă Full
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">Listă de așteptare disponibilă la recepție.</p>
                    </div>
                ) : (
                    <Button 
                        onClick={() => {
                            alert('Te-ai înscris cu succes!');
                            setSelectedClass(null);
                        }}
                        className="w-full bg-gray-900 text-white hover:bg-black h-14 text-sm font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-gray-200"
                    >
                        Înscrie-te la această grupă
                    </Button>
                )}
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
