import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Type, BarChart, PlayCircle, Users, Check, Trash2 } from 'lucide-react';
import { Modal, Button, Input } from '../../../components/UIComponents';
import { ScheduleVersion, InstructorInfo } from '../../../types';
import { useData } from '../../../contexts/DataContext';

interface EditScheduleVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (versionId: string, data: Partial<ScheduleVersion>) => void;
    version: ScheduleVersion;
}

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
const ROOMS = ['Mille 18', 'Victoriei Ballroom', 'Sala 3'];

export const EditScheduleVersionModal: React.FC<EditScheduleVersionModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    version
}) => {
    const { instructors: allInstructors } = useData();
    const [day, setDay] = useState(version.schedule.day);
    const [time, setTime] = useState(version.schedule.time);
    const [room, setRoom] = useState(version.schedule.room);
    const [duration, setDuration] = useState(version.schedule.duration);
    const [startDate, setStartDate] = useState(version.startDate || '');
    const [endDate, setEndDate] = useState(version.endDate || '');
    
    // Manage selected instructor IDs
    const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>(
        (version.instructors || []).map(i => i.id || '')
    );

    const toggleInstructor = (id: string) => {
        setSelectedInstructorIds(prev => 
            prev.includes(id) 
            ? prev.filter(p => p !== id) 
            : [...prev, id]
        );
    };

    const handleSubmit = () => {
        // Map selected IDs back to InstructorInfo objects
        const selectedInstructorsObjects = allInstructors
            .filter(i => selectedInstructorIds.includes(i.id))
            .map(i => ({
                id: i.id,
                name: i.name,
                avatarUrl: i.avatarUrl
            }));

        const updates: Partial<ScheduleVersion> = { 
            startDate,
            schedule: { day, time, room, duration },
            instructors: selectedInstructorsObjects
        };
        
        if (endDate) {
            updates.endDate = endDate;
        } else {
            updates.endDate = null as any; // Use null to clear it in Firestore array
        }

        onSave(version.id, updates);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Modifică Versiune Orar">
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>Atenție:</strong> Modificarea acestei versiuni va actualiza automat detaliile claselor (prezențelor) asociate cu această versiune.
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Data Început</label>
                        <Input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Data Sfârșit (Opțional)</label>
                        <Input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ziua</label>
                        <div className="relative">
                            <select 
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all appearance-none pl-10"
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <Calendar size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ora</label>
                        <div className="relative">
                            <input 
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all pl-10"
                            />
                            <Clock size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Sala</label>
                        <div className="relative">
                            <select 
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all appearance-none pl-10"
                            >
                                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <MapPin size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Durată</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all pl-10"
                            />
                            <Clock size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Instructors */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Instructori</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allInstructors.map(inst => {
                            const isSelected = selectedInstructorIds.includes(inst.id);
                            return (
                                <div 
                                    key={inst.id}
                                    onClick={() => toggleInstructor(inst.id)}
                                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                                        isSelected 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    }`}
                                >
                                    <img src={inst.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt={inst.name} />
                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {inst.name.split(' ')[0]}
                                    </span>
                                    {isSelected && <Check size={12} className="ml-auto text-blue-600" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="secondary" onClick={onClose} className="!w-auto px-6">Anulează</Button>
                    <Button onClick={handleSubmit} className="!w-auto px-8">Salvează Versiunea</Button>
                </div>
            </div>
        </Modal>
    );
};
