
import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { Modal, Button, Input } from '../../components/UIComponents';
import { MOCK_INSTRUCTORS_DATA } from '../../constants';
import { InstructorUnavailability } from '../../types';

interface AddUnavailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<InstructorUnavailability, 'id'>) => void;
}

export const AddUnavailabilityModal: React.FC<AddUnavailabilityModalProps> = ({ isOpen, onClose, onSave }) => {
    const [instructorId, setInstructorId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const handleSave = () => {
        if (!instructorId || !startDate || !endDate || !reason) return;
        onSave({
            instructorId,
            startDate,
            endDate,
            reason
        });
        onClose();
        // Reset form
        setInstructorId('');
        setStartDate('');
        setEndDate('');
        setReason('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adaugă Indisponibilitate">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Instructor</label>
                    <select 
                        value={instructorId}
                        onChange={(e) => setInstructorId(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    >
                        <option value="">Selectează...</option>
                        {MOCK_INSTRUCTORS_DATA.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">De la</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Până la</label>
                        <input 
                            type="date" 
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <Input label="Motiv (Ex: Concediu, Medical)" value={reason} onChange={(e) => setReason(e.target.value)} />

                <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>Anulează</Button>
                    <Button onClick={handleSave}>Salvează</Button>
                </div>
            </div>
        </Modal>
    );
};
