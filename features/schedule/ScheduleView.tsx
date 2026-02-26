
import React, { useState, useEffect } from 'react';
import { MapPin, User, Users, Eye, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Badge, Switch, Button } from '../../components/UIComponents';
import { getStyleTheme } from '../../utils/themeUtils';
import { useData } from '../../contexts/DataContext';
import { GroupDetailedProfile } from '../../types';

interface ScheduleViewProps {
    onNavigateToClass: (id: string) => void;
}

// Standard time slots for the grid to create drop zones
const TIME_SLOTS = ['18:30', '19:30', '20:30', '21:30'];

// Helper to calculate the actual dates for the columns (Mon-Thu)
const getColumnDate = (dayIndex: number): string => {
    const today = new Date();
    const resultDate = new Date();
    // 1 = Monday, 2 = Tuesday, etc.
    let diff = (dayIndex + 7 - today.getDay()) % 7;
    if (diff === 0 && today.getHours() > 22) diff = 7; 
    resultDate.setDate(today.getDate() + diff);
    return resultDate.toISOString().split('T')[0];
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateToClass }) => {
    const { groups, updateMasterSchedule } = useData();
    
    // Local State for Batch Editing
    const [localGroups, setLocalGroups] = useState<GroupDetailedProfile[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<'All' | 'Mille 18' | 'Victoriei Ballroom'>('All');

    // Sync localGroups with context groups on load or reset
    useEffect(() => {
        if (!hasChanges && groups.length > 0) {
            setLocalGroups(JSON.parse(JSON.stringify(groups)));
        }
    }, [groups, hasChanges]);

    const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);

    const handleDragStart = (e: React.DragEvent, groupId: string) => {
        setDraggedGroupId(groupId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", groupId);
        (e.target as HTMLElement).style.opacity = "0.5";
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.target as HTMLElement).style.opacity = "1";
        setDraggedGroupId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetDay: string, targetTime: string, targetRoom: string) => {
        e.preventDefault();
        const groupId = e.dataTransfer.getData("text/plain");
        
        if (groupId) {
            setLocalGroups(prev => {
                return prev.map(g => {
                    if (g.id === groupId) {
                        return {
                            ...g,
                            schedule: {
                                ...g.schedule,
                                day: targetDay,
                                time: targetTime,
                                room: targetRoom
                            }
                        };
                    }
                    return g;
                });
            });
            setHasChanges(true);
        }
        setDraggedGroupId(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const promises = [];
            for (const localGroup of localGroups) {
                const original = groups.find(g => g.id === localGroup.id);
                // Only update if schedule actually changed
                if (original && JSON.stringify(localGroup.schedule) !== JSON.stringify(original.schedule)) {
                    promises.push(updateMasterSchedule(localGroup.id, localGroup.schedule));
                }
            }
            await Promise.all(promises);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to save schedule:", error);
            alert("Eroare la salvarea orarului.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setLocalGroups(JSON.parse(JSON.stringify(groups)));
        setHasChanges(false);
    };

    // Helper to determine heatmap color
    const getHeatmapColor = (current: number, room: string) => {
        const dangerThreshold = 15;
        let maxCapacity = 40; 
        if (room === 'Victoriei Ballroom') maxCapacity = 30;
        const healthyThreshold = Math.floor(maxCapacity * 0.65); 

        if (current < dangerThreshold) return `rgba(239, 68, 68, 0.25)`; // Red
        if (current >= healthyThreshold) return `rgba(34, 197, 94, 0.25)`; // Green
        return `rgba(234, 179, 8, 0.25)`; // Yellow
    };

    const renderTimeSlot = (dayName: string, time: string, room: string, dayDate: string) => {
        // Use localGroups for rendering to reflect drag ops immediately
        const existingGroup = localGroups.find(g => 
            g.schedule.day === dayName && 
            g.schedule.time === time && 
            g.schedule.room === room
        );

        // Check if this specific group has been modified compared to DB
        const isModified = existingGroup && groups.find(g => g.id === existingGroup.id)?.schedule.time !== time;

        const theme = existingGroup ? getStyleTheme(existingGroup.style, existingGroup.level) : null;

        return (
            <div 
                key={`${dayName}-${time}-${room}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dayName, time, room)}
                className={`
                    min-h-[140px] rounded-xl border border-dashed transition-all p-1 flex flex-col relative
                    ${draggedGroupId && !existingGroup ? 'bg-blue-50/50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700' : 'border-transparent'}
                    ${!existingGroup ? 'hover:bg-gray-50 dark:hover:bg-gray-800/30' : ''}
                `}
            >
                {!existingGroup && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-gray-300 dark:text-gray-600">{time}</span>
                    </div>
                )}

                {existingGroup && theme && (
                    <div 
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, existingGroup.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => { e.stopPropagation(); onNavigateToClass(existingGroup.id); }}
                        className={`h-full bg-white dark:bg-gray-900 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative z-10 overflow-hidden
                            ${existingGroup.risk?.level === 'high' ? 'border-red-400 dark:border-red-500 ring-1 ring-red-100 dark:ring-red-900/20' : ''}
                            ${isModified ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900 shadow-lg' : 'border-gray-100 dark:border-gray-800'}
                        `}
                    >
                        <div 
                            className="absolute inset-0 pointer-events-none transition-colors duration-500 z-0"
                            style={{
                                backgroundColor: showHeatmap 
                                    ? getHeatmapColor(existingGroup.stats.enrolledCount || 0, existingGroup.schedule.room) 
                                    : 'transparent'
                            }} 
                        />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-2">
                                <Badge color={`${theme.bg} ${theme.text} ${theme.bg === 'bg-white' ? 'border border-gray-200' : ''}`}>{existingGroup.schedule.time}</Badge>
                                <span className="text-[10px] text-gray-400">{existingGroup.schedule.duration}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1">{existingGroup.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                <User size={10} /> {existingGroup.instructors.map((i: any) => i.name.split(' ')[0]).join('&')}
                            </p>
                            <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-2 mt-auto">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                    <Users size={12}/> 
                                    <span className={existingGroup.stats.enrolledCount < 15 ? 'text-red-500' : ''}>
                                        {existingGroup.stats.enrolledCount}/{existingGroup.stats.maxCapacity}
                                    </span>
                                    {existingGroup.stats.enrolledCount < 15 && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1" title="Low Occupancy"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {existingGroup.stats.energyLevel === 'Low' && <AlertCircle size={10} className="text-red-500"/>}
                                    <span className={`text-[10px] font-bold ${existingGroup.stats.energyLevel === 'High' ? 'text-green-500' : existingGroup.stats.energyLevel === 'Low' ? 'text-red-500' : 'text-yellow-500'}`}>{existingGroup.stats.energyLevel}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDayColumn = (dayName: string, dayIndex: number, room: string) => {
        const dateStr = getColumnDate(dayIndex);
        return (
            <div key={dayName} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">{dayName}</h3>
                    <p className="text-[10px] text-gray-400">{dateStr}</p>
                </div>
                <div className="flex-1 p-2 space-y-2 bg-gray-50/10 dark:bg-gray-900/20">
                    {TIME_SLOTS.map(time => renderTimeSlot(dayName, time, room, dateStr))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-12 select-none animate-in fade-in duration-300">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">Orar Master</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Modifică structura săptămânală a grupelor.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Location Selector */}
                    <div className="relative group">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" />
                        <select 
                            value={selectedLocation} 
                            onChange={(e) => setSelectedLocation(e.target.value as any)}
                            className="pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer h-10 min-w-[140px] text-gray-700 dark:text-gray-200"
                        >
                            <option value="All">Toate Sălile</option>
                            <option value="Mille 18">Mille 18</option>
                            <option value="Victoriei Ballroom">Victoriei</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Button variant="secondary" onClick={handleCancel} className="!w-auto h-10 px-4 text-xs">
                                <RotateCcw size={14} className="mr-2"/> Anulează
                            </Button>
                            <Button onClick={handleSave} isLoading={isSaving} className="!w-auto h-10 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-200">
                                <Save size={14} className="mr-2"/> Salvează Modificările
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm h-10">
                        <Eye size={16} className="text-gray-500"/>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:inline">Heatmap</span>
                        <Switch checked={showHeatmap} onChange={setShowHeatmap} />
                    </div>
                </div>
           </div>

           {(selectedLocation === 'All' || selectedLocation === 'Mille 18') && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                     <div className="p-2 bg-ginga-100 dark:bg-ginga-900 rounded-lg text-ginga-600 dark:text-ginga-300">
                        <MapPin size={24} />
                     </div>
                     <h2 className="text-xl font-black text-gray-900 dark:text-white">Mille 18</h2>
                     <Badge color="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Str. Constantin Mille 18</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {['Luni', 'Marți', 'Miercuri', 'Joi'].map((day, idx) => renderDayColumn(day, idx + 1, 'Mille 18'))}
                  </div>
               </div>
           )}
           
           {(selectedLocation === 'All' || selectedLocation === 'Victoriei Ballroom') && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-2">
                     <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300">
                        <MapPin size={24} />
                     </div>
                     <h2 className="text-xl font-black text-gray-900 dark:text-white">Victoriei Ballroom</h2>
                     <Badge color="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Calea Victoriei 21</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {['Luni', 'Marți', 'Miercuri', 'Joi'].map((day, idx) => renderDayColumn(day, idx + 1, 'Victoriei Ballroom'))}
                  </div>
               </div>
           )}
        </div>
    );
};
