import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../components/UIComponents';
import { useData } from '../../../contexts/DataContext';
import { DanceStyle, SkillLevel, GroupDetailedProfile } from '../../../types';

interface AddGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddGroupModal: React.FC<AddGroupModalProps> = ({ isOpen, onClose }) => {
    const { addGroup } = useData();
    const [formData, setFormData] = useState({
        name: '',
        style: DanceStyle.BACHATA,
        level: SkillLevel.BEGINNER,
        schedule: '',
        location: '',
        startDate: new Date().toISOString().split('T')[0],
        instructorIds: [] as string[],
        capacity: 30
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newGroup: GroupDetailedProfile = {
            id: `grp-${Date.now()}`,
            ...formData,
            enrolledCount: 0,
            status: 'active',
            instructors: [], // Initialize with empty instructors
            stats: {
                enrolledCount: 0,
                maxCapacity: formData.capacity,
                averageAttendance: 0,
                consecutiveAbsencesCount: 0,
                engagementScore: 0,
                energyLevel: 'Medium',
                trend: 'stable'
            },
            risk: {
                level: 'low'
            },
            students: [],
            energyHistory: [],
            attendanceHistory: [],
            aiInsights: [],
            feedbackSummary: {
                rating: 0,
                topIssues: [],
                sentiment: 'neutral'
            },
            createdAt: new Date().toISOString(),
            schedule: {
                day: 'Luni', // Default, should parse from schedule string or add specific fields
                time: '19:30',
                room: 'Mille',
                duration: '60'
            }
        };
        
        addGroup(newGroup);
        onClose();
        
        // Reset form
        setFormData({
            name: '',
            style: DanceStyle.BACHATA,
            level: SkillLevel.BEGINNER,
            schedule: '',
            location: '',
            startDate: new Date().toISOString().split('T')[0],
            instructorIds: [],
            capacity: 30
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Grupă Nouă">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                    label="Nume Grupă" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="ex: Bachata Start"
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Stil de Dans</label>
                        <select 
                            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none"
                            value={formData.style}
                            onChange={(e) => setFormData({...formData, style: e.target.value as DanceStyle})}
                        >
                            {Object.values(DanceStyle).map(style => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nivel</label>
                        <select 
                            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none"
                            value={formData.level}
                            onChange={(e) => setFormData({...formData, level: e.target.value as SkillLevel})}
                        >
                            {Object.values(SkillLevel).map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Program (ex: Luni 19:30)" 
                        value={formData.schedule}
                        onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                        required
                    />
                    <Input 
                        label="Locație" 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Data Începerii" 
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        required
                    />
                    <Input 
                        label="Capacitate" 
                        type="number"
                        value={formData.capacity.toString()}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        required
                        min="1"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} type="button">Anulează</Button>
                    <Button type="submit">Salvează Grupa</Button>
                </div>
            </form>
        </Modal>
    );
};
