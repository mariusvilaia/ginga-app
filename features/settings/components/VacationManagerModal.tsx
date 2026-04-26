import React, { useState } from 'react';
import { Modal, Button } from '../../../components/UIComponents';
import { useData } from '../../../contexts/DataContext';
import { Trash2, Plus, Calendar } from 'lucide-react';
import { VacationPeriod } from '../../../types';

interface VacationManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VacationManagerModal: React.FC<VacationManagerModalProps> = ({ isOpen, onClose }) => {
    const { vacationPeriods, addVacationPeriod, deleteVacationPeriod } = useData();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [name, setName] = useState('');

    const handleAdd = async () => {
        if (!startDate || !endDate || !name) return;
        
        const newPeriod: VacationPeriod = {
            id: `vac_${Date.now()}`,
            startDate,
            endDate,
            name
        };
        
        await addVacationPeriod(newPeriod);
        setStartDate('');
        setEndDate('');
        setName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionare Perioade Vacanță">
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Plus size={16} className="text-blue-500"/> Adaugă Perioadă Nouă
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nume Vacanță</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Vacanța de Iarnă"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">De la</label>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Până la</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAdd} disabled={!startDate || !endDate || !name} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Adaugă Perioadă
                        </Button>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400"/> Perioade Existente
                    </h4>
                    {vacationPeriods && vacationPeriods.length > 0 ? (
                        vacationPeriods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(period => (
                            <div key={period.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                                <div>
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{period.name}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                                        {new Date(period.startDate).toLocaleDateString('ro-RO')} - {new Date(period.endDate).toLocaleDateString('ro-RO')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => deleteVacationPeriod(period.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Șterge"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic text-center py-4">Nu există perioade de vacanță definite.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};
