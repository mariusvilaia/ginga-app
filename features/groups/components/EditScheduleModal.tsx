
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Type, BarChart, PlayCircle, Users, Check, Trash2 } from 'lucide-react';
import { Modal, Button, Input } from '../../../components/UIComponents';
import { GroupDetailedProfile, SkillLevel, InstructorInfo } from '../../../types';
import { useData } from '../../../contexts/DataContext';

interface EditScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { day: string; time: string; room: string; duration: string; name: string; level: SkillLevel; startDate: string; instructors: InstructorInfo[]; effectiveDate: string }) => void;
    onDelete: () => void;
    initialSchedule: GroupDetailedProfile['schedule'];
    initialName: string;
    initialLevel: SkillLevel;
    initialStartDate?: string;
    initialInstructors: InstructorInfo[];
}

const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
const ROOMS = ['Mille 18', 'Victoriei Ballroom', 'Sala 3'];

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onDelete,
    initialSchedule, 
    initialName, 
    initialLevel, 
    initialStartDate,
    initialInstructors 
}) => {
    const { instructors: allInstructors } = useData();
    const [day, setDay] = useState(initialSchedule.day);
    const [time, setTime] = useState(initialSchedule.time);
    const [room, setRoom] = useState(initialSchedule.room);
    const [duration, setDuration] = useState(initialSchedule.duration);
    const [name, setName] = useState(initialName);
    const [level, setLevel] = useState(initialLevel);
    const [startDate, setStartDate] = useState(initialStartDate || '');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Manage selected instructor IDs
    const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>(
        initialInstructors.map(i => i.id || '')
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

        onSave({ 
            day, 
            time, 
            room, 
            duration, 
            name, 
            level, 
            startDate,
            instructors: selectedInstructorsObjects,
            effectiveDate
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Modifică Detalii Grupă">
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>Atenție:</strong> Modificarea numelui sau orarului va actualiza automat:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Programul afișat al instructorilor</li>
                        <li>Viitoarele clase de check-in</li>
                        <li>Denumirea grupei în conturile studenților</li>
                    </ul>
                </div>

                {/* Name & Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nume Grupă</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white dark:bg-gray-800 outline-none font-bold text-sm focus:border-blue-500 text-gray-900 dark:text-white"
                            />
                            <Type size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nivel</label>
                        <div className="relative">
                            <select 
                                value={level}
                                onChange={(e) => setLevel(e.target.value as SkillLevel)}
                                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white dark:bg-gray-800 outline-none appearance-none font-bold text-sm focus:border-blue-500 text-gray-900 dark:text-white"
                            >
                                {Object.values(SkillLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                            </select>
                            <BarChart size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                </div>

                {/* Start Date Field */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Data Începerii Cursului</label>
                    <div className="relative">
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white dark:bg-gray-800 outline-none font-bold text-sm focus:border-blue-500 text-gray-900 dark:text-white"
                        />
                        <PlayCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Util pentru a calcula în ce săptămână a modulului se află grupa.</p>
                </div>

                <hr className="border-gray-100 dark:border-gray-800"/>

                {/* Instructors Selection */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                        <Users size={14}/> Instructori ({selectedInstructorIds.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1">
                        {allInstructors.map(inst => {
                            const isSelected = selectedInstructorIds.includes(inst.id);
                            return (
                                <div 
                                    key={inst.id}
                                    onClick={() => toggleInstructor(inst.id)}
                                    className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${
                                        isSelected 
                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                        : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-200'
                                    }`}
                                >
                                    <img src={inst.avatarUrl} alt={inst.name} className="w-8 h-8 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {inst.name}
                                        </p>
                                    </div>
                                    {isSelected && <Check size={14} className="text-blue-600"/>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <hr className="border-gray-100 dark:border-gray-800"/>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ziua Săptămânii</label>
                        <div className="relative">
                            <select 
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white dark:bg-gray-800 outline-none appearance-none font-bold text-sm focus:border-blue-500 text-gray-900 dark:text-white"
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ora Începerii</label>
                        <div className="relative">
                            <input 
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-white dark:bg-gray-800 outline-none font-bold text-sm focus:border-blue-500 text-gray-900 dark:text-white"
                            />
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Locație (Sală)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {ROOMS.map(r => (
                            <button
                                key={r}
                                onClick={() => setRoom(r)}
                                className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all ${
                                    room === r 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <Input 
                    label="Durată (text)" 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                    placeholder="Ex: 60 min"
                />

                <hr className="border-gray-100 dark:border-gray-800"/>

                {/* Effective Date Workflow */}
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <label className="block text-xs font-bold uppercase text-blue-700 dark:text-blue-300 mb-2">Dată de început (Effective Date)</label>
                    <div className="relative">
                        <input 
                            type="date"
                            value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-blue-100 dark:border-blue-900/50 bg-white dark:bg-gray-800 outline-none font-bold text-sm focus:border-blue-500 text-gray-900 dark:text-white"
                        />
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none"/>
                    </div>
                    <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-2 leading-relaxed">
                        Modificările se vor aplica doar claselor programate <strong>după</strong> această dată. Istoricul prezențelor și rapoartele anterioare vor rămâne intacte.
                    </p>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={onDelete}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={16} /> Șterge Grupa
                    </button>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>Anulează</Button>
                        <Button onClick={handleSubmit} className="bg-gray-900 text-white hover:bg-black">Salvează Modificările</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
