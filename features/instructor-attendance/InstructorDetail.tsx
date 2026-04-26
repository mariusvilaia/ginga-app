
import React, { useMemo } from 'react';
import { ArrowLeft, Calendar, User, Clock, MapPin, CheckCircle, AlertOctagon, RefreshCw, XCircle, UserX } from 'lucide-react';
import { MOCK_INSTRUCTORS_DATA, MOCK_INSTRUCTOR_ATTENDANCE, MOCK_CLASSES, MOCK_INSTRUCTOR_UNAVAILABILITY } from '../../constants';
import { InstructorAttendanceRecord } from '../../types';
import { Button } from '../../components/UIComponents';
import { getAttendanceStyle } from '../../utils/themeUtils';

interface InstructorDetailProps {
    instructorId: string;
    onBack: () => void;
    onRecordClick: (rec: InstructorAttendanceRecord) => void;
}

export const InstructorDetail: React.FC<InstructorDetailProps> = ({ instructorId, onBack, onRecordClick }) => {
    const instructor = MOCK_INSTRUCTORS_DATA.find(i => i.id === instructorId);
    if (!instructor) return <div>Instructor not found</div>;

    // Use Today's context instead of hardcoded 2025
    const currentDate = new Date(); 
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // --- REUSE LOGIC FROM MONTH OVERVIEW FOR CONSISTENCY ---
    const records = useMemo(() => {
        const results: InstructorAttendanceRecord[] = [];
        
        const findInstructorIdByName = (partialName: string) => {
            const match = MOCK_INSTRUCTORS_DATA.find(i => 
                i.name?.toLowerCase().includes(partialName.toLowerCase()) || 
                partialName.toLowerCase().includes((i.name || '').split(' ')[0].toLowerCase())
            );
            return match ? match.id : null;
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const currentDayDate = new Date(year, month, d);
            const dayIndex = currentDayDate.getDay();

            // Find Scheduled Classes matching Day of Week
            const templateClasses = MOCK_CLASSES.filter(cls => {
                const clsDate = new Date(cls.date);
                return clsDate.getDay() === dayIndex;
            });

            templateClasses.forEach(cls => {
                // Does this instructor teach this class?
                const matchesInstructor = cls.instructors.some(inst => {
                    const id = inst.id || findInstructorIdByName(inst.name);
                    return id === instructorId;
                });
                
                if (matchesInstructor) {
                    // Check Override
                    const override = MOCK_INSTRUCTOR_ATTENDANCE.find(r => 
                        r.instructorId === instructorId &&
                        r.date === dateStr &&
                        (r.className === cls.title || r.time === cls.time)
                    );

                    if (override) {
                        // LOGIC CHANGE: If substituted, mark as ABSENT here
                        if (override.status === 'substitute') {
                            results.push({
                                ...override,
                                status: 'absent',
                                note: `Suplinitor: ${override.actualInstructorId ? override.actualInstructorId.replace('instr_', '') : 'Necunoscut'}`
                            });
                        } else {
                            results.push(override);
                        }
                    } else {
                        // Check Unavailability
                        const isUnavailable = MOCK_INSTRUCTOR_UNAVAILABILITY.find(u => 
                            u.instructorId === instructorId &&
                            new Date(dateStr) >= new Date(u.startDate) && 
                            new Date(dateStr) <= new Date(u.endDate)
                        );

                        // Generated Default
                        results.push({
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
        }

        // Add Substitutions (where I taught but wasn't scheduled)
        MOCK_INSTRUCTOR_ATTENDANCE.forEach(att => {
            if (att.status === 'substitute' && att.actualInstructorId === instructorId) {
                // Verify date is in this month
                const attDate = new Date(att.date);
                if (attDate.getMonth() === month && attDate.getFullYear() === year) {
                    const alreadyExists = results.find(r => r.id === att.id);
                    if (!alreadyExists) {
                        results.push({
                            ...att,
                            instructorId: instructorId, // I am the viewer now
                            status: 'substitute'
                        });
                    }
                }
            }
        });

        return results.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    }, [instructorId, year, month]);

    const stats = useMemo(() => {
        const titular = records.filter(r => r.status === 'titular').length;
        const substitute = records.filter(r => r.status === 'substitute').length;
        const totalHours = titular + substitute;
        const estimatedPay = totalHours * (instructor.contract?.hourlyRate || 100); 
        return { titular, substitute, totalHours, estimatedPay };
    }, [records, instructor]);

    // Helper to get dots for calendar cell
    const getRecordsForDay = (day: number) => {
        return records.filter(r => r.date.endsWith(`-${day.toString().padStart(2, '0')}`));
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 w-fit transition-colors">
                <ArrowLeft size={18}/> Înapoi la tabel
            </button>

            <div className="flex flex-col lg:flex-row gap-8 h-full min-h-0">
                {/* Left: Profile & Stats */}
                <div className="w-full lg:w-80 shrink-0 overflow-y-auto no-scrollbar">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 text-center sticky top-0">
                        <img src={instructor.avatarUrl} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-50 dark:border-gray-800 object-cover"/>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{instructor.name}</h2>
                        <p className="text-sm text-gray-500 mb-6 font-medium">{(instructor.styles || []).join(', ')}</p>
                        
                        <div className="space-y-3 text-left">
                            <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <span className="text-xs font-bold text-gray-500">Ore Programate</span>
                                <span className="font-bold text-gray-900 dark:text-white">{records.length}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/10 text-green-700 rounded-xl border border-green-100 dark:border-green-900/30">
                                <span className="text-xs font-bold">Titulare</span>
                                <span className="font-bold">{stats.titular}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-700 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <span className="text-xs font-bold">Supliniri</span>
                                <span className="font-bold">{stats.substitute}</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Total de plată (Est.)</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">{stats.estimatedPay.toLocaleString()} RON</p>
                            <Button className="mt-4 text-xs h-10 w-full" variant="secondary">Exportă Raport</Button>
                        </div>
                    </div>
                </div>

                {/* Right: Calendar & List */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col min-h-0 overflow-hidden">
                     <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">{new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(currentDate)}</h3>
                        <div className="flex gap-3">
                             <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span className="text-xs text-gray-500">Titular</span></div>
                             <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><span className="text-xs text-gray-500">Suplinitor</span></div>
                             <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-xs text-gray-500">Absent</span></div>
                        </div>
                     </div>

                     <div className="grid grid-cols-7 gap-2 mb-8 shrink-0">
                         {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                             <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
                         ))}
                         {days.map(day => {
                             const dayRecords = getRecordsForDay(day);
                             const currentDayDate = new Date(year, month, day);
                             const today = new Date();
                             today.setHours(0,0,0,0);
                             const isFuture = currentDayDate > today;
                             
                             return (
                                 <div key={day} className="aspect-square rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer flex flex-col items-center justify-center relative transition-colors group">
                                     <span className={`text-xs font-medium ${dayRecords.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{day}</span>
                                     <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                                         {dayRecords.map((r, idx) => (
                                             <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getAttendanceStyle(r.status, isFuture)}`} title={r.className}></div>
                                         ))}
                                     </div>
                                 </div>
                             );
                         })}
                     </div>

                     <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white shrink-0">Sesiuni Detaliate</h3>
                     <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar pr-1">
                         {records.map(rec => {
                             const recDate = new Date(rec.date);
                             const today = new Date();
                             today.setHours(0,0,0,0);
                             const isFuture = recDate > today;

                             return (
                                 <div 
                                     key={rec.id} 
                                     onClick={() => onRecordClick(rec)}
                                     className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all cursor-pointer group"
                                 >
                                     <div className="flex items-center gap-4">
                                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                                             isFuture ? 'bg-transparent border-2 border-gray-300 text-gray-400' :
                                             rec.status === 'titular' ? 'bg-green-500' : 
                                             rec.status === 'substitute' ? 'bg-amber-400' : 
                                             rec.status === 'absent' ? 'bg-red-500' : 'bg-gray-400'
                                         }`}>
                                             {rec.status === 'titular' && <CheckCircle size={20}/>}
                                             {rec.status === 'substitute' && <RefreshCw size={20}/>}
                                             {rec.status === 'absent' && <UserX size={20}/>}
                                             {rec.status === 'cancelled' && <XCircle size={20}/>}
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-gray-900 dark:text-white">{rec.className}</h4>
                                             <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                 <span className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-600"><Clock size={12}/> {rec.time}</span>
                                                 <span className="flex items-center gap-1"><Calendar size={12}/> {rec.date}</span>
                                                 <span className="flex items-center gap-1 font-medium"><MapPin size={12}/> {rec.room}</span>
                                             </div>
                                             {rec.status === 'absent' && rec.note && (
                                                 <p className="text-xs text-red-500 font-bold mt-1">{rec.note}</p>
                                             )}
                                         </div>
                                     </div>
                                     <div className="text-right">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                              isFuture ? 'bg-transparent text-gray-400 border-gray-300' :
                                              rec.status === 'titular' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' : 
                                              rec.status === 'substitute' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400' : 
                                              rec.status === 'absent' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' : 
                                              'bg-gray-100 text-gray-600 border-gray-200'
                                          }`}>
                                              {isFuture ? 'Programat' : (rec.status === 'titular' ? 'Titular' : rec.status)}
                                          </span>
                                     </div>
                                 </div>
                             );
                         })}
                         {records.length === 0 && (
                             <div className="text-center text-gray-400 py-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                 <Calendar size={32} className="mx-auto mb-2 opacity-20"/>
                                 <p>Nicio activitate înregistrată luna aceasta.</p>
                             </div>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};
