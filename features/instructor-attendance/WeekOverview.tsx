
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, Calendar, MapPin, Clock, User, CheckCircle, RefreshCw, UserX, AlertCircle, XCircle } from 'lucide-react';
import { InstructorAttendanceRecord } from '../../types';
import { getAttendanceStyle } from '../../utils/themeUtils';
import { useData } from '../../contexts/DataContext';

interface WeekOverviewProps {
    currentDate: Date;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onDayClick: (records: InstructorAttendanceRecord[], dateLabel: string) => void;
    onInstructorClick: (id: string) => void;
}

export const WeekOverview: React.FC<WeekOverviewProps> = ({ 
    currentDate, 
    onPrevWeek, 
    onNextWeek, 
    onDayClick, 
    onInstructorClick 
}) => {
    const { instructors, classes, instructorAttendance, unavailabilities } = useData(); 

    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d);
    }

    const startLabel = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short' }).format(weekDays[0]);
    const endLabel = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(weekDays[6]);

    const generatedWeekData = useMemo(() => {
        const records: Record<string, InstructorAttendanceRecord[]> = {}; 
        
        const findInstructorIdByName = (partialName: string) => {
            const match = instructors.find(i => 
                i.name.toLowerCase().includes(partialName.toLowerCase()) || 
                partialName.toLowerCase().includes((i.name || '').split(' ')[0].toLowerCase())
            );
            return match ? match.id : null;
        };

        weekDays.forEach(dayDate => {
            const year = dayDate.getFullYear();
            const month = dayDate.getMonth();
            const dayOfMonth = dayDate.getDate();
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
            const dayIndex = dayDate.getDay();

            const templateClassesForDay = classes.filter(cls => {
                const clsDate = new Date(cls.date);
                return clsDate.getDay() === dayIndex; 
            });

            templateClassesForDay.forEach(cls => {
                cls.instructors.forEach(instInfo => {
                    const instructorId = instInfo.id || findInstructorIdByName(instInfo.name);
                    if (instructorId) {
                        const key = `${instructorId}-${dateStr}`;
                        if (!records[key]) records[key] = [];

                        const override = instructorAttendance.find(r => 
                            r.instructorId === instructorId && r.date === dateStr && (r.className === cls.title || r.time === cls.time)
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
                                u.instructorId === instructorId && new Date(dateStr) >= new Date(u.startDate) && new Date(dateStr) <= new Date(u.endDate)
                            );
                            records[key].push({
                                id: `gen_${instructorId}_${dateStr}_${cls.time}`,
                                date: dateStr, time: cls.time, instructorId: instructorId,
                                status: isUnavailable ? 'absent' : 'titular',
                                className: cls.title, room: cls.room, classId: cls.id,
                                note: isUnavailable ? isUnavailable.reason : undefined
                            });
                        }
                    }
                });
            });

            instructorAttendance.forEach(att => {
                if (att.status === 'substitute' && att.actualInstructorId && att.date === dateStr) {
                    const key = `${att.actualInstructorId}-${dateStr}`;
                    if (!records[key]) records[key] = [];
                    if (!records[key].find(r => r.id === att.id)) {
                        records[key].push({ ...att, instructorId: att.actualInstructorId, substituteForId: att.instructorId });
                    }
                }
            });
        });
        return records;
    }, [startOfWeek, instructors, classes, instructorAttendance, unavailabilities]); 

    const isToday = (d: Date) => {
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'titular': return <CheckCircle size={12} />;
            case 'substitute': return <RefreshCw size={12} />;
            case 'absent': return <UserX size={12} />;
            case 'cancelled': return <XCircle size={12} />;
            default: return <Clock size={12} />;
        }
    };

    const getStatusStyle = (status: string, isFuture: boolean) => {
        if (isFuture) {
            switch(status) {
                case 'titular': return 'border-green-200 text-green-700 bg-green-50/50';
                case 'substitute': return 'border-amber-200 text-amber-700 bg-amber-50/50';
                case 'absent': return 'border-red-200 text-red-600 bg-white border-dashed';
                case 'cancelled': return 'border-gray-200 text-gray-400 bg-gray-50 border-dashed';
                default: return 'border-gray-100 text-gray-500';
            }
        }
        switch(status) {
            case 'titular': return 'bg-green-100 border-green-200 text-green-800';
            case 'substitute': return 'bg-amber-100 border-amber-200 text-amber-800';
            case 'absent': return 'bg-red-100 border-red-200 text-red-800';
            case 'cancelled': return 'bg-gray-100 border-gray-200 text-gray-500 decoration-line-through';
            default: return 'bg-white border-gray-200 text-gray-900';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-4">
                     <button onClick={onPrevWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft size={20}/></button>
                     <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 min-w-[200px] justify-center">
                        <Calendar size={20} className="text-blue-600"/> {startLabel} - {endLabel}
                     </h2>
                     <button onClick={onNextWeek} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><ChevronRight size={20}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                <div className="flex-1 overflow-auto no-scrollbar relative">
                    <div className="min-w-max">
                        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-0 z-40">
                            <div className="min-w-[150px] p-4 sticky left-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-50 font-bold text-gray-500 text-xs uppercase">Instructor</div>
                            {weekDays.map(d => (
                                <div key={d.toISOString()} className={`flex-1 min-w-[120px] p-2 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 flex flex-col items-center justify-center group ${d.getDay() === 0 || d.getDay() === 6 ? 'bg-gray-100/50 dark:bg-gray-800' : ''}`}>
                                    <span className="text-[10px] text-gray-400 font-bold mb-0.5 uppercase">{new Intl.DateTimeFormat('ro-RO', { weekday: 'short' }).format(d)}</span>
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${isToday(d) ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-white'}`}>{d.getDate()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            {instructors.map(instructor => (
                                <div key={instructor.id} className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors min-h-[80px] group/row relative">
                                    <div className="min-w-[150px] px-4 py-3 sticky left-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-30 flex flex-col justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => onInstructorClick(instructor.id)}>
                                        <div className="flex items-center gap-3">
                                            <img src={instructor.avatarUrl} className="w-8 h-8 rounded-full border border-gray-100 dark:border-gray-700 object-cover" />
                                            <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">{(instructor.name || '').split(' ')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-1">
                                        {weekDays.map(d => {
                                            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                            const dailyRecords = generatedWeekData[`${instructor.id}-${dateStr}`] || [];
                                            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                            return (
                                                <div key={dateStr} className={`flex-1 min-w-[120px] border-r border-gray-50 dark:border-gray-800 last:border-0 p-1 flex flex-col gap-1 transition-colors ${isWeekend ? 'bg-gray-50/30 dark:bg-gray-800/30' : ''}`} onClick={() => dailyRecords.length > 0 && onDayClick(dailyRecords, `${new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric' }).format(d)}`)}>
                                                    {dailyRecords.map((rec, i) => (
                                                        <div key={i} className={`p-1.5 rounded-lg border text-xs cursor-pointer hover:shadow-sm transition-all ${getStatusStyle(rec.status, d > new Date())}`}>
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <span className="font-bold text-[10px] opacity-80">{rec.time}</span>
                                                                {getStatusIcon(rec.status)}
                                                            </div>
                                                            <p className="font-bold leading-tight truncate text-[10px]">{rec.className}</p>
                                                        </div>
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
