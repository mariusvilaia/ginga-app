
import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../../../components/UIComponents';
import { AdminTask } from '../../../types';
import { useData } from '../../../contexts/DataContext';
import { Folder, Sparkles, Megaphone, Home, Music, Heart, Star, Zap, Target, MessageSquare } from 'lucide-react';

interface TaskEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: AdminTask | null; // If null, we are adding a new task
    onSave: (taskData: any) => void;
    initialTitle?: string;
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

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose, task, onSave, initialTitle = '' }) => {
    const { students, instructors, projects } = useData();

    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriority, setFormPriority] = useState<'high'|'medium'|'low'>('medium');
    const [formTag, setFormTag] = useState('');
    const [formDate, setFormDate] = useState('');
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
    const assigneeOptions = [
        ...staffMembers,
        ...instructors.map(i => ({ id: i.id, name: i.name, avatarUrl: i.avatarUrl }))
    ].filter(p => p.name && !['Ana', 'Dan'].includes(p.name) && !p.name.startsWith('Ana ') && !p.name.startsWith('Dan '));

    const tags = ['Sales', 'Finance', 'Marketing', 'Admin', 'Events', 'PR', 'HR', 'Festivals'];
    const priorities = [
        { id: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600 border-gray-200' },
        { id: 'medium', label: 'Medium', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
        { id: 'high', label: 'High', color: 'bg-red-50 text-red-600 border-red-200' }
    ];

    useEffect(() => {
        if (isOpen) {
            if (task) {
                setFormTitle(task.title);
                setFormDescription(task.description || '');
                setFormPriority(task.priority);
                setFormTag(task.tag || 'General');
                setFormDate(parseDateToIso(task.date || ''));
                
                const found = assigneeOptions.find(a => a.name === task.assignee?.name);
                setFormAssigneeId(found ? found.id : 'none');
                setFormProjectId(task.projectId || 'none');
            } else {
                setFormTitle(initialTitle);
                setFormDescription('');
                setFormPriority('medium');
                setFormTag('');
                setFormDate(new Date().toLocaleDateString('en-CA'));
                setFormAssigneeId('none');
                setFormProjectId('none');
            }
        }
    }, [isOpen, task, initialTitle]);

    const handleSave = () => {
        if (!formTitle.trim()) return;

        const displayDate = formatIsoToDisplay(formDate);
        
        // Find assignee object
        let assignee = undefined;
        if (formAssigneeId !== 'none') {
            const found = assigneeOptions.find(a => a.id === formAssigneeId);
            if (found) assignee = { name: found.name, avatarUrl: found.avatarUrl };
        }

        const taskData = {
            title: formTitle,
            description: formDescription,
            priority: formPriority,
            tag: formTag,
            date: displayDate,
            assignee,
            projectId: formProjectId === 'none' ? undefined : formProjectId
        };

        onSave(taskData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Editează Task" : "Task Nou"}>
            <div className="space-y-4">
                <Input 
                    label="Titlu Task" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ce trebuie făcut?"
                    autoFocus
                />
                
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descriere</label>
                    <textarea 
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 outline-none min-h-[100px] text-sm"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Detalii suplimentare..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prioritate</label>
                        <div className="flex gap-2">
                            {priorities.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setFormPriority(p.id as any)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                                        formPriority === p.id 
                                        ? p.color.replace('bg-', 'bg-opacity-100 ').replace('text-', 'text-opacity-100 ') + ' ring-2 ring-offset-1 ring-gray-200'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Departament / Tag</label>
                        <select 
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 outline-none text-sm font-bold bg-white"
                            value={formTag}
                            onChange={(e) => setFormTag(e.target.value)}
                        >
                            <option value="">General</option>
                            {tags.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Data Limită" 
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                    />
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Responsabil</label>
                        <select 
                            className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 outline-none text-sm font-bold bg-white"
                            value={formAssigneeId}
                            onChange={(e) => setFormAssigneeId(e.target.value)}
                        >
                            <option value="none">Nimeni</option>
                            {assigneeOptions.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Proiect</label>
                    <select 
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none text-sm font-bold bg-white"
                        value={formProjectId}
                        onChange={(e) => setFormProjectId(e.target.value)}
                    >
                        <option value="none">Niciun Proiect</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose}>Anulează</Button>
                    <Button onClick={handleSave}>Salvează Task</Button>
                </div>
            </div>
        </Modal>
    );
};
