
import React, { useState, useMemo } from 'react';
import { CreditCard, FileText, CalendarCheck, CheckCircle, XCircle, HelpCircle, TrendingUp, User, Users, Mail, Phone, ExternalLink, Download, StickyNote, Trash2, Send, Plus, Check, ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, Edit2 } from 'lucide-react';
import { StudentDetailedProfile, AdminNote, DanceClass, Enrollment, VacationPeriod } from '../../../types';
import { Badge, Button, Modal } from '../../../components/UIComponents';
import { getSubscriptionColor, getGroupIconClass } from '../../../utils/themeUtils';
import { calculateAdjustedExpiryDate } from '../../../utils/dateUtils';

// --- OVERVIEW TAB ---
export const StudentOverviewTab: React.FC<{ 
    student: StudentDetailedProfile;
    onNavigateToGroup?: (groupId: string) => void;
    onRemoveEnrollment?: (groupId: string, groupName: string) => void;
}> = ({ student, onNavigateToGroup, onRemoveEnrollment }) => (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard size={16} className="text-blue-500"/> Abonament Activ</h4>
                <Badge color={getSubscriptionColor(student.subscription.type)}>{student.subscription.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Tip Plată</p>
                    <p className="font-bold text-gray-900 dark:text-white">{student.subscription.autoPayEnabled ? 'Recurent (Loyalty)' : 'Standard (Flexible)'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                    <p className={`font-bold ${student.subscription.active ? (student.subscription.autoPayEnabled === false ? 'text-amber-500' : 'text-green-600') : 'text-red-500'}`}>
                        {student.subscription.active ? (student.subscription.autoPayEnabled === false ? 'ANULAT' : 'Activ') : 'Expirat'}
                    </p>
                </div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Ultima Plată</p><p className="font-bold text-gray-900 dark:text-white">{student.subscription.lastPaymentDate || 'N/A'}</p></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Expiră la</p><p className="font-bold text-gray-900 dark:text-white">{student.subscription.expiryDate}</p></div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Users size={16} className="text-gray-400"/> Grupe Active</h4>
            <div className="space-y-2">
                {student.enrollments && student.enrollments.length > 0 ? student.enrollments.map((enr, idx) => (
                    <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => enr.groupId && onNavigateToGroup?.(enr.groupId)}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${getGroupIconClass(enr.level)}`}>{(enr.style || '').charAt(0)}</div>
                            <div><p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{enr.groupName || `${enr.style} ${enr.level}`}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                             {onRemoveEnrollment && enr.groupId && (
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveEnrollment(enr.groupId!, enr.groupName || ''); }}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Elimină din grupă"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                             )}
                             {enr.groupId && onNavigateToGroup && <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />}
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-400 italic text-center py-4">Nu este înscris la nicio grupă.</p>}
            </div>
        </div>
    </div>
);

// --- ATTENDANCE TAB (UPDATED TO CALENDAR STYLE) ---
export const StudentAttendanceTab: React.FC<{ 
    history: any[]; 
    allClasses: DanceClass[]; 
    onCheckIn: (classId: string, date: string, status?: 'present' | 'absent' | 'none') => void;
    enrollments?: Enrollment[];
    onUpdateHistory?: (newHistory: any[]) => void;
    paymentHistory?: any[];
    vacationPeriods?: VacationPeriod[];
}> = ({ history, allClasses, onCheckIn, enrollments = [], onUpdateHistory, paymentHistory = [], vacationPeriods = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Helpers for Calendar
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(currentDate);

    // Helper: Check if date is covered by subscription
    const isDateCovered = (dateStr: string) => {
        const targetDate = new Date(dateStr);
        // Check payment history
        const covered = paymentHistory.some(payment => {
            const payDate = new Date(payment.date);
            const expiryDate = calculateAdjustedExpiryDate(payment.date, vacationPeriods);
            
            // Handle edge cases
            if (expiryDate.getDate() !== payDate.getDate()) {
                // This is already handled in calculateAdjustedExpiryDate, but just in case
            }
            return targetDate >= payDate && targetDate <= expiryDate;
        });
        return covered;
    };

    // Map history for quick lookup
    const historyMap = useMemo(() => {
        const map: Record<string, any[]> = {};
        history.forEach(rec => {
            if (!map[rec.date]) map[rec.date] = [];
            map[rec.date].push(rec);
        });
        return map;
    }, [history]);

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

    // Helper: Matching Logic
    const isClassMatchingEnrollment = (c: DanceClass, enrollments: Enrollment[]) => {
        return enrollments.some(e => {
            // 1. Direct ID match (Best case)
            if (e.groupId === c.id) return true;
            // 2. Fallback: Style & Level match (Common case if IDs differ)
            return e.style === c.style && e.level === c.level;
        });
    };

    // Get ONLY classes that match enrollments for the day
    const getDayClasses = (dayStr: string) => {
        const targetDateObj = new Date(dayStr);
        const dayOfWeek = targetDateObj.getDay();

        const scheduledClasses = allClasses.filter(c => {
            const cDate = new Date(c.date);
            const matchesDay = c.date === dayStr || cDate.getDay() === dayOfWeek;
            if (!matchesDay) return false;
            return isClassMatchingEnrollment(c, enrollments);
        });

        // Deduplicate
        const uniqueClasses = Array.from(new Set(scheduledClasses.map(c => c.id || c.title)))
            .map(id => scheduledClasses.find(c => (c.id || c.title) === id)!);
            
        return uniqueClasses;
    };

    const isHoliday = (dateStr: string) => {
        return vacationPeriods.some(p => dateStr >= p.startDate && dateStr <= p.endDate);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col overflow-hidden">
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
                        const dayRecords = historyMap[dateStr] || [];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const dayDate = new Date(dateStr);
                        const dayOfWeek = dayDate.getDay();

                        // 1. Identify Scheduled Classes for this day
                        const scheduledClasses = allClasses.filter(c => {
                            const cDate = new Date(c.date);
                            const matchesDay = c.date === dateStr || cDate.getDay() === dayOfWeek;
                            if (!matchesDay) return false;
                            return isClassMatchingEnrollment(c, enrollments);
                        });

                        // Deduplicate
                        const uniqueScheduled = Array.from(new Set(scheduledClasses.map(c => c.id || c.title)))
                            .map(id => scheduledClasses.find(c => (c.id || c.title) === id)!);

                        // 2. Build Indicator Dots
                        const indicators: string[] = [];

                        if (!isHoliday(dateStr)) {
                            uniqueScheduled.forEach(cls => {
                                const record = dayRecords.find(r => r.className === cls.title);
                                if (record) {
                                    indicators.push(record.status);
                                } else {
                                    // Scheduled but no record yet -> Expected (Gray)
                                    indicators.push('expected');
                                }
                            });
                        }

                        const hasActivity = indicators.length > 0;
                        const isCovered = isDateCovered(dateStr);
                        const isVacation = isHoliday(dateStr);
                        
                        // Determine background color based on subscription status
                        let bgClass = '';
                        
                        if (isVacation) {
                             bgClass = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
                        } else {
                             bgClass = isCovered 
                                ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100' 
                                : 'bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100';
                        }

                        if (isToday) {
                            bgClass += ' ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900';
                        }

                        return (
                            <div 
                                key={day} 
                                onClick={() => setSelectedDay(dateStr)}
                                className={`
                                    aspect-square rounded-xl border border-transparent flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md relative group
                                    ${bgClass}
                                    ${hasActivity ? 'border-gray-200 dark:border-gray-700 shadow-sm' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
                                <div className="flex gap-1 mt-1 flex-wrap justify-center px-1 max-w-full">
                                    {indicators.slice(0, 4).map((status, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`w-2.5 h-2.5 rounded-full ${
                                                status === 'present' ? 'bg-green-500' : 
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

            {/* DAY MODAL */}
            {selectedDay && (
                <AttendanceDayModal 
                    date={selectedDay}
                    history={history}
                    availableClasses={getDayClasses(selectedDay)}
                    onClose={() => setSelectedDay(null)}
                    onUpdate={(newHistory) => {}}
                    studentHistory={history}
                    onSaveStudentHistory={() => {}}
                    parentCheckIn={onCheckIn}
                    enrollments={enrollments}
                />
            )}
        </div>
    );
};

// --- NEW COMPONENT: ATTENDANCE DAY MODAL ---
const AttendanceDayModal: React.FC<{
    date: string;
    history: any[];
    availableClasses: DanceClass[];
    onClose: () => void;
    onUpdate: (h: any[]) => void;
    studentHistory: any[];
    onSaveStudentHistory: (h: any[]) => void;
    parentCheckIn: (classId: string, date: string, status: 'present' | 'absent' | 'none') => void;
    enrollments: Enrollment[];
}> = ({ date, history, availableClasses, onClose, parentCheckIn, enrollments }) => {
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = date > todayStr;

    const getStatusForClass = (className: string) => {
        const rec = history.find(r => r.date === date && r.className === className);
        return rec ? rec.status : 'none';
    };

    const isEnrolledInClass = (cls: DanceClass) => {
        return enrollments.some(e => {
            if (e.groupId === cls.id) return true;
            return e.style === cls.style && e.level === cls.level;
        });
    };

    const handleStatusUpdate = (cls: DanceClass, newStatus: 'present' | 'absent' | 'none') => {
        if (isFuture) return;
        parentCheckIn(cls.id, date, newStatus);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Prezență: ${new Date(date).toLocaleDateString('ro-RO')}`}>
            <div className="space-y-4">
                {availableClasses.length > 0 ? (
                    availableClasses.map(cls => {
                        const status = getStatusForClass(cls.title);
                        const enrolled = isEnrolledInClass(cls);
                        return (
                            <div key={cls.id || cls.title} className={`flex items-center justify-between p-3 rounded-xl border ${enrolled ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{cls.title}</h4>
                                        {enrolled && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Înscris</span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        <span className="flex items-center gap-1"><Clock size={10}/> {cls.time}</span>
                                        <span className="flex items-center gap-1"><MapPin size={10}/> {cls.room}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleStatusUpdate(cls, 'none')}
                                        disabled={isFuture}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                            status === 'none' 
                                            ? 'bg-blue-50 text-blue-600 border-2 border-dashed border-blue-300' 
                                            : isFuture
                                                ? 'bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                                : 'bg-white border border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-500'
                                        }`}
                                        title="Status Necunoscut / Default"
                                    >
                                        <HelpCircle size={24} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleStatusUpdate(cls, 'present')}
                                        disabled={isFuture}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                            status === 'present' 
                                            ? 'bg-green-500 text-white shadow-md' 
                                            : isFuture 
                                                ? 'bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                                : 'bg-white border border-gray-200 text-gray-300 hover:border-green-300 hover:text-green-500'
                                        }`}
                                        title="Prezent"
                                    >
                                        <CheckCircle size={24} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleStatusUpdate(cls, 'absent')}
                                        disabled={isFuture}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                            status === 'absent' 
                                            ? 'bg-red-500 text-white shadow-md' 
                                            : isFuture 
                                                ? 'bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                                : 'bg-white border border-gray-200 text-gray-300 hover:border-red-300 hover:text-red-500'
                                        }`}
                                        title="Absent"
                                    >
                                        <XCircle size={24} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-20"/>
                        <p className="text-sm">Nicio clasă programată în această zi.</p>
                    </div>
                )}
                
                {/* Manual Add Button */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button className="w-full py-3 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Plus size={14}/> Adaugă Manual Altă Clasă
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// --- PAYMENTS TAB ---
export const StudentPaymentsTab: React.FC<{ payments: any[], onAddPayment?: () => void, onEditPayment?: (payment: any) => void }> = ({ payments, onAddPayment, onEditPayment }) => (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard size={16} className="text-blue-600"/> Metode de Plată</h4>
                {onAddPayment && (
                    <Button onClick={onAddPayment} className="h-8 text-xs px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none">
                        <Plus size={14} className="mr-1"/> Adaugă Plată
                    </Button>
                )}
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-7 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-[9px] font-bold text-gray-500">VISA</div>
                    <div><p className="text-xs font-bold text-gray-900 dark:text-white">Visa •••• 4242</p><p className="text-[10px] text-gray-500">Expiră 12/28</p></div>
                </div>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Principal</span>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><FileText size={16} className="text-gray-400"/> Istoric Plăți</h4>
            <div className="space-y-3">
                {payments.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${tx.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{tx.status === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>}</div>
                            <div><p className="text-sm font-bold text-gray-900 dark:text-white">{tx.description || 'Plată'}</p><p className="text-xs text-gray-500 font-mono mt-0.5">ID: {tx.id}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right"><p className="text-sm font-black text-gray-900 dark:text-white">{tx.amount} {tx.currency}</p><p className="text-[10px] text-gray-500 mb-1">{tx.date}</p></div>
                            {onEditPayment && (
                                <button onClick={() => onEditPayment(tx)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Editează">
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// --- NOTES TAB ---
export const StudentNotesTab: React.FC<{ notes: AdminNote[], onAdd: (t: string) => void, onDelete: (id: string) => void }> = ({ notes, onAdd, onDelete }) => {
    const [text, setText] = useState('');
    return (
        <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><StickyNote size={18} className="text-yellow-500"/> Notițe Interne</h3></div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4">
                {notes && notes.length > 0 ? notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 group hover:border-gray-200">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><span>{note.author}</span><span>•</span><span>{note.date}</span></div>
                            <button onClick={() => onDelete(note.id)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                    </div>
                )) : <div className="flex flex-col items-center justify-center h-40 text-gray-400"><FileText size={32} className="mb-2 opacity-20"/><p className="text-sm">Nu există notițe.</p></div>}
            </div>
            <div className="flex items-end gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <textarea placeholder="Scrie o notă..." className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-32 min-h-[40px] py-2" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => {if(e.key==='Enter' && !e.shiftKey){e.preventDefault(); if(text.trim()) { onAdd(text); setText(''); }}}} />
                <button onClick={() => { if(text.trim()) { onAdd(text); setText(''); }}} disabled={!text.trim()} className={`p-2 rounded-xl ${text.trim() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}><Send size={18} /></button>
            </div>
        </div>
    );
};
