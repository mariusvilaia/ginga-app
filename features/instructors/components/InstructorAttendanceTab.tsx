
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, CheckCircle, XCircle, HelpCircle, Calendar, Users, AlertTriangle } from 'lucide-react';
import { InstructorProfile, InstructorAttendanceRecord, DanceClass, VacationPeriod } from '../../../types';
import { Badge, Modal } from '../../../components/UIComponents';

interface InstructorAttendanceTabProps {
    instructor: InstructorProfile;
    attendance: InstructorAttendanceRecord[];
    allClasses: DanceClass[];
    vacationPeriods: VacationPeriod[];
    onUpdateStatus: (recordId: string, status: string) => void;
}

export const InstructorAttendanceTab: React.FC<InstructorAttendanceTabProps> = ({ 
    instructor, 
    attendance, 
    allClasses, 
    vacationPeriods,
    onUpdateStatus 
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Helpers for Calendar
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(currentDate);

    // Map attendance for quick lookup
    const attendanceMap = useMemo(() => {
        const map: Record<string, InstructorAttendanceRecord[]> = {};
        attendance.filter(a => a.instructorId === instructor.id).forEach(rec => {
            if (!map[rec.date]) map[rec.date] = [];
            map[rec.date].push(rec);
        });
        return map;
    }, [attendance, instructor.id]);

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

    const isHoliday = (dateStr: string) => {
        return vacationPeriods.some(p => dateStr >= p.startDate && dateStr <= p.endDate);
    };

    // Get classes for the day where this instructor is assigned
    const getDayClasses = (dayStr: string) => {
        const targetDateObj = new Date(dayStr);
        const dayOfWeek = targetDateObj.getDay();

        return allClasses.filter(c => {
            const cDate = new Date(c.date);
            const matchesDay = c.date === dayStr || cDate.getDay() === dayOfWeek;
            if (!matchesDay) return false;
            
            // Check if instructor is assigned to this class
            return c.instructors.some(i => i.id === instructor.id || (i.name && instructor.name && i.name.includes(instructor.name)));
        });
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prezență medie elevi</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">86%</span>
                        <Users size={16} className="text-blue-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Absențe instructor</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">1</span>
                        <AlertTriangle size={16} className="text-amber-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ore anulate</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">0</span>
                        <XCircle size={16} className="text-red-500" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total ședințe lună</p>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">22</span>
                        <Calendar size={16} className="text-indigo-500" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white capitalize">{monthName}</h3>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronRight size={20}/></button>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Prezent</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Absent</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-300"></div> Programat</div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => (
                        <div key={idx} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for start of month (Monday start) */}
                    {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    
                    {/* Days */}
                    {days.map(day => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayRecords = attendanceMap[dateStr] || [];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const scheduledClasses = getDayClasses(dateStr);
                        const isVacation = isHoliday(dateStr);

                        // Build Indicator Dots
                        const indicators: string[] = [];
                        if (!isVacation) {
                            scheduledClasses.forEach(cls => {
                                const record = dayRecords.find(r => r.classId === cls.id || r.className === cls.title);
                                if (record) {
                                    indicators.push(record.status);
                                } else {
                                    indicators.push('expected');
                                }
                            });
                        }

                        const hasActivity = indicators.length > 0;
                        
                        let bgClass = isVacation 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' 
                            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white';

                        if (isToday) {
                            bgClass += ' ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900';
                        }

                        return (
                            <div 
                                key={day} 
                                onClick={() => setSelectedDay(dateStr)}
                                className={`
                                    aspect-square rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md relative group
                                    ${bgClass}
                                    ${hasActivity ? 'shadow-sm' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
                                <div className="flex gap-1 mt-1 flex-wrap justify-center px-1 max-w-full">
                                    {indicators.slice(0, 4).map((status, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`w-2.5 h-2.5 rounded-full ${
                                                (status === 'titular' || status === 'substitute') ? 'bg-green-500' : 
                                                status === 'absent' ? 'bg-red-500' : 
                                                'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        />
                                    ))}
                                    {indicators.length > 4 && <div className="w-1 h-1 bg-gray-400 rounded-full self-center"></div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* DAY MODAL */}
        {selectedDay && (
            <InstructorAttendanceDayModal 
                date={selectedDay}
                records={attendanceMap[selectedDay] || []}
                scheduledClasses={getDayClasses(selectedDay)}
                onClose={() => setSelectedDay(null)}
                onUpdateStatus={onUpdateStatus}
            />
        )}
    </div>
);
};

const InstructorAttendanceDayModal: React.FC<{
    date: string;
    records: InstructorAttendanceRecord[];
    scheduledClasses: DanceClass[];
    onClose: () => void;
    onUpdateStatus: (recordId: string, status: string) => void;
}> = ({ date, records, scheduledClasses, onClose, onUpdateStatus }) => {
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = date > todayStr;

    return (
        <Modal isOpen={true} onClose={onClose} title={`Prezență Instructor: ${new Date(date).toLocaleDateString('ro-RO')}`}>
            <div className="space-y-4">
                {scheduledClasses.length > 0 ? (
                    scheduledClasses.map(cls => {
                        const record = records.find(r => r.classId === cls.id || r.className === cls.title);
                        const status = record?.status || 'unset';
                        
                        return (
                            <div key={cls.id || cls.title} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{cls.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {cls.time}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {cls.room}</span>
                                        </div>
                                    </div>
                                    <Badge color={(status === 'titular' || status === 'substitute') ? 'bg-green-100 text-green-700' : status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}>
                                        {status === 'titular' ? 'Titular' : status === 'substitute' ? 'Substitut' : status === 'absent' ? 'Absent' : 'Nesetat'}
                                    </Badge>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => record && onUpdateStatus(record.id, 'titular')}
                                        disabled={isFuture || !record}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            status === 'titular' 
                                            ? 'bg-green-600 text-white shadow-md' 
                                            : (isFuture || !record)
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600'
                                        }`}
                                    >
                                        Titular
                                    </button>
                                    <button 
                                        onClick={() => record && onUpdateStatus(record.id, 'substitute')}
                                        disabled={isFuture || !record}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            status === 'substitute' 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : (isFuture || !record)
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                        }`}
                                    >
                                        Substitut
                                    </button>
                                    <button 
                                        onClick={() => record && onUpdateStatus(record.id, 'absent')}
                                        disabled={isFuture || !record}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            status === 'absent' 
                                            ? 'bg-red-600 text-white shadow-md' 
                                            : (isFuture || !record)
                                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300 hover:text-red-600'
                                        }`}
                                    >
                                        Absent
                                    </button>
                                </div>
                                {!record && !isFuture && (
                                    <p className="text-[10px] text-amber-600 font-bold mt-2 text-center">Nicio înregistrare de prezență găsită pentru această clasă.</p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-20"/>
                        <p className="text-sm">Nicio clasă programată în această zi.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
