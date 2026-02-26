import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Save, Calendar, Clock, CheckSquare, Square, ChevronRight, CalendarDays, Layers } from 'lucide-react';
import { Lead, DanceStyle } from '../../../types';
import { useData } from '../../../contexts/DataContext';

interface GroupSchedulerProps {
    lead: Lead;
    onSave: (leadId: string, updates: Partial<Lead>) => void;
    children?: React.ReactNode;
    mode?: 'edit' | 'add';
    targetGroupId?: string;
}

// --- Helpers ---

const parseDateToISO = (dateStr?: string): string => {
    if (!dateStr) return '';
    
    const lower = dateStr.toLowerCase().trim();
    const now = new Date();
    
    if (lower === 'azi' || lower === 'astazi') return now.toISOString().split('T')[0];
    if (lower === 'ieri') { 
        now.setDate(now.getDate() - 1); 
        return now.toISOString().split('T')[0]; 
    }
    if (lower === 'maine' || lower === 'mâine') { 
        now.setDate(now.getDate() + 1); 
        return now.toISOString().split('T')[0]; 
    }

    // Handle DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        // parts[2] = YYYY, parts[1] = MM, parts[0] = DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    // Return as is if it looks like YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

    return '';
};

const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('ro-RO');
};

export const GroupScheduler: React.FC<GroupSchedulerProps> = ({ 
    lead, 
    onSave, 
    children, 
    mode = 'edit', 
    targetGroupId 
}) => {
    const { groups } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        groupIds: [] as string[],
        date: ''
    });
    
    // UI State for tabs
    const [activeStyleTab, setActiveStyleTab] = useState<string>('Toate');

    // 1. Compute Currently Selected Groups for Display
    const currentGroups = useMemo(() => {
        const ids = lead.interest.groupIds || (lead.interest.groupId ? [lead.interest.groupId] : []);
        return groups.filter(g => ids.includes(g.id));
    }, [groups, lead.interest]);

    // 2. Initialize Form Data when Dropdown Opens
    useEffect(() => {
        if (isOpen) {
            // Determine initial selection
            let initGroupIds = lead.interest.groupIds ? [...lead.interest.groupIds] : (lead.interest.groupId ? [lead.interest.groupId] : []);
            
            // If in "add" mode or specifically targeting a group, adjust selection
            if (targetGroupId && !initGroupIds.includes(targetGroupId)) {
                // Keep existing logic
            }

            // Fallback: If no IDs, try matching by style/level/day
            if (initGroupIds.length === 0 && mode === 'edit') {
                const legacyMatch = groups.find(g => 
                    g.style === lead.interest.style && 
                    g.level === lead.interest.level &&
                    (lead.interest.preferredDays && lead.interest.preferredDays.includes(g.schedule.day))
                );
                if (legacyMatch) initGroupIds.push(legacyMatch.id);
            }

            setFormData({
                groupIds: initGroupIds,
                date: parseDateToISO(lead.nextActionDate)
            });
            
            // Set initial tab based on existing selection or default
            if (initGroupIds.length > 0) {
                const firstGroup = groups.find(g => g.id === initGroupIds[0]);
                if (firstGroup) setActiveStyleTab(firstGroup.style);
            } else {
                setActiveStyleTab(Object.values(DanceStyle)[0]); 
            }
        }
    }, [isOpen, lead, groups, mode, targetGroupId]);

    // 3. Handlers
    const toggleDropdown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
        } else {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + window.scrollY + 6,
                    left: rect.left + window.scrollX
                });
            }
            setIsOpen(true);
        }
    };

    const handleSaveInternal = () => {
        const selectedGroups = groups.filter(g => formData.groupIds.includes(g.id));
        const formattedDate = formData.date ? formatDateForDisplay(formData.date) : lead.nextActionDate;

        // Determine primary display values (Fallback logic for single-value fields)
        const primaryGroup = selectedGroups[0] || null;
        const newStyle = primaryGroup ? primaryGroup.style : lead.interest.style;
        const newLevel = primaryGroup ? primaryGroup.level : lead.interest.level;
        
        // Merge unique days from all selected groups
        const allDays = Array.from(new Set(selectedGroups.map(g => g.schedule.day)));

        onSave(lead.id, {
            interest: {
                ...lead.interest,
                style: newStyle,
                level: newLevel,
                preferredDays: allDays.length > 0 ? allDays : lead.interest.preferredDays,
                groupId: primaryGroup?.id, // Legacy support
                groupIds: formData.groupIds // Modern support
            },
            nextActionDate: formattedDate,
            status: formData.date ? 'Programat' : lead.status
        });
        setIsOpen(false);
    };

    const toggleGroupSelection = (groupId: string) => {
        setFormData(prev => {
            const exists = prev.groupIds.includes(groupId);
            return {
                ...prev,
                groupIds: exists 
                    ? prev.groupIds.filter(id => id !== groupId) 
                    : [...prev.groupIds, groupId]
            };
        });
    };

    const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
        const d = new Date();
        if (type === 'tomorrow') d.setDate(d.getDate() + 1);
        if (type === 'nextWeek') d.setDate(d.getDate() + 7);
        setFormData(prev => ({ ...prev, date: d.toISOString().split('T')[0] }));
    };

    // 4. Click Outside / Scroll Listener
    useEffect(() => {
        if (!isOpen) return;

        const handleScroll = () => setIsOpen(false);
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
                containerRef.current && !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll, true); 
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 5. Renderers
    const renderTriggerContent = () => {
        if (children) return children;

        if (currentGroups.length === 0) {
            return (
                <span className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                    Selectează...
                </span>
            );
        }

        // Show distinct styles count if multiple
        const uniqueStyles = Array.from(new Set(currentGroups.map(g => g.style))) as string[];

        if (uniqueStyles.length > 1) {
             return (
                <div className="flex flex-col items-start leading-none">
                    <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                        {currentGroups.length} Grupe
                        <ChevronRight size={10} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                    <div className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-1">
                        {uniqueStyles.map(s => <span key={s} className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{s.slice(0,3)}</span>)}
                    </div>
                </div>
            );
        }

        if (currentGroups.length === 1) {
            const g = currentGroups[0];
            return (
                <div className="flex flex-col items-start leading-none">
                    <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                        {g.schedule.time}
                        <ChevronRight size={10} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                    <div className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin size={8} /> {g.schedule.room}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-start leading-none">
                <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
                    {currentGroups.length} Grupe
                    <ChevronRight size={10} className="text-gray-300 group-hover:text-blue-500" />
                </div>
                <div className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-1 flex flex-col gap-0.5">
                    {currentGroups.slice(0, 2).map(g => (
                        <span key={g.id} className="truncate max-w-[100px]">{g.schedule.day} {g.schedule.time}</span>
                    ))}
                    {currentGroups.length > 2 && <span>...</span>}
                </div>
            </div>
        );
    };

    const visibleGroups = useMemo(() => {
        if (activeStyleTab === 'Toate') return groups;
        return groups.filter(g => g.style === activeStyleTab);
    }, [groups, activeStyleTab]);

    return (
        <>
            {/* TRIGGER */}
            <div 
                ref={containerRef} 
                onClick={toggleDropdown} 
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 -ml-1.5 transition-all group h-full flex items-center ${mode === 'add' ? 'inline-flex w-auto' : ''}`}
                title={mode === 'add' ? "Adaugă Grupă" : "Modifică Grupa/Data"}
            >
                {renderTriggerContent()}
            </div>

            {/* PORTAL DROPDOWN */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] pointer-events-none">
                    <div 
                        ref={dropdownRef}
                        className="absolute bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 w-[340px] pointer-events-auto"
                        style={{ top: coords.top, left: coords.left - 10 }}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} /> {mode === 'add' ? 'Adaugă Grupă' : 'Programează Lead'}
                            </span>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="p-4 space-y-5">
                            {/* Group Selector */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Alege Grupe</label>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formData.groupIds.length} selectate</span>
                                </div>
                                
                                {/* Style Tabs */}
                                <div className="flex gap-1 mb-2 overflow-x-auto no-scrollbar pb-1">
                                    {['Toate', ...Object.values(DanceStyle)].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setActiveStyleTab(style)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border ${
                                                activeStyleTab === style 
                                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' 
                                                : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>

                                <div className="max-h-48 overflow-y-auto no-scrollbar border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                                    {visibleGroups.map(g => {
                                        const isSelected = formData.groupIds.includes(g.id);
                                        return (
                                            <div 
                                                key={g.id} 
                                                onClick={() => toggleGroupSelection(g.id)}
                                                className={`flex items-start gap-3 p-2.5 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                            >
                                                <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                                                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{g.name}</p>
                                                        {isSelected && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{g.schedule.day} • {g.schedule.time} • {g.style}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {visibleGroups.length === 0 && (
                                        <div className="p-4 text-center text-xs text-gray-400">Nu există grupe pentru acest stil.</div>
                                    )}
                                </div>
                            </div>

                            {/* Summary of Selected Groups (if any) */}
                            {formData.groupIds.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex flex-wrap gap-1">
                                    {groups.filter(g => formData.groupIds.includes(g.id)).map(g => (
                                        <span key={g.id} className="text-[9px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            {g.style} {g.level} <button onClick={(e) => {e.stopPropagation(); toggleGroupSelection(g.id);}} className="hover:text-red-500"><X size={10}/></button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Date Picker */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase tracking-wide">Data Programată</label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={formData.date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-inner"
                                        />
                                        <CalendarDays size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setQuickDate('today')} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-200 transition-colors">Azi</button>
                                        <button onClick={() => setQuickDate('tomorrow')} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-200 transition-colors">Mâine</button>
                                        <button onClick={() => setQuickDate('nextWeek')} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-200 transition-colors">+7 Zile</button>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button 
                                onClick={handleSaveInternal}
                                disabled={formData.groupIds.length === 0}
                                className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
                            >
                                <Save size={14} /> {mode === 'add' ? 'Adaugă Grupă' : 'Programează'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};