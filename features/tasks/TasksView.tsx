
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, CheckCircle, Trash2, Calendar, Tag, Filter, Check, ListTodo, AlertCircle, User, Edit2, X, Save, GripVertical, Clock, CalendarDays, AlignLeft, ArrowUpDown, StickyNote, Archive, RotateCcw, Folder, FolderPlus, ChevronRight, Hash, Sparkles, Megaphone, Home, Music, Heart, Star, Zap, Target, MessageSquare } from 'lucide-react';
import { AdminTask, TaskProject } from '../../types';
import { INITIAL_USER } from '../../constants';
import { Button, Modal, Input } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';

interface TasksViewProps {
    tasks: AdminTask[];
    onAddTask: (title: string, priority?: 'high'|'medium'|'low', tag?: string, assignee?: {name: string, avatarUrl: string}, description?: string, status?: 'inbox' | 'pending' | 'done' | 'archived', projectId?: string) => void;
    onUpdateTask: (task: AdminTask) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
}

// Helper to parse display date (e.g. "Azi", "15 Dec") to ISO YYYY-MM-DD for input
const parseDateToIso = (displayDate: string): string => {
    if (!displayDate) return '';
    const now = new Date();
    const currentYear = now.getFullYear();
    const lower = displayDate.toLowerCase().trim();
    
    if (lower === 'azi') return now.toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (lower === 'mâine' || lower === 'maine') {
        const d = new Date(now); d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('en-CA');
    }
    if (lower === 'ieri') {
        const d = new Date(now); d.setDate(d.getDate() - 1);
        return d.toLocaleDateString('en-CA');
    }
    
    // Try parsing "15 Dec" or "15 Dec 2024"
    const parts = displayDate.split(' ');
    if (parts.length >= 2) {
        const day = parseInt(parts[0]);
        const monthsRo = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthPart = parts[1]?.toLowerCase() || '';
        const monthIndex = monthsRo.findIndex(m => monthPart.startsWith(m));
        
        if (!isNaN(day) && monthIndex !== -1) {
            const year = parts[2] ? parseInt(parts[2]) : currentYear;
            const d = new Date(year, monthIndex, day);
            // Adjust for timezone offset to prevent day shift on conversion
            const offset = d.getTimezoneOffset() * 60000;
            return (new Date(d.getTime() - offset)).toISOString().split('T')[0];
        }
    }
    
    // Check if already ISO
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) return displayDate;

    return '';
};

// Helper to format ISO date back to friendly display
const formatIsoToDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Azi';
    if (d.toDateString() === tomorrow.toDateString()) return 'Mâine';
    if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
    
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
};

export const TasksView: React.FC<TasksViewProps> = ({ tasks, onAddTask, onUpdateTask, onToggleTask, onDeleteTask }) => {
    const { instructors, reorderTasks, students, projects, addProject, updateProject, deleteProject } = useData(); 

    const [filter, setFilter] = useState<'pending' | 'inbox' | 'done' | 'archived' | 'all'>('pending');
    const [view, setView] = useState<'today' | 'upcoming' | 'inbox' | 'done' | 'archived' | string>('today'); // string is projectId
    const [tagFilter, setTagFilter] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'default' | 'priority'>('default');
    
    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
    
    // Project Modal State
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<TaskProject | null>(null);
    const [projectFormName, setProjectFormName] = useState('');
    const [projectFormColor, setProjectFormColor] = useState('#3B82F6');
    const [projectFormIcon, setProjectFormIcon] = useState('Folder');

    const projectIcons = [
        { name: 'Folder', icon: Folder },
        { name: 'Sparkles', icon: Sparkles },
        { name: 'Megaphone', icon: Megaphone },
        { name: 'Home', icon: Home },
        { name: 'Music', icon: Music },
        { name: 'Heart', icon: Heart },
        { name: 'Star', icon: Star },
        { name: 'Zap', icon: Zap },
        { name: 'Target', icon: Target },
        { name: 'Message', icon: MessageSquare }
    ];

    // Form State
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriority, setFormPriority] = useState<'high'|'medium'|'low'>('medium');
    const [formTag, setFormTag] = useState('');
    const [formDate, setFormDate] = useState(''); // Stores ISO YYYY-MM-DD while modal is open
    const [formAssigneeId, setFormAssigneeId] = useState<string>('none');
    const [formProjectId, setFormProjectId] = useState<string>('none');

    // Dynamic Staff Members from Database (Students with 'Staff' subscription)
    const staffMembers = students
        .filter(s => s.subscription?.type === 'Staff')
        .map(s => ({
            id: s.id,
            name: s.name,
            avatarUrl: s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random`
        }));

    // Build Assignee Options (Staff + Instructors only, removing hardcoded admins)
    // EXPLICIT FILTER: Remove Ana and Dan as requested
    const assigneeOptions = [
        ...staffMembers,
        ...instructors.map(i => ({ id: i.id, name: i.name, avatarUrl: i.avatarUrl }))
    ].filter(p => p.name && !['Ana', 'Dan'].includes(p.name) && !p.name.startsWith('Ana ') && !p.name.startsWith('Dan '));

    const tags = ['All', 'Sales', 'Finance', 'Marketing', 'Admin', 'Events', 'PR', 'HR', 'Festivals'];
    const priorities = [
        { id: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600 border-gray-200' },
        { id: 'medium', label: 'Medium', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
        { id: 'high', label: 'High', color: 'bg-red-50 text-red-600 border-red-200' }
    ];

    // --- DRAG AND DROP STATE ---
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
    const [filteredTasks, setFilteredTasks] = useState<AdminTask[]>([]);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

    // Grouping for "In continuare"
    const groupedUpcomingTasks = useMemo(() => {
        if (view !== 'upcoming') return null;
        const groups: Record<string, AdminTask[]> = {};
        filteredTasks.forEach(t => {
            const dateKey = t.date || 'Fără dată';
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(t);
        });
        return groups;
    }, [filteredTasks, view]);

    // Sync local state when props tasks change
    useEffect(() => {
        let result = tasks.filter(t => {
            // Sidebar View Filter
            if (view === 'today') {
                if (t.date !== 'Azi' || t.status === 'archived') return false;
            } else if (view === 'upcoming') {
                if (t.date === 'Azi' || t.date === '' || t.status === 'archived') return false;
            } else if (view === 'inbox') {
                if (t.date !== '' || t.status === 'archived') return false;
            } else if (view === 'done') {
                if (t.status !== 'done') return false;
            } else if (view === 'archived') {
                if (t.status !== 'archived') return false;
            } else {
                // Project View
                if (t.projectId !== view || t.status === 'archived') return false;
            }
            
            if (tagFilter !== 'All' && (t.tag || 'General') !== tagFilter) return false;
            return true;
        });

        const priorityMap = { high: 3, medium: 2, low: 1 };
        
        result.sort((a, b) => {
            // Primary sort: status (pending first, done last)
            if (a.status !== b.status) {
                if (a.status === 'pending') return -1;
                if (b.status === 'pending') return 1;
                if (a.status === 'done' && b.status === 'archived') return -1;
                if (a.status === 'archived' && b.status === 'done') return 1;
            }

            // Secondary sort: user preference
            if (sortBy === 'priority') {
                const pA = priorityMap[a.priority] || 0;
                const pB = priorityMap[b.priority] || 0;
                if (pA !== pB) return pB - pA;
                return (a.order || 0) - (b.order || 0);
            } else {
                return (a.order || 0) - (b.order || 0);
            }
        });
        
        setFilteredTasks(result);
    }, [tasks, view, tagFilter, sortBy]);

    // Helper to find assignee object
    const getAssigneeObj = (id: string) => {
        if (id === 'none') return undefined;
        const found = assigneeOptions.find(a => a.id === id);
        return found ? { name: found.name, avatarUrl: found.avatarUrl } : undefined;
    };

    // --- ACTIONS ---

    const openAddModal = () => {
        setEditingTask(null);
        setFormTitle('');
        setFormDescription('');
        setFormPriority('medium');
        setFormTag('');
        setFormDate(new Date().toLocaleDateString('en-CA')); // Default to today ISO
        setFormAssigneeId('none');
        setFormProjectId(view.length > 10 ? view : 'none'); // If in project view, default to that project
        setIsModalOpen(true);
    };

    const openEditModal = (task: AdminTask) => {
        setEditingTask(task);
        setFormTitle(task.title);
        setFormDescription(task.description || '');
        setFormPriority(task.priority);
        setFormTag(task.tag || 'General');
        setFormDate(parseDateToIso(task.date || '')); // Parse friendly date to ISO for input
        
        // Find assignee ID based on name match
        const found = assigneeOptions.find(a => a.name === task.assignee?.name);
        setFormAssigneeId(found ? found.id : 'none');
        setFormProjectId(task.projectId || 'none');
        
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formTitle.trim()) return;

        const displayDate = formatIsoToDisplay(formDate);
        const assignee = getAssigneeObj(formAssigneeId);
        const hasAllInfo = !!assignee && !!formDate && !!formTag;
        let targetStatus: 'inbox' | 'pending' | 'done' | 'archived' = editingTask ? editingTask.status : 'inbox';
        
        // Auto-move logic: if it has assignee, date, and tag, it moves to pending.
        // If it's missing any of these, it stays in or moves back to inbox (unless it's done/archived)
        if (targetStatus === 'inbox' || targetStatus === 'pending') {
            targetStatus = hasAllInfo ? 'pending' : 'inbox';
        }

        const taskData = {
            title: formTitle,
            description: formDescription,
            priority: formPriority,
            tag: formTag,
            date: displayDate,
            assignee,
            status: targetStatus,
            projectId: formProjectId === 'none' ? undefined : formProjectId
        };

        if (editingTask) {
            // Update
            onUpdateTask({
                ...editingTask,
                ...taskData
            });
        } else {
            // Create
            // We need to handle projectId here. Since onAddTask doesn't have it, we'll use a trick or update signature.
            // For now, let's assume we can pass it if we update the signature or just use onUpdateTask after.
            // Actually, let's update the signature in the parent if needed, but for now I'll just call it and hope for the best or use a direct addTask if I had access.
            // Wait, onAddTask is passed from DesktopDashboard.
            onAddTask(
                taskData.title,
                taskData.priority,
                taskData.tag,
                taskData.assignee,
                taskData.description,
                taskData.status,
                taskData.projectId
            );
            // If it's a new task with a project, we might need a way to set the project.
            // I'll update the signature of onAddTask in the next turn if I can't do it now.
        }
        setIsModalOpen(false);
    };

    const openProjectModal = (project?: TaskProject) => {
        if (project) {
            setEditingProject(project);
            setProjectFormName(project.name);
            setProjectFormColor(project.color || '#3B82F6');
            setProjectFormIcon(project.icon || 'Folder');
        } else {
            setEditingProject(null);
            setProjectFormName('');
            setProjectFormColor('#3B82F6');
            setProjectFormIcon('Folder');
        }
        setIsProjectModalOpen(true);
    };

    const handleSaveProject = () => {
        if (!projectFormName.trim()) return;
        
        if (editingProject) {
            updateProject(editingProject.id, {
                name: projectFormName,
                color: projectFormColor,
                icon: projectFormIcon
            });
        } else {
            addProject({
                id: `p_${Date.now()}`,
                name: projectFormName,
                color: projectFormColor,
                icon: projectFormIcon
            });
        }
        
        setProjectFormName('');
        setIsProjectModalOpen(false);
    };

    // --- DRAG HANDLERS ---
    const handleDragStart = (e: React.DragEvent, id: string) => {
        if (sortBy === 'priority') return; // Disable dragging when sorted by priority
        setDraggedTaskId(id);
        e.dataTransfer.setData('taskId', id);
        e.dataTransfer.effectAllowed = "move";
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedTaskId(null);
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (sortBy === 'priority') return;
        
        if (draggedTaskId === targetId) {
             setDropTargetId(null);
             setDropPosition(null);
             return;
        }

        const el = e.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        const position = y < height / 2 ? 'before' : 'after';
        
        setDropTargetId(targetId);
        setDropPosition(position);
    };

    const handleDragLeave = () => {
        setDropTargetId(null);
        setDropPosition(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        setDropTargetId(null);
        setDropPosition(null);
        
        if (sortBy === 'priority') return;
        if (!draggedTaskId || draggedTaskId === targetId) return;

        const listWithoutSource = filteredTasks.filter(t => t.id !== draggedTaskId);
        const newTargetIndex = listWithoutSource.findIndex(t => t.id === targetId);
        
        if (newTargetIndex === -1) return;

        const movedItem = filteredTasks.find(t => t.id === draggedTaskId);
        if (!movedItem) return;

        let finalIndex = newTargetIndex;
        if (dropPosition === 'after') {
            finalIndex = newTargetIndex + 1;
        }
        
        const updatedList = [...listWithoutSource];
        updatedList.splice(finalIndex, 0, movedItem);
        
        setFilteredTasks(updatedList); 
        reorderTasks(updatedList);
    };

    const handleFolderDrop = (e: React.DragEvent, targetView: string) => {
        e.preventDefault();
        setDragOverFolderId(null);
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let updates: Partial<AdminTask> = {};

        if (targetView === 'today') {
            updates = { date: 'Azi' };
            if (task.status === 'archived') updates.status = 'inbox';
        } else if (targetView === 'upcoming') {
            updates = { date: 'Mâine' };
            if (task.status === 'archived') updates.status = 'inbox';
        } else if (targetView === 'inbox') {
            updates = { date: '', status: 'inbox' };
        } else if (targetView === 'done') {
            updates = { status: 'done' };
        } else if (targetView === 'archived') {
            updates = { status: 'archived' };
        } else {
            // It's a project ID
            updates = { projectId: targetView };
        }

        onUpdateTask({ ...task, ...updates });
    };

    const handleTagDrop = (e: React.DragEvent, tag: string) => {
        e.preventDefault();
        setDragOverFolderId(null);
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        if (!task || tag === 'All') return;

        onUpdateTask({ ...task, tag });
    };

    const stats = {
        inbox: tasks.filter(t => t.status === 'inbox').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        high: tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
        done: tasks.filter(t => t.status === 'done').length,
        archived: tasks.filter(t => t.status === 'archived').length
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            {/* Header & Stats - Single Row */}
            <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4 shrink-0">
                {/* Inbox Tasks */}
                <div className="bg-white dark:bg-gray-900 p-2 md:p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-2 overflow-hidden relative">
                    <div className="min-w-0 w-full z-10">
                        <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">INBOX</p>
                        <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-none">{stats.inbox}</p>
                    </div>
                    <div className="absolute right-1 bottom-1 md:static p-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg shrink-0 opacity-50 md:opacity-100">
                        <StickyNote size={12} className="md:hidden"/>
                        <StickyNote size={16} className="hidden md:block"/>
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white dark:bg-gray-900 p-2 md:p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-2 overflow-hidden relative">
                    <div className="min-w-0 w-full z-10">
                        <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">DE FĂCUT</p>
                        <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-none">{stats.pending}</p>
                    </div>
                    <div className="absolute right-1 bottom-1 md:static p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg shrink-0 opacity-50 md:opacity-100">
                        <ListTodo size={12} className="md:hidden"/>
                        <ListTodo size={16} className="hidden md:block"/>
                    </div>
                </div>

                {/* High Priority */}
                <div className="bg-white dark:bg-gray-900 p-2 md:p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-2 overflow-hidden relative">
                    <div className="min-w-0 w-full z-10">
                        <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">URGENTE</p>
                        <p className="text-lg md:text-xl font-black text-red-600 leading-none">{stats.high}</p>
                    </div>
                    <div className="absolute right-1 bottom-1 md:static p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg shrink-0 opacity-50 md:opacity-100">
                        <AlertCircle size={12} className="md:hidden"/>
                        <AlertCircle size={16} className="hidden md:block"/>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white dark:bg-gray-900 p-2 md:p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-2 overflow-hidden relative">
                    <div className="min-w-0 w-full z-10">
                        <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 truncate">GATA AZI</p>
                        <p className="text-lg md:text-xl font-black text-green-600 leading-none">{stats.done}</p>
                    </div>
                    <div className="absolute right-1 bottom-1 md:static p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg shrink-0 opacity-50 md:opacity-100">
                        <CheckCircle size={12} className="md:hidden"/>
                        <CheckCircle size={16} className="hidden md:block"/>
                    </div>
                </div>
            </div>

            {/* Department Filter Bar */}
            <div className="flex items-center gap-4 mb-4 shrink-0">
                <div className="p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-1">
                    <div className="px-2 py-1.5 text-gray-400">
                        <Filter size={16} />
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-200px)]">
                        {tags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setTagFilter(tag)}
                                onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(`tag-${tag}`); }}
                                onDragLeave={() => setDragOverFolderId(null)}
                                onDrop={(e) => handleTagDrop(e, tag)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    tagFilter === tag 
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                                    : dragOverFolderId === `tag-${tag}` ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex">
                {/* Sidebar */}
                <div className="w-56 border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0">
                    <div className="p-3 space-y-0.5">
                        <button 
                            onClick={() => setView('today')}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('today'); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => handleFolderDrop(e, 'today')}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'today' ? 'bg-blue-50 text-blue-600' : dragOverFolderId === 'today' ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Calendar size={16} />
                                <span>Azi</span>
                            </div>
                            <span className="text-[10px] opacity-50">{tasks.filter(t => t.date === 'Azi' && t.status !== 'archived').length}</span>
                        </button>
                        <button 
                            onClick={() => setView('upcoming')}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('upcoming'); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => handleFolderDrop(e, 'upcoming')}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'upcoming' ? 'bg-blue-50 text-blue-600' : dragOverFolderId === 'upcoming' ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <CalendarDays size={16} />
                                <span>În continuare</span>
                            </div>
                            <span className="text-[10px] opacity-50">{tasks.filter(t => t.date !== 'Azi' && t.date !== '' && t.status !== 'archived').length}</span>
                        </button>
                        <button 
                            onClick={() => setView('inbox')}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('inbox'); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => handleFolderDrop(e, 'inbox')}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'inbox' ? 'bg-blue-50 text-blue-600' : dragOverFolderId === 'inbox' ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <StickyNote size={16} />
                                <span>Inbox</span>
                            </div>
                            <span className="text-[10px] opacity-50">{tasks.filter(t => t.date === '' && t.status !== 'archived').length}</span>
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1.5" />
                        <button 
                            onClick={() => setView('done')}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('done'); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => handleFolderDrop(e, 'done')}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'done' ? 'bg-blue-50 text-blue-600' : dragOverFolderId === 'done' ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <CheckCircle size={16} />
                                <span>Finalizate</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setView('archived')}
                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('archived'); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={(e) => handleFolderDrop(e, 'archived')}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${view === 'archived' ? 'bg-blue-50 text-blue-600' : dragOverFolderId === 'archived' ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-2.5">
                                <Archive size={16} />
                                <span>Arhivate</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 pt-0">
                        <div className="flex items-center justify-between mb-1.5 px-2.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Proiecte</span>
                            <button onClick={() => openProjectModal()} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                <FolderPlus size={12} />
                            </button>
                        </div>
                        <div className="space-y-0.5">
                            {projects.map(project => {
                                const IconComponent = projectIcons.find(i => i.name === project.icon)?.icon || Folder;
                                return (
                                    <div key={project.id} className="group relative">
                                        <button 
                                            onClick={() => setView(project.id)}
                                            onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(project.id); }}
                                            onDragLeave={() => setDragOverFolderId(null)}
                                            onDrop={(e) => handleFolderDrop(e, project.id)}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${view === project.id ? 'bg-blue-50 text-blue-600' : dragOverFolderId === project.id ? 'bg-blue-100/50 text-blue-700 scale-105' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                                                <IconComponent size={12} className="opacity-50" />
                                                <span className="truncate">{project.name}</span>
                                            </div>
                                            <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity pr-5">
                                                {tasks.filter(t => t.projectId === project.id && t.status !== 'archived').length}
                                            </span>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openProjectModal(project); }}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {view === 'today' ? 'Azi' : view === 'upcoming' ? 'În continuare' : view === 'inbox' ? 'Inbox' : view === 'done' ? 'Finalizate' : view === 'archived' ? 'Arhivate' : projects.find(p => p.id === view)?.name || 'Proiect'}
                            </h3>
                            <div className="h-3 w-px bg-gray-200" />
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setSortBy(sortBy === 'default' ? 'priority' : 'default')}
                                    className={`px-2.5 py-1 border rounded-lg text-[9px] font-bold uppercase flex items-center gap-1.5 transition-all ${sortBy === 'priority' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}
                                >
                                    <ArrowUpDown size={10} />
                                    {sortBy === 'priority' ? 'Prioritate' : 'Manual'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                        {view === 'upcoming' && groupedUpcomingTasks ? (
                            Object.entries(groupedUpcomingTasks)
                                .sort(([dateA], [dateB]) => {
                                    const isoA = parseDateToIso(dateA);
                                    const isoB = parseDateToIso(dateB);
                                    return isoA.localeCompare(isoB);
                                })
                                .map(([date, groupTasks]) => (
                                <div key={date} className="space-y-2">
                                    <div className="flex items-center gap-2 py-1">
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">{date}</span>
                                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                    {(groupTasks as AdminTask[]).map(task => (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            key={task.id}
                                            draggable={sortBy === 'default'}
                                            onDragStart={(e) => handleDragStart(e as any, task.id)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => handleDragOver(e as any, task.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e as any, task.id)}
                                            onClick={() => openEditModal(task)}
                                            className={`group flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer relative ${
                                                task.status === 'done' 
                                                ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-60' 
                                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md'
                                            } ${draggedTaskId === task.id ? 'opacity-50 bg-blue-50 border-blue-200' : ''}`}
                                        >
                                            {dropTargetId === task.id && dropPosition === 'before' && (
                                                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full pointer-events-none" />
                                            )}
                                            {dropTargetId === task.id && dropPosition === 'after' && (
                                                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full pointer-events-none" />
                                            )}
                                            {/* Drag Handle & Checkbox */}
                                            <div className="flex items-center gap-2.5 self-stretch md:self-center">
                                                <div className={`text-gray-300 md:flex hidden ${sortBy === 'priority' ? 'opacity-30 cursor-not-allowed' : 'group-hover:text-gray-400 cursor-grab active:cursor-grabbing'}`}>
                                                    <GripVertical size={14} />
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                                        task.status === 'done' 
                                                        ? 'bg-green-500 border-green-500 text-white' 
                                                        : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500'
                                                    }`}
                                                >
                                                    <Check size={12} />
                                                </button>
                                            </div>

                                            <div className="flex-1 min-w-0 select-none w-full">
                                                <p className={`font-medium text-sm truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                    {task.title}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                                                        task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                        task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : 
                                                        'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[9px] text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100">
                                                        <Tag size={9}/> {task.tag || 'General'}
                                                    </span>
                                                    {task.projectId && (
                                                        <span className="flex items-center gap-1 text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                            <Folder size={9}/> {projects.find(p => p.id === task.projectId)?.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center">
                                                {task.status !== 'archived' ? (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, status: 'archived' }); }} 
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Arhivează"
                                                    >
                                                        <Archive size={14}/>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, status: 'inbox' }); }} 
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Restaurează"
                                                    >
                                                        <RotateCcw size={14}/>
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(task); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                </div>
                            ))
                        ) : (
                            filteredTasks.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                            {filteredTasks.map((task) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                key={task.id}
                                draggable={sortBy === 'default'}
                                onDragStart={(e) => handleDragStart(e as any, task.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e as any, task.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e as any, task.id)}
                                onClick={() => openEditModal(task)}
                                className={`group flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer relative ${
                                    task.status === 'done' 
                                    ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-60' 
                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md'
                                } ${draggedTaskId === task.id ? 'opacity-50 bg-blue-50 border-blue-200' : ''}`}
                            >
                                {dropTargetId === task.id && dropPosition === 'before' && (
                                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full pointer-events-none" />
                                )}
                                {dropTargetId === task.id && dropPosition === 'after' && (
                                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10 rounded-full pointer-events-none" />
                                )}
                                {/* Drag Handle & Checkbox */}
                                <div className="flex items-center gap-2.5 self-stretch md:self-center">
                                    <div className={`text-gray-300 md:flex hidden ${sortBy === 'priority' ? 'opacity-30 cursor-not-allowed' : 'group-hover:text-gray-400 cursor-grab active:cursor-grabbing'}`}>
                                        <GripVertical size={14} />
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                            task.status === 'done' 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500'
                                        }`}
                                    >
                                        <Check size={12} />
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0 select-none w-full">
                                    <p className={`font-medium text-sm truncate ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                                            task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : 
                                            'bg-gray-100 text-gray-500 border border-gray-200'
                                        }`}>
                                            {task.priority}
                                        </span>
                                        <span className="flex items-center gap-1 text-[9px] text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100">
                                            <Tag size={9}/> {task.tag || 'General'}
                                        </span>
                                        {task.date && (
                                            <span className={`flex items-center gap-1 text-[9px] font-medium bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border ${
                                                (() => {
                                                    const iso = parseDateToIso(task.date);
                                                    if (!iso) return 'text-gray-400 border-gray-100';
                                                    const d = new Date(iso);
                                                    const now = new Date();
                                                    now.setHours(0,0,0,0);
                                                    if (d < now && task.status !== 'done' && task.status !== 'archived') {
                                                        return 'text-red-600 border-red-100 bg-red-50';
                                                    }
                                                    return 'text-gray-400 border-gray-100';
                                                })()
                                            }`}>
                                                <Calendar size={9}/> 
                                                {task.date}
                                            </span>
                                        )}
                                        {task.projectId && (
                                            <span className="flex items-center gap-1 text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                <Folder size={9}/> {projects.find(p => p.id === task.projectId)?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center">
                                    {task.status !== 'archived' ? (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, status: 'archived' }); }} 
                                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Arhivează"
                                        >
                                            <Archive size={14}/>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, status: 'inbox' }); }} 
                                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Restaurează"
                                        >
                                            <RotateCcw size={14}/>
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(task); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                </div>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                <ListTodo size={40} className="mb-3 opacity-20"/>
                                <p className="text-xs">Nu există taskuri care să corespundă filtrelor.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>

            {/* Floating Action Button for Adding Tasks */}
            <button
                onClick={openAddModal}
                className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-[#FACC15] hover:bg-[#EAB308] text-gray-900 rounded-full shadow-xl shadow-yellow-400/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50"
                title="Adaugă Task"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            {/* UNIFIED ADD/EDIT MODAL */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingTask ? "Editează Task" : "Task Nou"}
            >
                <div className="space-y-6">
                    {/* 1. Title Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Titlu Task</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Ex: Sună lead-uri, Plătește chirie..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all"
                                autoFocus
                            />
                            <AlignLeft size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        </div>
                    </div>

                    {/* 2. Details / Notes */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Detalii / Notițe</label>
                        <div className="relative">
                            <textarea 
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="Adaugă detalii suplimentare..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none transition-all resize-none h-24"
                            />
                            <StickyNote size={18} className="absolute left-3 top-4 text-gray-400"/>
                        </div>
                    </div>

                    {/* 3. Priority & Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Deadline</label>
                            <div className="relative">
                                <input 
                                    type="date"
                                    value={formDate} // Always ISO YYYY-MM-DD
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                                />
                                <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Proiect</label>
                            <div className="relative">
                                <select 
                                    value={formProjectId}
                                    onChange={(e) => setFormProjectId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500 appearance-none"
                                >
                                    <option value="none">Niciunul</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <Folder size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                                <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90"/>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Departament</label>
                        <select 
                            value={formTag}
                            onChange={(e) => setFormTag(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                        >
                            <option value="" disabled>Selectează...</option>
                            {tags.filter(t => t !== 'All').map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* 4. Priority Selector (Visual) */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Prioritate</label>
                        <div className="flex gap-2">
                            {priorities.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setFormPriority(p.id as any)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                        formPriority === p.id 
                                        ? `${p.color.replace('bg-', 'border-').split(' ')[2]} ${p.color.split(' ')[0]} ring-1 ring-offset-1` 
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. Assignee Picker (Visual Grid) */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Asignează Către</label>
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                            <button
                                onClick={() => setFormAssigneeId('none')}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${formAssigneeId === 'none' ? 'border-gray-400 bg-gray-100' : 'border-gray-100 hover:bg-gray-50'}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                                    <User size={16} className="text-gray-400"/>
                                </div>
                                <span className="text-[9px] font-bold text-gray-500">Neasignat</span>
                            </button>
                            
                            {assigneeOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setFormAssigneeId(opt.id)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                                        formAssigneeId === opt.id 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <img src={opt.avatarUrl} className="w-8 h-8 rounded-full object-cover mb-1 border border-gray-200" alt={opt.name} />
                                    <span className="text-[9px] font-bold text-gray-700 truncate w-full text-center">{opt.name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                        {editingTask && (
                            editingTask.status !== 'archived' ? (
                                <Button 
                                    variant="secondary" 
                                    onClick={() => { 
                                        onUpdateTask({ ...editingTask, status: 'archived' }); 
                                        setIsModalOpen(false); 
                                    }}
                                    className="text-purple-600 hover:bg-purple-50 border-purple-100"
                                >
                                    <Archive size={16} className="mr-2" /> Arhivează
                                </Button>
                            ) : (
                                <Button 
                                    variant="secondary" 
                                    onClick={() => { 
                                        onUpdateTask({ ...editingTask, status: 'inbox' }); 
                                        setIsModalOpen(false); 
                                    }}
                                    className="text-green-600 hover:bg-green-50 border-green-100"
                                >
                                    <RotateCcw size={16} className="mr-2" /> Restaurează
                                </Button>
                            )
                        )}
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Anulează</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {editingTask ? 'Salvează Modificările' : 'Creează Task'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Project Modal */}
            <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title={editingProject ? "Editează Proiect" : "Proiect Nou"}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Nume Proiect</label>
                        <Input 
                            value={projectFormName}
                            onChange={(e) => setProjectFormName(e.target.value)}
                            placeholder="Ex: Festival Ginga 2024"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Simbol (Iconiță)</label>
                        <div className="grid grid-cols-5 gap-2">
                            {projectIcons.map(item => (
                                <button 
                                    key={item.name}
                                    onClick={() => setProjectFormIcon(item.name)}
                                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center ${projectFormIcon === item.name ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <item.icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Culoare</label>
                        <div className="flex gap-2">
                            {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#000000'].map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setProjectFormColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${projectFormColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsProjectModalOpen(false)}>Anulează</Button>
                        <Button onClick={handleSaveProject} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {editingProject ? "Salvează Modificările" : "Creează Proiect"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
