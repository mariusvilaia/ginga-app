
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Check, Users, X, UserPlus, CheckCircle, ArrowUpRight, AlertCircle, PlayCircle, Tablet, Monitor, UserCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { DanceClass, StudentDetailedProfile } from '../../types';
import { AddStudentModal } from '../students/AddStudentModal';
import { AddVisitorModal } from './components/AddVisitorModal';
import { AttendanceKiosk } from './components/AttendanceKiosk';
/* Imported missing Button component */
import { Button } from '../../components/UIComponents';

const toLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
};

const getDaysLeft = (dateStr?: string) => {
    if (!dateStr) return 0;
    const expiry = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((expiry - now) / (1000 * 3600 * 24));
};

const getCourseWeek = (startDateStr: string | undefined) => {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    const now = new Date();
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `Începe în ${Math.abs(diffDays)} zile`, type: 'future' };
    const week = Math.floor(diffDays / 7) + 1;
    return { label: `Săpt. ${week}`, type: 'current' };
};

/* Defined missing AttendanceViewProps interface */
interface AttendanceViewProps {
  onNavigateToStudent: (id: string) => void;
  onNavigateToGroup: (id: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onNavigateToStudent, onNavigateToGroup }) => {
    const { students, classes, groups, removeStudentFromGroup, updateStudent, addStudent } = useData();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isKioskOpen, setIsKioskOpen] = useState(false);
    const selectedDateStr = toLocalISOString(selectedDate);

    const [addModal, setAddModal] = useState<{ open: boolean, groupId: string | null }>({ open: false, groupId: null });
    const [visitorModal, setVisitorModal] = useState<{ open: boolean, cls: DanceClass | null, groupName: string | null }>({ open: false, cls: null, groupName: null });

    const todaysClasses = useMemo(() => {
        const dayOfWeek = selectedDate.getDay();
        return classes.filter(c => {
            const cDate = new Date(c.date);
            return c.date === selectedDateStr || cDate.getDay() === dayOfWeek;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }, [classes, selectedDate, selectedDateStr]);

    const groupedClasses = useMemo(() => {
        const groupsByRoom: Record<string, DanceClass[]> = {};
        todaysClasses.forEach(cls => {
            const roomName = cls.room || 'Necunoscut';
            if (!groupsByRoom[roomName]) groupsByRoom[roomName] = [];
            groupsByRoom[roomName].push(cls);
        });
        return Object.entries(groupsByRoom).sort((a, b) => a[0].localeCompare(b[0]));
    }, [todaysClasses]);

    const getGroupIdForClass = (cls: DanceClass) => {
        const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
        const dayName = dayNames[selectedDate.getDay()];
        const matchingGroup = groups.find(g => {
            const isSameDay = g.schedule.day === dayName;
            const isSameTime = g.schedule.time === cls.time;
            const gName = (g.name || '').toLowerCase();
            const cName = (cls.title || '').toLowerCase();
            const isNameMatch = gName === cName || gName.includes(cName) || cName.includes(gName);
            const isStyleMatch = g.style === cls.style;
            return isSameDay && isSameTime && (isNameMatch || isStyleMatch);
        });
        return matchingGroup ? matchingGroup.id : null;
    };

    const getStudentsForGroup = (groupId: string | null, cls: DanceClass) => {
        if (!groupId) return students.filter(s => s.enrollments.some(e => e.style === cls.style && e.level === cls.level));
        return students.filter(s => s.enrollments.some(e => e.groupId === groupId));
    };

    const handleDateChange = (offset: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + offset);
        setSelectedDate(newDate);
    };

    const isStudentCheckedIn = (student: StudentDetailedProfile, cls: DanceClass, groupName?: string) => {
        return student.attendanceHistory?.some(record => 
            record.date === selectedDateStr && 
            (record.className === cls.title || (groupName && record.className === groupName)) && 
            record.status === 'present'
        );
    };

    const toggleCheckIn = async (cls: DanceClass, student: StudentDetailedProfile, groupName?: string) => {
        const isPresent = isStudentCheckedIn(student, cls, groupName);
        let newHistory = [...(student.attendanceHistory || [])];
        let newStats = { ...student.stats };
        const targetName = groupName || cls.title;
        if (isPresent) {
            newHistory = newHistory.filter(r => !(r.date === selectedDateStr && (r.className === cls.title || r.className === groupName)));
            newStats.totalClasses = Math.max(0, (newStats.totalClasses || 0) - 1);
        } else {
            newHistory.push({ date: selectedDateStr, className: targetName, status: 'present' });
            newStats.totalClasses = (newStats.totalClasses || 0) + 1;
        }
        await updateStudent(student.id, { attendanceHistory: newHistory, stats: newStats });
    };

    const handleRemoveStudent = async (studentId: string, groupId: string | null, studentName: string) => {
        if (!groupId) return;
        if (window.confirm(`Sigur vrei să elimini ${studentName} din această grupă?`)) await removeStudentFromGroup(studentId, groupId);
    };

    const handleAddVisitor = async (studentId: string, date: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student || !visitorModal.cls) return;

        const targetName = visitorModal.groupName || visitorModal.cls.title;
        
        // Check if already checked in
        const isPresent = student.attendanceHistory?.some(record => 
            record.date === date && 
            (record.className === visitorModal.cls!.title || (visitorModal.groupName && record.className === visitorModal.groupName)) && 
            record.status === 'present'
        );

        if (isPresent) {
            alert('Studentul este deja prezent la această clasă.');
            return;
        }

        let newHistory = [...(student.attendanceHistory || [])];
        let newStats = { ...student.stats };
        
        newHistory.push({ date: date, className: targetName, status: 'present' });
        newStats.totalClasses = (newStats.totalClasses || 0) + 1;
        
        await updateStudent(student.id, { attendanceHistory: newHistory, stats: newStats });
        setVisitorModal({ open: false, cls: null, groupName: null });
    };

    if (isKioskOpen) {
        return <AttendanceKiosk onClose={() => setIsKioskOpen(false)} />;
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-8 shrink-0 gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Clock className="text-blue-600" size={28} />
                        Quick Check-in
                    </h2>
                    <p className="text-gray-500 font-medium mt-1 ml-10">Gestionează prezența la cursurile de azi.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setIsKioskOpen(true)}
                        className="!w-auto h-11 px-6 text-sm gap-2 bg-[#111827] hover:bg-black text-white shadow-xl shadow-gray-200"
                    >
                        <Tablet size={18} /> Ginga Desk (Kiosk)
                    </Button>
                    <div className="flex items-center bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-1">
                        <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500"><ChevronLeft size={18} /></button>
                        <div className="relative flex items-center gap-2 px-4 border-l border-r border-gray-100 dark:border-gray-800 h-8 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <CalendarIcon size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize min-w-[120px] text-center pointer-events-none">{selectedDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            <input 
                                type="date" 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                value={selectedDateStr}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const [y, m, d] = e.target.value.split('-').map(Number);
                                        setSelectedDate(new Date(y, m - 1, d));
                                    }
                                }}
                            />
                        </div>
                        <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
                {todaysClasses.length > 0 ? (
                    <div className="space-y-12">
                        {groupedClasses.map(([roomName, classesInRoom]) => (
                            <div key={roomName} className="space-y-6">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500"><MapPin size={16} /></div>
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{roomName}</h3>
                                    <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1 ml-2"></div>
                                </div>
                                <div className="space-y-8">
                                    {classesInRoom.map(cls => {
                                        const groupId = getGroupIdForClass(cls);
                                        const group = groups.find(g => g.id === groupId); 
                                        const groupName = group?.name;
                                        const weekInfo = getCourseWeek(group?.startDate);
                                        
                                        const enrolledStudents = getStudentsForGroup(groupId, cls);
                                        const visitorStudents = students.filter(s => {
                                            if (enrolledStudents.some(es => es.id === s.id)) return false;
                                            return isStudentCheckedIn(s, cls, groupName);
                                        });

                                        const classStudents = [...enrolledStudents, ...visitorStudents].sort((a, b) => a.name.localeCompare(b.name));
                                        
                                        const isCheckedCount = classStudents.filter(s => isStudentCheckedIn(s, cls, groupName)).length;
                                        return (
                                            <div key={cls.id} className="w-full bg-[#2A3270] rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                                                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#FDBF1F]"><Clock size={24} /></div>
                                                        <div>
                                                            <div className="flex items-center gap-3"><h3 className="text-xl font-bold text-white leading-tight">{cls.title}</h3>{weekInfo && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-white/10"><PlayCircle size={10} /> {weekInfo.label}</span>}</div>
                                                            <div className="flex items-center gap-3 text-sm font-medium text-white/60 mt-1"><span className="flex items-center gap-1"><MapPin size={14}/> {cls.room}</span><span className="text-white/20">|</span><span className="flex items-center gap-1">{cls.time}</span>{groupId && <><span className="text-white/20">|</span><button onClick={() => onNavigateToGroup(groupId)} className="flex items-center gap-1 hover:text-white transition-colors text-[#55C360] font-bold">Detalii <ArrowUpRight size={14}/></button></>}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-white">
                                                        <div className="text-right mr-2"><p className="text-[10px] font-bold text-white/60 uppercase">Prezenți</p><p className="text-2xl font-black leading-none">{isCheckedCount} <span className="text-white/40 text-sm font-medium">/ {classStudents.length}</span></p></div>
                                                        <div className="w-12 h-12 rounded-full border-4 border-white/10 flex items-center justify-center relative"><div className="absolute inset-0 rounded-full border-4 border-[#55C360] transition-all duration-500" style={{ clipPath: `inset(0 ${100 - (isCheckedCount / (classStudents.length || 1)) * 100}% 0 0)` }}></div><span className="text-xs font-bold text-white">{Math.round((isCheckedCount / (classStudents.length || 1)) * 100)}%</span></div>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                                                    <div className="flex gap-4 w-max">
                                                        {classStudents.map(student => {
                                                            const isCheckedIn = isStudentCheckedIn(student, cls, groupName);
                                                            const isStaff = student.subscription?.type === 'Staff';
                                                            
                                                            // Check subscription status relative to the SELECTED DATE
                                                            const isActiveOnDate = isStaff || (student.subscription?.expiryDate && student.subscription.expiryDate >= selectedDateStr);
                                                            
                                                            const isVisitor = !enrolledStudents.some(es => es.id === student.id);
                                                            
                                                            // Determine card styling
                                                            let cardStyle = "";
                                                            if (isVisitor) {
                                                                cardStyle = "bg-[#3E4685]/50 border-dashed border-[#4F5899]";
                                                            } else if (isActiveOnDate) {
                                                                // Active: Light Green Tint (Pastel-ish on dark)
                                                                cardStyle = "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30";
                                                            } else {
                                                                // Inactive: Light Red Tint (Pastel-ish on dark)
                                                                cardStyle = "bg-red-500/20 border-red-500/40 hover:bg-red-500/30";
                                                            }

                                                            return (
                                                                <div key={student.id} onClick={() => onNavigateToStudent(student.id)} className={`w-[180px] rounded-2xl p-4 flex flex-col items-center text-center border relative group/card transition-colors cursor-pointer ${cardStyle}`}>
                                                                    {groupId && !isVisitor && <button onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id, groupId, student.name); }} className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-red-500/20 rounded-full text-white/40 hover:text-red-400 transition-all opacity-0 group-hover/card:opacity-100 z-10" title="Scoate din grupă"><X size={12} strokeWidth={2.5} /></button>}
                                                                    {isVisitor && <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] font-bold uppercase rounded border border-blue-500/30">Vizitator</div>}
                                                                    <div className="relative mb-3"><img src={student.avatarUrl} alt={student.name} className={`w-16 h-16 rounded-full object-cover border-2 transition-all ${isCheckedIn ? 'border-[#55C360]' : !isActiveOnDate ? 'border-red-400' : 'border-[#5761A8]'}`}/>{isCheckedIn && <div className="absolute -bottom-1 -right-1 bg-[#55C360] text-white p-0.5 rounded-full border-2 border-[#3E4685]"><Check size={12} strokeWidth={4} /></div>}{!isActiveOnDate && !isCheckedIn && <div className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full border-2 border-[#3E4685] z-10 shadow-sm" title="Abonament Inactiv la data respectivă"><AlertCircle size={12} strokeWidth={3} /></div>}</div>
                                                                    <h4 className="text-sm font-bold text-white leading-tight mb-1 line-clamp-1 w-full">{student.name.split(' ')[0]}</h4>
                                                                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-4 ${!isActiveOnDate ? 'text-red-300' : 'text-[#A0A7D1]'}`}>{student.subscription.type} {!isActiveOnDate && '(Inactiv)'}</p>
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleCheckIn(cls, student, groupName); }} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-auto ${isCheckedIn ? 'bg-[#55C360] text-white shadow-lg shadow-green-900/20 hover:bg-[#4AB855]' : 'bg-[#2A3270] border border-[#4F5899] text-white/60 hover:bg-[#353D7F] hover:text-white'}`}>{isCheckedIn && <CheckCircle size={14} />}{isCheckedIn ? 'Prezent' : 'Check-in'}</button>
                                                                </div>
                                                            );
                                                        })}
                                                        {groupId && (
                                                            <div className="flex flex-col gap-2">
                                                                <button onClick={() => setAddModal({ open: true, groupId })} className="w-[180px] h-[140px] rounded-2xl border-2 border-dashed border-[#4F5899] hover:border-[#55C360] hover:bg-[#55C360]/10 transition-all flex flex-col items-center justify-center gap-3 text-[#A0A7D1] hover:text-[#55C360] group/add">
                                                                    <div className="w-10 h-10 rounded-full bg-[#3E4685] group-hover/add:bg-[#55C360] flex items-center justify-center transition-colors text-white"><UserPlus size={20} /></div>
                                                                    <span className="text-xs font-bold">Adaugă Cursant</span>
                                                                </button>
                                                                <button onClick={() => setVisitorModal({ open: true, cls, groupName })} className="w-[180px] h-[140px] rounded-2xl border-2 border-dashed border-[#4F5899] hover:border-blue-500 hover:bg-blue-500/10 transition-all flex flex-col items-center justify-center gap-3 text-[#A0A7D1] hover:text-blue-500 group/visit">
                                                                    <div className="w-10 h-10 rounded-full bg-[#3E4685] group-hover/visit:bg-blue-500 flex items-center justify-center transition-colors text-white"><UserCheck size={20} /></div>
                                                                    <span className="text-xs font-bold">Adaugă Vizitator</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700"><CalendarIcon size={48} className="mb-4 opacity-20" /><h3 className="text-sm font-bold text-gray-900 dark:text-white">Nicio clasă în această zi</h3><p className="text-xs">Selectează altă dată din calendar.</p></div>
                )}
            </div>
            <AddStudentModal isOpen={addModal.open} onClose={() => setAddModal({ open: false, groupId: null })} onSave={(newStudent) => addStudent(newStudent)} initialGroupId={addModal.groupId || undefined} existingStudents={students} onAddExisting={(sid) => students.find(s => s.id === sid) && setAddModal({ open: false, groupId: null })} />
            <AddVisitorModal 
                isOpen={visitorModal.open} 
                onClose={() => setVisitorModal({ open: false, cls: null, groupName: null })} 
                onAddVisitor={handleAddVisitor} 
                initialDate={selectedDateStr} 
                existingStudents={students} 
                currentClassTitle={visitorModal.cls?.title}
            />
        </div>
    );
};
