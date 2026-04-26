
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListTodo, Calendar, MapPin, MoreHorizontal, MessageSquare, CalendarCheck, Download, ArrowUpRight, ArrowDownRight, AlertCircle, Check, Filter, User, PlayCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GroupDetailedProfile, DanceStyle, SkillLevel } from '../../types';
import { format, subMonths, isAfter, startOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { getStyleTheme } from '../../utils/themeUtils';
import { Button, Badge } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';
import { GroupDetailPanel } from './components/GroupDetailPanel';
import { AddGroupModal } from './components/AddGroupModal';

interface GroupsViewProps {
    initialGroupId: string | null;
    onClearInitialGroup: () => void;
    onNavigateToStudent: (id: string) => void;
    onAddTask: (title: string, priority?: 'high'|'medium'|'low', tag?: string, assignee?: {name: string, avatarUrl: string}, description?: string, status?: 'inbox' | 'pending' | 'done' | 'archived') => void;
}

const getCourseWeek = (startDateStr: string | undefined) => {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    const now = new Date();
    
    // Reset hours for accurate day diff
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: `Începe în ${Math.abs(diffDays)} zile`, type: 'future' };
    
    // Week 1 starts on day 0. Week 2 starts on day 7.
    const week = Math.floor(diffDays / 7) + 1;
    return { label: `Săptămâna ${week}`, type: 'current' };
};

export const GroupsView: React.FC<GroupsViewProps> = ({ initialGroupId, onClearInitialGroup, onNavigateToStudent, onAddTask }) => {
    const { groups, students, instructors } = useData(); 
    const [selectedGroup, setSelectedGroup] = useState<GroupDetailedProfile | undefined>(undefined);
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeStyle, setActiveStyle] = useState<string>('Toate');
    const [timeRange, setTimeRange] = useState<number>(3); // Default 3 months

    const timeRanges = [
        { label: '1 lună', value: 1 },
        { label: '2 luni', value: 2 },
        { label: '3 luni', value: 3 },
        { label: '6 luni', value: 6 },
        { label: '1 an', value: 12 },
    ];

    // Aggregate real attendance data from all students
    const getGroupAttendanceData = (group: GroupDetailedProfile, months: number) => {
        const cutoffDate = subMonths(new Date(), months);
        
        // Map to store counts per date
        const attendanceMap: Record<string, number> = {};
        
        // 1. Check if group has pre-calculated history (from Firestore)
        if (group.attendanceHistory && group.attendanceHistory.length > 0) {
            group.attendanceHistory.forEach(h => {
                if (isAfter(new Date(h.date), cutoffDate)) {
                    attendanceMap[h.date] = (attendanceMap[h.date] || 0) + h.count;
                }
            });
        }
        
        // 2. Also aggregate from students' individual histories to ensure real-time accuracy
        // (This covers cases where group.attendanceHistory might not be perfectly synced)
        students.forEach(student => {
            student.attendanceHistory?.forEach(record => {
                if (record.status === 'present' && record.className === group.name) {
                    if (isAfter(new Date(record.date), cutoffDate)) {
                        // We use a Set or similar if we wanted to avoid double counting with group.attendanceHistory,
                        // but usually it's one or the other. 
                        // If group.attendanceHistory was empty, this will populate it.
                        if (!group.attendanceHistory || group.attendanceHistory.length === 0) {
                            attendanceMap[record.date] = (attendanceMap[record.date] || 0) + 1;
                        }
                    }
                }
            });
        });

        const history = Object.entries(attendanceMap).map(([date, count]) => ({
            date,
            count
        }));

        if (history.length === 0) return [];

        return history
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(h => ({
                date: format(new Date(h.date), months <= 1 ? 'dd MMM' : months <= 3 ? 'dd MMM' : 'MMM yy', { locale: ro }),
                count: h.count,
                fullDate: h.date
            }));
    };

    useEffect(() => {
        if(initialGroupId) {
            const grp = groups.find(g => g.id === initialGroupId);
            if(grp) setSelectedGroup(grp);
        }
    }, [initialGroupId, groups]);

    const getInstructorAvatar = (inst: { id?: string; name: string; avatarUrl?: string }) => {
        if (inst.id) {
            const match = instructors.find(i => i.id === inst.id);
            if (match) return match.avatarUrl;
        }
        
        const safeInstName = (inst.name || '').toLowerCase().trim();
        if (safeInstName) {
             const matchName = instructors.find(i => (i.name || '').toLowerCase().includes(safeInstName));
             if (matchName) return matchName.avatarUrl;
        }

        return inst.avatarUrl || 'https://via.placeholder.com/150?text=Instr';
    };

    const getEnrolledCount = (group: GroupDetailedProfile) => {
        if (group.students && group.students.length > 0) return group.students.length;
        return students.filter(s => s.enrollments?.some(e => e.groupId === group.id) || s.mainGroup === group.name).length;
    };

    const filteredGroups = groups.filter(g => {
        if (activeStyle === 'Toate') return true;
        return g.style === activeStyle;
    });

    const getLevelColor = (level: SkillLevel) => {
        switch (level) {
            case SkillLevel.START: return 'bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]';
            case SkillLevel.BEGINNER: return 'bg-[#34A853] text-white';
            case SkillLevel.IMPROVERS: return 'bg-[#F4B400] text-white'; // Corrected per screenshot (Improvers/Intermediate yellow/orange)
            case SkillLevel.INTERMEDIATE: return 'bg-[#F4B400] text-white';
            case SkillLevel.ADVANCED: return 'bg-[#E53935] text-white';
            default: return 'bg-gray-800 text-white';
        }
    };

    if (selectedGroup) {
        return (
            <GroupDetailPanel 
                group={selectedGroup} 
                onBack={() => { setSelectedGroup(undefined); onClearInitialGroup(); }}
                onNavigateToStudent={onNavigateToStudent}
                onAddTask={() => onAddTask(`Verifică grupa ${selectedGroup.name}`, 'high', 'Retention')}
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#F9FAFB] dark:bg-gray-950">
            {/* Header / Filter Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3 w-full items-center justify-between">
                     {/* Filters */}
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full items-center">
                        <button
                            onClick={() => setActiveStyle('Toate')}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                activeStyle === 'Toate' 
                                ? 'bg-[#111827] text-white shadow-md' 
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            Toate
                        </button>
                        {[DanceStyle.SALSA, DanceStyle.BACHATA, DanceStyle.KIZOMBA, DanceStyle.LADY_STYLING, DanceStyle.MEN_STYLING, DanceStyle.TRUPE].map(style => (
                            <button
                                key={style}
                                onClick={() => setActiveStyle(style)}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                    activeStyle === style 
                                    ? 'bg-[#111827] text-white shadow-md' 
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                     </div>

                     <div className="flex items-center gap-3 shrink-0">
                         <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                             {timeRanges.map(range => (
                                 <button
                                     key={range.value}
                                     onClick={() => setTimeRange(range.value)}
                                     className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                         timeRange === range.value 
                                         ? 'bg-blue-50 text-blue-600' 
                                         : 'text-gray-400 hover:text-gray-600'
                                     }`}
                                 >
                                     {range.label}
                                 </button>
                             ))}
                             <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 self-center"></div>
                             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}><LayoutDashboard size={18} /></button>
                             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}><ListTodo size={18} /></button>
                         </div>
                         <Button onClick={() => setIsAddGroupModalOpen(true)} className="!w-auto px-6 h-[42px] text-xs font-bold bg-[#FACC15] text-[#111827] hover:bg-[#EAB308] border-none shadow-sm rounded-xl">
                             Grupă Nouă
                         </Button>
                     </div>
                </div>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-20">
                {filteredGroups.map(group => {
                    const realCount = getEnrolledCount(group);
                    const weekInfo = getCourseWeek(group.startDate);

                    return (
                    <div key={group.id} onClick={() => setSelectedGroup(group)} className="bg-white border border-gray-100 shadow-sm dark:bg-gray-900 dark:border-gray-800 p-6 rounded-[24px] hover:shadow-md transition-all flex flex-col relative cursor-pointer group h-full">
                        
                        {/* Header: Level & Menu */}
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getLevelColor(group.level)}`}>
                                {group.level}
                            </span>
                            {weekInfo && (
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                    weekInfo.type === 'future' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                }`}>
                                    <PlayCircle size={10} />
                                    {weekInfo.label}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-4">{group.name}</h3>

                        {/* Middle Section: Schedule & Instructors */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                    <Calendar size={16} />
                                    <span>{group.schedule.day} • {group.schedule.time} • {group.schedule.room.split(' ')[0]}</span>
                                </div>
                                
                                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg w-fit">
                                    <User size={14}/>
                                    <span className="text-xs font-bold">♀ {group.students.filter(s => s.gender === 'F').length} / ♂ {group.students.filter(s => s.gender === 'M').length}</span>
                                </div>
                                
                                {group.risk.level === 'high' ? (
                                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg w-fit">
                                        <AlertCircle size={14}/>
                                        <span className="text-xs font-bold">{group.risk.reason || 'Număr mic de cursanți'}</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg w-fit">
                                        <Check size={14}/>
                                        <span className="text-xs font-bold">Stabil</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {group.instructors.slice(0, 2).map((inst, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <img 
                                            src={getInstructorAvatar(inst)} 
                                            className="w-16 h-16 rounded-full border-2 border-white bg-gray-100 object-cover shadow-sm" 
                                            title={inst.name}
                                        />
                                        <span className="text-[10px] font-bold text-gray-500 mt-1">{(inst.name || '').split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Attendance Chart */}
                        <div className="h-32 mt-auto mb-4 -mx-2 flex items-center justify-center">
                            {getGroupAttendanceData(group, timeRange).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getGroupAttendanceData(group, timeRange)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis hide domain={[0, 50]} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#6B7280' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#3B82F6" 
                                            strokeWidth={3} 
                                            dot={{ r: 3, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                            animationDuration={1000}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 w-full h-full flex items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    Nicio dată de prezență
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={(e) => e.stopPropagation()} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                                <MessageSquare size={20} />
                            </button>
                            <button onClick={(e) => e.stopPropagation()} className="p-2 text-gray-400 hover:text-green-600 rounded-lg transition-colors">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                    );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10">
                  {filteredGroups.map(group => {
                      const realCount = getEnrolledCount(group);
                      const weekInfo = getCourseWeek(group.startDate);

                      return (
                          <div key={group.id} onClick={() => setSelectedGroup(group)} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-4 flex-1">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white ${group.style === DanceStyle.BACHATA ? 'bg-[#E53935]' : 'bg-purple-600'}`}>
                                      {(group.style || '').charAt(0)}
                                  </div>
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <h3 className="text-base font-bold text-gray-900 dark:text-white">{group.name}</h3>
                                          {weekInfo && (
                                              <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">
                                                  {weekInfo.label}
                                              </span>
                                          )}
                                          {group.risk.level === 'high' && <AlertCircle size={14} className="text-red-500"/>}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                          <span className="flex items-center gap-1"><Calendar size={12}/> {group.schedule.day}, {group.schedule.time}</span>
                                          <span className="flex items-center gap-1"><MapPin size={12}/> {group.schedule.room}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="w-48 h-12 flex items-center justify-center">
                                  {getGroupAttendanceData(group, timeRange).length > 0 ? (
                                      <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={getGroupAttendanceData(group, timeRange)}>
                                              <Line 
                                                type="monotone" 
                                                dataKey="count" 
                                                stroke="#3B82F6" 
                                                strokeWidth={2} 
                                                dot={false} 
                                                animationDuration={1000}
                                              />
                                              <XAxis dataKey="date" hide />
                                              <YAxis hide domain={[0, 50]} />
                                              <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                              />
                                          </LineChart>
                                      </ResponsiveContainer>
                                  ) : (
                                      <div className="text-[8px] font-bold text-gray-300 uppercase tracking-tight">Fără date</div>
                                  )}
                              </div>
                              <div className="text-center w-24">
                                  <span className="block font-black text-gray-900 dark:text-white">♀ {group.students.filter(s => s.gender === 'F').length} / ♂ {group.students.filter(s => s.gender === 'M').length}</span>
                                  <span className="text-[9px] text-gray-400 uppercase font-bold">Raport F/B</span>
                              </div>
                              <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                                  <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg"><MessageSquare size={18}/></button>
                                  <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg"><CalendarCheck size={18}/></button>
                              </div>
                          </div>
                      );
                  })}
              </div>
            )}

            <AddGroupModal 
                isOpen={isAddGroupModalOpen} 
                onClose={() => setIsAddGroupModalOpen(false)} 
            />
        </div>
    );
};
