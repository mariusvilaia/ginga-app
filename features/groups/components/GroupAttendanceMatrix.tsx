
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Search, CheckCircle, XCircle, Clock, UserPlus, Trash2, MoreVertical, Check, Ticket } from 'lucide-react';
import { StudentDetailedProfile, GroupDetailedProfile } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { normalizeText, smartSearch } from '../../../utils/searchUtils';
import { Modal, Button } from '../../../components/UIComponents';

interface GroupAttendanceMatrixProps {
    group: GroupDetailedProfile;
    students: StudentDetailedProfile[];
    onNavigateToStudent?: (studentId: string) => void;
}

export const GroupAttendanceMatrix: React.FC<GroupAttendanceMatrixProps> = ({ group, students, onNavigateToStudent }) => {
    const { updateStudent, removeStudentFromGroup, students: allStudents } = useData(); 
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    
    // Guest Add State
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [guestSearch, setGuestSearch] = useState('');
    const [guestDate, setGuestDate] = useState(new Date().toISOString().split('T')[0]);

    // Mobile State
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const dayScrollRef = useRef<HTMLDivElement>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const RO_DAY_MAP: Record<string, number> = {
        'Duminică': 0, 'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6
    };

    const targetDayIndex = RO_DAY_MAP[group.schedule.day];

    // Filter days to only show the scheduled day of the week
    const days = useMemo(() => {
        const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        if (targetDayIndex === undefined) return allDays;
        
        return allDays.filter(d => new Date(year, month, d).getDay() === targetDayIndex);
    }, [year, month, daysInMonth, targetDayIndex]);

    const monthName = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(currentDate);
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Ensure selectedDay on mobile is valid within the filtered days
    useEffect(() => {
        if (days.length > 0 && !days.includes(selectedDay)) {
            const today = new Date().getDate();
            // If viewing current month, try to select today or closest day
            if (month === new Date().getMonth() && year === new Date().getFullYear()) {
                 const closest = days.reduce((prev, curr) => 
                    Math.abs(curr - today) < Math.abs(prev - today) ? curr : prev
                );
                setSelectedDay(closest);
            } else {
                // Otherwise default to first available day
                setSelectedDay(days[0]);
            }
        }
    }, [days, selectedDay, month, year]);

    // Scroll active day into view on mobile
    useEffect(() => {
        if (dayScrollRef.current) {
            const activeDayEl = dayScrollRef.current.querySelector(`[data-day="${selectedDay}"]`) as HTMLElement;
            if (activeDayEl) {
                const scrollLeft = activeDayEl.offsetLeft - dayScrollRef.current.offsetWidth / 2 + activeDayEl.offsetWidth / 2;
                dayScrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [selectedDay]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(prev.getMonth() + 1);
            return d;
        });
    };

    const getDayLetter = (day: number) => {
        const specificDate = new Date(year, month, day);
        const dayIndex = specificDate.getDay();
        const letterMap = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return letterMap[dayIndex];
    };

    const isToday = (day: number) => {
        const now = new Date();
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    };

    // Filter Students for Matrix View
    const filteredStudents = useMemo(() => {
        return students.filter(s => smartSearch(searchTerm, s.name));
    }, [students, searchTerm]);

    // KPI Calculations for the displayed month
    const kpis = useMemo(() => {
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;

        filteredStudents.forEach(student => {
            student.attendanceHistory?.forEach(record => {
                const recDate = new Date(record.date);
                if (recDate.getMonth() === month && recDate.getFullYear() === year && record.className === group.name) {
                    if (record.status === 'present') totalPresent++;
                    if (record.status === 'absent') totalAbsent++;
                    if (record.status === 'late') totalLate++;
                }
            });
        });

        const totalRecords = totalPresent + totalAbsent + totalLate;
        const rate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

        return { totalPresent, totalAbsent, rate };
    }, [filteredStudents, month, year, group.name]);

    // Toggle Attendance
    const handleCellClick = async (student: StudentDetailedProfile, day: number, forceStatus?: 'present' | 'absent' | 'late' | 'none') => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayDate = new Date(year, month, day);
        
        // Prevent editing future
        if (dayDate > new Date()) {
            if(!forceStatus) return; // Allow if forcing (e.g. scheduling?) but generally block
        }

        const existingRecordIndex = student.attendanceHistory?.findIndex(
            r => r.date === dateStr && r.className === group.name
        );

        let newHistory = [...(student.attendanceHistory || [])];
        let newStats = { ...student.stats };

        if (existingRecordIndex !== undefined && existingRecordIndex >= 0) {
            const currentStatus = newHistory[existingRecordIndex].status;
            
            if (forceStatus) {
                // Direct set
                if (forceStatus === 'none') {
                    newHistory.splice(existingRecordIndex, 1);
                    if (currentStatus === 'present') newStats.totalClasses = Math.max(0, (newStats.totalClasses || 0) - 1);
                } else {
                    newHistory[existingRecordIndex].status = forceStatus;
                    if (currentStatus === 'present' && forceStatus !== 'present') newStats.totalClasses = Math.max(0, (newStats.totalClasses || 0) - 1);
                    if (currentStatus !== 'present' && forceStatus === 'present') newStats.totalClasses = (newStats.totalClasses || 0) + 1;
                }
            } else {
                // Cycle: Present -> Absent -> Removed
                if (currentStatus === 'present') {
                    newHistory[existingRecordIndex].status = 'absent';
                    newStats.totalClasses = Math.max(0, (newStats.totalClasses || 0) - 1);
                } else if (currentStatus === 'absent') {
                    // Remove
                    newHistory.splice(existingRecordIndex, 1);
                } else {
                     newHistory[existingRecordIndex].status = 'present';
                     newStats.totalClasses = (newStats.totalClasses || 0) + 1;
                }
            }
        } else {
            if (forceStatus && forceStatus !== 'none') {
                newHistory.push({ date: dateStr, className: group.name, status: forceStatus });
                if (forceStatus === 'present') newStats.totalClasses = (newStats.totalClasses || 0) + 1;
            } else if (!forceStatus) {
                // Default toggle behavior: Add Present
                newHistory.push({ date: dateStr, className: group.name, status: 'present' });
                newStats.totalClasses = (newStats.totalClasses || 0) + 1;
            }
        }

        newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        await updateStudent(student.id, { attendanceHistory: newHistory, stats: newStats });
    };

    const handleRemoveStudent = async (studentId: string, studentName: string) => {
        if (window.confirm(`Sigur vrei să elimini cursantul ${studentName} din această grupă?`)) {
            await removeStudentFromGroup(studentId, group.id);
        }
    };

    const filteredAllStudents = useMemo(() => {
        if (!guestSearch) return [];
        const currentIds = new Set(students.map(s => s.id));
        return allStudents
            .filter(s => !currentIds.has(s.id) && smartSearch(guestSearch, s.name))
            .slice(0, 5);
    }, [allStudents, students, guestSearch]);

    const handleAddGuestAttendance = async (student: StudentDetailedProfile) => {
        const dateStr = guestDate;
        let newHistory = [...(student.attendanceHistory || [])];
        let newStats = { ...student.stats };
        const exists = newHistory.some(r => r.date === dateStr && r.className === group.name);

        if (!exists) {
            newHistory.push({ date: dateStr, className: group.name, status: 'present' });
            newStats.totalClasses = (newStats.totalClasses || 0) + 1;
            newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            await updateStudent(student.id, { attendanceHistory: newHistory, stats: newStats });
            setIsGuestModalOpen(false);
            setGuestSearch('');
        } else {
            alert('Acest student are deja o prezență înregistrată pentru această dată și grupă.');
        }
    };

    const getStatusStyle = (status: string | undefined) => {
        switch(status) {
            case 'present': return 'bg-green-500 border border-green-600';
            case 'late': return 'bg-yellow-400 border border-yellow-500'; 
            case 'absent': return 'bg-red-500 border border-red-600';
            default: return 'bg-transparent';
        }
    };

    // Helper to get status for current selected day (Mobile)
    const getStudentStatusForDay = (student: StudentDetailedProfile, day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return student.attendanceHistory?.find(r => r.date === dateStr && r.className === group.name)?.status;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            
            {/* 1. Header Controls (Responsive) */}
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 sticky top-[52px] md:top-0 z-30 transition-all">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                     <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                     <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white capitalize text-center">
                        {capitalizedMonthName}
                     </h2>
                     <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronRight size={20}/></button>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Caută..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48 lg:w-64"
                        />
                    </div>
                    <Button onClick={() => setIsGuestModalOpen(true)} className="!w-auto h-9 px-3 text-xs gap-1 bg-gray-900 text-white shrink-0">
                        <UserPlus size={14}/> <span className="hidden sm:inline">Adaugă Vizitator</span>
                    </Button>
                </div>
            </div>

            {/* 2. KPI Strip (Shared) */}
            <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="bg-white dark:bg-gray-900 p-3 md:p-4 flex flex-col items-center justify-center">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase text-green-600 mb-1">Prezențe</p>
                    <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{kpis.totalPresent}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 md:p-4 flex flex-col items-center justify-center">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase text-red-600 mb-1">Absențe</p>
                    <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{kpis.totalAbsent}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 md:p-4 flex flex-col items-center justify-center">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase text-blue-600 mb-1">Rată</p>
                    <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{kpis.rate}%</p>
                </div>
            </div>

            {/* --- 3. MOBILE: DAY VIEW (md:hidden) --- */}
            <div className="md:hidden flex flex-col flex-1 overflow-hidden">
                {/* Horizontal Day Selector */}
                <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-3 shadow-sm z-20 sticky top-[136px]">
                    <div className="flex overflow-x-auto no-scrollbar px-4 gap-2" ref={dayScrollRef}>
                        {days.length > 0 ? days.map(day => {
                            const isSelected = selectedDay === day;
                            const isTodayDay = isToday(day);
                            const letter = getDayLetter(day);
                            return (
                                <button
                                    key={day}
                                    data-day={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`
                                        flex flex-col items-center justify-center min-w-[48px] h-14 rounded-2xl border transition-all shrink-0
                                        ${isSelected 
                                            ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' 
                                            : isTodayDay 
                                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                                : 'bg-white text-gray-400 border-gray-100'
                                        }
                                    `}
                                >
                                    <span className="text-[9px] font-bold uppercase opacity-80">{letter}</span>
                                    <span className="text-lg font-black leading-none">{day}</span>
                                </button>
                            );
                        }) : (
                            <div className="w-full text-center text-xs text-gray-400 py-4 italic">Nicio zi de curs luna aceasta.</div>
                        )}
                    </div>
                </div>

                {/* Vertical Student List for Selected Day */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center px-1 mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {filteredStudents.length} Cursanți • {selectedDay} {monthName}
                        </span>
                    </div>
                    
                    {filteredStudents.map(student => {
                        const status = getStudentStatusForDay(student, selectedDay);
                        const isEnrolled = student.enrollments?.some(e => e.groupId === group.id);

                        return (
                            <div key={student.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="relative shrink-0">
                                        <img src={student.avatarUrl} className="w-10 h-10 rounded-full bg-gray-100 object-cover border border-gray-100 dark:border-gray-600" alt={student.name} />
                                        {!isEnrolled && (
                                            <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full p-[2px] border-2 border-white dark:border-gray-900 shadow-sm" title="Vizitator">
                                                <Ticket size={10} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{student.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{student.subscription.type} • {isEnrolled ? 'Înscris' : 'Vizitator'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Action Buttons */}
                                    <button 
                                        onClick={() => handleCellClick(student, selectedDay, status === 'present' ? 'none' : 'present')}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                            status === 'present' 
                                            ? 'bg-green-500 text-white shadow-md' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-300 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleCellClick(student, selectedDay, status === 'absent' ? 'none' : 'absent')}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                            status === 'absent' 
                                            ? 'bg-red-500 text-white shadow-md' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-300 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                    >
                                        <XCircle size={20} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onNavigateToStudent && onNavigateToStudent(student.id); }}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    
                    <div className="h-16"></div> {/* Bottom Spacer */}
                </div>
            </div>

            {/* --- 4. DESKTOP: MATRIX VIEW (hidden md:flex) --- */}
            <div className="hidden md:flex flex-col flex-1 overflow-hidden relative">
                {/* Unified Scroll Container - FIX FOR SYNC SCROLLING */}
                <div className="flex-1 overflow-auto no-scrollbar">
                    <div className="w-full min-w-max">
                        {/* Header Row - Sticky Top */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 sticky top-0 z-40">
                            {/* Sticky Left Corner (Name Header) */}
                            <div className="min-w-[280px] p-4 sticky left-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-50 font-bold text-gray-500 text-xs uppercase flex items-center shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-none">
                                Cursant ({filteredStudents.length})
                            </div>
                            {/* Date Columns */}
                            {days.map(day => {
                                const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                                return (
                                    <div key={day} className={`flex-1 min-w-[60px] p-2 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 flex flex-col items-center justify-center group ${isWeekend ? 'bg-gray-100/50 dark:bg-gray-800' : ''}`}>
                                        <span className="text-[10px] text-gray-400 font-bold mb-0.5 group-hover:text-blue-500">{getDayLetter(day)}</span>
                                        <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-white'}`}>{day}</span>
                                    </div>
                                );
                            })}
                            {days.length === 0 && (
                                <div className="p-4 text-xs font-bold text-gray-400 italic flex-1">Nicio zi programată.</div>
                            )}
                        </div>

                        {/* Body Rows */}
                        <div className="flex flex-col">
                            {filteredStudents.map(student => {
                                const isEnrolled = student.enrollments?.some(e => e.groupId === group.id);

                                return (
                                    <div key={student.id} className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors h-14 group/row relative">
                                        {/* Sticky Left Column (Student Info) */}
                                        <div 
                                            className="min-w-[280px] px-4 py-2 sticky left-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 flex items-center gap-3 relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-none"
                                            onClick={() => onNavigateToStudent && onNavigateToStudent(student.id)}
                                        >
                                            <div className="relative shrink-0">
                                                <img src={student.avatarUrl} className="w-9 h-9 rounded-full border border-gray-100 dark:border-gray-700 object-cover" alt={student.name} />
                                                {!isEnrolled && (
                                                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white rounded-full p-[2px] border-2 border-white dark:border-gray-900 shadow-sm" title="Vizitator">
                                                        <Ticket size={8} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex flex-col justify-center flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight hover:text-blue-600 transition-colors">{student.name}</p>
                                                </div>
                                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{student.subscription.type}</p>
                                            </div>
                                            
                                            {/* DELETE BUTTON */}
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleRemoveStudent(student.id, student.name); 
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover/row:opacity-100 transition-all z-20"
                                                title="Elimină din grupă"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        
                                        {/* Grid Cells */}
                                        <div className="flex flex-1 w-full">
                                            {days.map(day => {
                                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                                                const isFuture = new Date(year, month, day) > new Date();

                                                // Find Status
                                                const record = student.attendanceHistory?.find(r => r.date === dateStr && r.className === group.name);
                                                const status = record?.status;

                                                return (
                                                    <div 
                                                        key={day} 
                                                        className={`flex-1 min-w-[60px] border-r border-gray-50 dark:border-gray-800 last:border-0 p-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${isWeekend ? 'bg-gray-50/30 dark:bg-gray-800/30' : ''} ${!isFuture ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : ''}`}
                                                        onClick={() => handleCellClick(student, day)}
                                                    >
                                                        {status ? (
                                                            <div className={`w-3 h-3 rounded-full shadow-sm ${getStatusStyle(status)}`} title={status}></div>
                                                        ) : (
                                                            !isFuture && !isWeekend && (
                                                                <div className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                                            )
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer Legend */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex gap-4 justify-center text-[10px] font-bold text-gray-500 uppercase hidden md:flex">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Prezent</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Absent</div>
            </div>

            {/* GUEST MODAL */}
            <Modal isOpen={isGuestModalOpen} onClose={() => setIsGuestModalOpen(false)} title="Adaugă Vizitator">
                <div className="space-y-6">
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs leading-relaxed border border-blue-100">
                        <strong>Info:</strong> Această acțiune va adăuga o prezență în istoricul cursantului și îl va afișa în lista de mai sus.
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Data Prezenței</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-white font-bold text-sm outline-none focus:border-blue-500 text-gray-900"
                            value={guestDate}
                            onChange={(e) => setGuestDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Caută Cursant</label>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Nume, telefon..." 
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white font-medium text-sm outline-none focus:border-blue-500"
                                value={guestSearch}
                                onChange={(e) => setGuestSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                        {filteredAllStudents.map(student => (
                            <button 
                                key={student.id}
                                onClick={() => handleAddGuestAttendance(student)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <img src={student.avatarUrl} className="w-8 h-8 rounded-full bg-gray-100 object-cover" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                        <p className="text-[10px] text-gray-500">{student.subscription.type}</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500 text-white transition-all">
                                    <UserPlus size={14} />
                                </div>
                            </button>
                        ))}
                        {guestSearch && filteredAllStudents.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-4">Niciun rezultat găsit.</p>
                        )}
                        {!guestSearch && (
                            <p className="text-center text-xs text-gray-400 py-4">Începe să scrii pentru a căuta.</p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
