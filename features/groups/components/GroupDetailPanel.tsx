
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Users, CalendarCheck, Zap, MessageSquare, AlertTriangle, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight, Check, X, Calendar, Edit3, UserPlus, Trash2, GitMerge } from 'lucide-react';
import { GroupDetailedProfile, DanceStyle, SkillLevel, InstructorInfo } from '../../../types';
import { Button, Badge } from '../../../components/UIComponents';
import { getStyleTheme } from '../../../utils/themeUtils';
import { useData } from '../../../contexts/DataContext';
import { EditScheduleModal } from './EditScheduleModal';
import { AddStudentModal } from '../../students/AddStudentModal';
import { normalizeText, smartSearch } from '../../../utils/searchUtils';
import { GroupAttendanceMatrix } from './GroupAttendanceMatrix';
import { MergeGroupModal } from './MergeGroupModal';

interface GroupDetailPanelProps {
    group: GroupDetailedProfile;
    onBack: () => void;
    onNavigateToStudent: (id: string) => void;
    onAddTask: () => void;
}

export const GroupDetailPanel: React.FC<GroupDetailPanelProps> = ({ group, onBack, onNavigateToStudent, onAddTask }) => {
    const { students, instructors, groups, updateMasterSchedule, updateGroup, addStudent, updateStudent, removeStudentFromGroup, deleteGroup } = useData();
    const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'risk'>('attendance');
    const [studentSearch, setStudentSearch] = useState('');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

    // KEY FIX: Use the group from context to ensure live data (e.g. updated stats after removal)
    const activeGroup = groups.find(g => g.id === group.id) || group;

    const theme = getStyleTheme(activeGroup.style, activeGroup.level);

    const getInstructorAvatar = (inst: { id?: string; name: string; avatarUrl?: string }) => {
        if (inst.id) {
            const match = instructors.find(i => i.id === inst.id);
            if (match) return match.avatarUrl;
        }
        
        const safeInstName = (inst.name || '').toLowerCase();
        if (safeInstName) {
            const matchName = instructors.find(i => (i.name || '').toLowerCase().includes(safeInstName));
            if (matchName) return matchName.avatarUrl;
        }
        return inst.avatarUrl || 'https://via.placeholder.com/150?text=Instr';
    };

    const groupStudents = useMemo(() => {
        return students.filter(s => {
            // Strict enrollment check: Must be explicitly enrolled in this group via ID or Name
            // Using normalization to ensure robust matching even if diacritics differ
            const normGroupName = normalizeText(activeGroup.name);
            
            const inGroupById = s.enrollments?.some(e => e.groupId === activeGroup.id);
            const isMainGroup = normalizeText(s.mainGroup) === normGroupName;
            const inGroupByName = s.enrollments?.some(e => normalizeText(e.groupName) === normGroupName);
            
            // NOTE: We EXCLUDE visitors (attendance history only) from this list to ensure "Remove" works visually.
            // Visitors are tracked in the Attendance Matrix, but not in the Roster.
            return inGroupById || isMainGroup || inGroupByName;
        });
    }, [activeGroup, students]);

    // NEW: Calculate real attendance rate based on history
    const attendanceRate = useMemo(() => {
        let totalPresent = 0;
        let totalRecords = 0;

        groupStudents.forEach(s => {
            s.attendanceHistory?.forEach(r => {
                if (r.className === activeGroup.name) {
                    if (r.status === 'present') totalPresent++;
                    if (['present', 'absent', 'late'].includes(r.status)) totalRecords++;
                }
            });
        });

        // Fallback to static stat if no history found (e.g. new group)
        if (totalRecords === 0) return activeGroup.stats.averageAttendance || 0;
        
        return Math.round((totalPresent / totalRecords) * 100);
    }, [groupStudents, activeGroup.name, activeGroup.stats.averageAttendance]);

    const filteredStudents = groupStudents.filter(s => smartSearch(studentSearch, s.name));

    const handleScheduleUpdate = async (data: { day: string; time: string; room: string; duration: string; name: string; level: SkillLevel; startDate: string; instructors: InstructorInfo[] }) => {
        const { name, level, startDate, instructors: newInstructors, ...schedule } = data;
        
        // Update Schedule Logic (propagates name changes)
        await updateMasterSchedule(activeGroup.id, schedule, name, level);
        
        // Update Group-Specific fields (Start Date & Instructors)
        await updateGroup(activeGroup.id, { 
            startDate,
            instructors: newInstructors
        });
    };

    const handleRemoveStudent = async (studentId: string, studentName: string) => {
        console.log(`[GroupDetailPanel] Remove Triggered -> Student: ${studentId}, Group: ${activeGroup.id} (${activeGroup.name})`);
        if (window.confirm(`Sigur vrei să elimini cursantul ${studentName} din această grupă?`)) {
            await removeStudentFromGroup(studentId, activeGroup.id);
        }
    };

    const handleAddExistingStudent = async (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        // Check if already enrolled (double check)
        const isEnrolled = student.enrollments.some(e => e.groupId === activeGroup.id);
        if (isEnrolled) {
            alert('Studentul este deja înscris în această grupă.');
            return;
        }

        const newEnrollment = {
            groupId: activeGroup.id,
            groupName: activeGroup.name,
            style: activeGroup.style,
            level: activeGroup.level,
            role: student.gender === 'M' ? 'Leader' : 'Follower', // Default guess
            schedule: `${activeGroup.schedule.day} ${activeGroup.schedule.time}`
        };

        const updatedEnrollments = [...student.enrollments, newEnrollment];
        
        // Optionally update main group if it's their only/first one
        const updates: any = { enrollments: updatedEnrollments };
        if (updatedEnrollments.length === 1) {
            updates.mainGroup = activeGroup.name;
        }

        await updateStudent(studentId, updates);
        setIsAddStudentModalOpen(false);
    };

    const handleDeleteGroup = async () => {
        if (window.confirm(`Ești sigur că vrei să ștergi definitiv grupa "${activeGroup.name}"? Această acțiune nu poate fi anulată.`)) {
            await deleteGroup(activeGroup.id);
            onBack();
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 w-fit transition-colors">
                <ArrowLeft size={18} /> <span className="font-medium">Înapoi la listă</span>
            </button>

            {/* Main Content Area - Scrollable on Mobile, Hidden Overflow on Desktop (internal scroll) */}
            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 flex-1 overflow-y-auto no-scrollbar xl:overflow-hidden pb-20 xl:pb-0">
                
                {/* LEFT COLUMN: Info Card */}
                <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col gap-4 xl:h-full xl:overflow-y-auto no-scrollbar xl:pb-10">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-2 ${theme.bg}`}></div>
                        <div className="flex justify-between items-center mb-6 mt-2">
                            <span className={`${theme.softBg} ${theme.softText} px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide`}>{activeGroup.level}</span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${activeGroup.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{activeGroup.status}</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-6 leading-tight">{activeGroup.name}</h1>
                        
                        {/* SCHEDULE WIDGET */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12}/> Detalii & Orar</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsMergeModalOpen(true)} className="text-[10px] font-bold text-gray-500 hover:text-gray-900 hover:underline flex items-center gap-1"><GitMerge size={10}/> Merge</button>
                                    <button onClick={() => setIsScheduleModalOpen(true)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><Edit3 size={10}/> Editează</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-gray-900 dark:text-white">{activeGroup.schedule.day}</span>
                                <span className="text-lg font-medium text-gray-400">|</span>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{activeGroup.schedule.time}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{activeGroup.schedule.room} • {activeGroup.schedule.duration}</p>
                            {activeGroup.startDate && (
                                <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded w-fit">
                                    Start: {new Date(activeGroup.startDate).toLocaleDateString('ro-RO')}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl"><p className="text-[10px] font-bold text-gray-400 uppercase">Înscriși</p><p className="text-2xl font-black text-gray-900 dark:text-white">{groupStudents.length}</p></div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl"><p className="text-[10px] font-bold text-gray-400 uppercase">Prezență</p><p className="text-2xl font-black text-blue-600">{attendanceRate}%</p></div>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-6">
                            <div className="flex gap-3">
                                {activeGroup.instructors.map((inst, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <img src={getInstructorAvatar(inst)} className="w-14 h-14 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 object-cover shadow-sm" />
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">{(inst.name || '').split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2"><Button onClick={onAddTask} variant="secondary" className="!w-auto h-9 text-xs px-3">Task</Button><Button className="!w-auto h-9 text-xs px-4 bg-gray-900 text-white">Mesaj</Button></div>
                        </div>
                    </div>
                    {activeGroup.risk.level !== 'low' && (
                        <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-3xl border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center gap-3 mb-2"><AlertTriangle size={20} className="text-red-500" /><h3 className="font-bold text-red-700 dark:text-red-400">Status Risc: {activeGroup.risk.level === 'high' ? 'Ridicat' : 'Mediu'}</h3></div>
                            <p className="text-sm text-red-600/80 dark:text-red-300 mb-3">{activeGroup.risk.reason}</p>
                            {activeGroup.aiInsights.filter(i => i.type === 'risk').map((insight, idx) => (<div key={idx} className="bg-white/60 dark:bg-black/20 p-3 rounded-xl text-xs font-medium flex items-start gap-2"><Sparkles size={12} className="text-yellow-500 mt-0.5 shrink-0" />{insight.text}</div>))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Tabs & Views */}
                <div className="flex-1 flex flex-col min-w-0 xl:h-full xl:overflow-hidden">
                    
                    {/* Sticky Tabs Header - HIGH Z-INDEX */}
                    <div className="sticky top-0 z-40 bg-[#F9FAFB] dark:bg-gray-950 pt-2 pb-2 -mx-4 px-4 xl:mx-0 xl:static xl:bg-transparent xl:px-1 xl:pt-1 xl:mb-6 border-b xl:border-b-0 border-gray-200 dark:border-gray-800 shadow-sm xl:shadow-none">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {[ 
                                { id: 'attendance', label: 'Prezență', icon: CalendarCheck },
                                { id: 'students', label: 'Cursanți', icon: Users }, 
                                { id: 'risk', label: 'Risc & AI', icon: Zap } 
                            ].map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setActiveTab(tab.id as any)} 
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 xl:overflow-y-auto no-scrollbar rounded-3xl pb-10">
                        {activeTab === 'students' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white">Lista Cursanți ({filteredStudents.length})</h3>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <input type="text" placeholder="Caută..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-all md:w-48" />
                                        <Button onClick={() => setIsAddStudentModalOpen(true)} className="!w-auto px-4 h-[38px] text-xs gap-2 bg-brand-yellow hover:bg-yellow-500 text-gray-900"><UserPlus size={16}/> Adaugă</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredStudents.map(student => {
                                        const expiryDate = new Date(student.subscription.expiryDate);
                                        const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)); 
                                        const isActive = student.subscription.active && daysLeft >= 0;
                                        const isExpiring = isActive && daysLeft <= 3;
                                        const statusColor = isActive ? (isExpiring ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500';
                                        
                                        return (
                                            <div key={student.id} onClick={() => onNavigateToStudent(student.id)} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col items-center relative group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusColor}`}></div>
                                                
                                                {/* REMOVE BUTTON */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id, student.name); }}
                                                    className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                                                    title="Elimină din grupă"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                <div className="relative mb-3 mt-2"><img src={student.avatarUrl} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 dark:border-gray-800 shadow-sm" alt={student.name} /><div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${statusColor} text-white`}>{isActive ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}</div></div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base text-center leading-tight mb-1 truncate w-full px-2">{student.name}</h4>
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{isActive ? `${daysLeft} Zile` : 'Expirat'}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        {activeTab === 'attendance' && (
                            <div className="animate-in fade-in slide-in-from-right-2 h-full">
                                <GroupAttendanceMatrix 
                                    group={activeGroup} 
                                    students={groupStudents} 
                                    onNavigateToStudent={onNavigateToStudent}
                                />
                            </div>
                        )}
                        {activeTab === 'risk' && (
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-3 animate-in fade-in slide-in-from-right-2">
                                {activeGroup.aiInsights.map((insight, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-start gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 ${insight.type === 'growth' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{insight.type === 'growth' ? <TrendingUp size={18}/> : <AlertTriangle size={18}/>}</div>
                                        <div><h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase mb-1">{insight.type}</h4><p className="text-sm text-gray-600 dark:text-gray-300">{insight.text}</p></div>
                                    </div>
                                ))}
                                {activeGroup.aiInsights.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Nicio alertă de risc pentru această grupă.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EditScheduleModal 
                isOpen={isScheduleModalOpen} 
                onClose={() => setIsScheduleModalOpen(false)} 
                onSave={handleScheduleUpdate}
                onDelete={handleDeleteGroup}
                initialSchedule={activeGroup.schedule}
                initialName={activeGroup.name}
                initialLevel={activeGroup.level}
                initialStartDate={activeGroup.startDate}
                initialInstructors={activeGroup.instructors}
            />

            <AddStudentModal
                isOpen={isAddStudentModalOpen}
                onClose={() => setIsAddStudentModalOpen(false)}
                onSave={(s) => { addStudent(s); setIsAddStudentModalOpen(false); }}
                initialGroupId={activeGroup.id}
                existingStudents={students}
                onAddExisting={handleAddExistingStudent}
            />

            <MergeGroupModal 
                isOpen={isMergeModalOpen}
                onClose={() => setIsMergeModalOpen(false)}
                sourceGroup={activeGroup}
                onMergeSuccess={() => {
                    setIsMergeModalOpen(false);
                    onBack();
                }}
            />
        </div>
    );
};
