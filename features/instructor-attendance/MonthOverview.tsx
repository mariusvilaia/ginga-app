
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Clock } from 'lucide-react';
import { InstructorAttendanceRecord, DanceClass } from '../../types';
import { getAttendanceStyle } from '../../utils/themeUtils';
import { useData } from '../../contexts/DataContext';

interface MonthOverviewProps {
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onDayClick: (records: InstructorAttendanceRecord[], dateLabel: string) => void;
    onInstructorClick: (id: string) => void;
}

export const MonthOverview: React.FC<MonthOverviewProps> = ({ 
    currentDate, 
    onPrevMonth, 
    onNextMonth, 
    onDayClick, 
    onInstructorClick 
}) => {
    const { instructors, classes, instructorAttendance, unavailabilities } = useData(); 

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const monthName = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(currentDate);
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const generatedMonthData = useMemo(() => {
        const records: Record<string, InstructorAttendanceRecord[]> = {}; 
        
        const findInstructorIdByName = (partialName: string) => {
            const match = instructors.find(i => 
                i.name?.toLowerCase().includes(partialName.toLowerCase()) || 
                partialName.toLowerCase().includes((i.name || '').split(' ')[0].toLowerCase())
            );
            return match ? match.id : null;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDayDate = new Date(year, month, d);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayIndex = currentDayDate.getDay(); 

            const templateClassesForDay = classes.filter(cls => {
                const clsDate = new Date(cls.date);
                return clsDate.getDay() === dayIndex; 
            });

            templateClassesForDay.forEach(cls => {
                cls.instructors.forEach(instInfo => {
                    const instructorId = instInfo.id || findInstructorIdByName(instInfo.name);
                    
                    if (instructorId) {
                        const key = `${instructorId}-${d}`;
                        if (!records[key]) records[key] = [];

                        const override = instructorAttendance.find(r => 
                            r.instructorId === instructorId &&
                            r.date === dateStr &&
                            (r.className === cls.title || r.time === cls.time)
                        );

                        if (override) {
                            if (override.status === 'substitute') {
                                records[key].push({
                                    ...override,
                                    status: 'absent',
                                    note: `Suplinitor: ${override.actualInstructorId ? instructors.find(i => i.id === override.actualInstructorId)?.name.split(' ')[0] : 'Necunoscut'}`
                                });
                            } else {
                                records[key].push(override);
                            }
                        } else {
                            const isUnavailable = unavailabilities.find(u => 
                                u.instructorId === instructorId &&
                                new Date(dateStr) >= new Date(u.startDate) && 
                                new Date(dateStr) <= new Date(u.endDate)
                            );

                            records[key].push({
                                id: `gen_${instructorId}_${dateStr}_${cls.time}`,
                                date: dateStr,
                                time: cls.time,
                                instructorId: instructorId,
                                status: isUnavailable ? 'absent' : 'titular', 
                                className: cls.title,
                                room: cls.room,
                                classId: cls.id,
                                note: isUnavailable ? isUnavailable.reason : undefined
                            });
                        }
                    }
                });
            });
        }
        
        instructorAttendance.forEach(att => {
            if (att.status === 'substitute' && att.actualInstructorId) {
                const attDate = new Date(att.date);
                if (attDate.getMonth() === month && attDate.getFullYear() === year) {
                    const day = attDate.getDate();
                    const key = `${att.actualInstructorId}-${day}`;
                    if (!records[key]) records[key] = [];
                    if (!records[key].find(r => r.id === att.id)) {
                        records[key].push({
                            ...att,
                            instructorId: att.actualInstructorId, 
                            substituteForId: att.instructorId
                        });
                    }
                }
            }
        });

        return records;
    }, [year, month, instructors, classes, instructorAttendance, unavailabilities]); 

    const kpis = useMemo(() => {
        let totalHours = 0; let titular = 0; let substitutes = 0; let absent = 0;
        (Object.values(generatedMonthData) as InstructorAttendanceRecord[][]).forEach(dayRecords => {
            dayRecords.forEach(rec => {
                if (rec.status === 'titular' || rec.status === 'substitute') totalHours++;
                if (rec.status === 'titular') titular++;
                if (rec.status === 'substitute') substitutes++;
                if (rec.status === 'absent' || rec.status === 'cancelled') absent++;
            });
        });
        return { totalHours, titular, substitutes, absent };
    }, [generatedMonthData]);

    const getDayLetter = (day: number) => {
        const letterMap = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return letterMap[new Date(year, month, day).getDay()];
    };

    const isToday = (day: number) => {
        const now = new Date();
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-4">
                     <button onClick={onPrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                     <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 min-w-[200px] justify-center capitalize">
                        <Calendar size={20} className="text-blue-600"/> {capitalizedMonthName}
                     </h2>
                     <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronRight size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">Total Ore</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{kpis.totalHours}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                    <p className="text-[10px] font-bold uppercase text-green-600 mb-1">Titulari</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{kpis.titular}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">Supliniri</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{kpis.substitutes}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                    <p className="text-[10px] font-bold uppercase text-red-600 mb-1">Absențe</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{kpis.absent}</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                <div className="flex-1 overflow-auto no-scrollbar relative">
                    <div className="min-w-max">
                        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-0 z-40">
                            <div className="min-w-[200px] p-4 sticky left-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-50 font-bold text-gray-500 text-xs uppercase">Instructor</div>
                            {days.map(day => (
                                <div key={day} className={`min-w-[44px] p-2 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 flex flex-col items-center justify-center ${new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6 ? 'bg-gray-100/50 dark:bg-gray-800' : ''}`}>
                                    <span className="text-[10px] text-gray-400 font-bold mb-0.5">{getDayLetter(day)}</span>
                                    <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-white'}`}>{day}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            {instructors.map(instructor => (
                                <div key={instructor.id} className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors h-16 group/row relative">
                                    <div className="min-w-[200px] px-4 py-2 sticky left-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onInstructorClick(instructor.id)}>
                                        <img src={instructor.avatarUrl} className="w-9 h-9 rounded-full border border-gray-100 dark:border-gray-700 object-cover" />
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">{instructor.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{(instructor.styles || []).join(', ')}</p>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        {days.map(day => {
                                            const key = `${instructor.id}-${day}`;
                                            const dailyRecords = generatedMonthData[key] || [];
                                            const hasClasses = dailyRecords.length > 0;
                                            const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                                            const isFuture = new Date(year, month, day) > new Date();
                                            return (
                                                <div key={day} className={`min-w-[44px] border-r border-gray-50 dark:border-gray-800 last:border-0 p-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${hasClasses ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : ''} ${isWeekend ? 'bg-gray-50/30 dark:bg-gray-800/30' : ''}`} onClick={() => hasClasses && onDayClick(dailyRecords, `${day} ${capitalizedMonthName}`)}>
                                                    {dailyRecords.slice(0, 3).map((rec, i) => (
                                                        <div key={i} className={`w-2.5 h-2.5 rounded-full shadow-sm ${getAttendanceStyle(rec.status, isFuture)}`}></div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
