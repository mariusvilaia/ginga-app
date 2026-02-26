import React, { useState, useMemo } from 'react';
import { Search, UserCheck, Calendar, Info, Plus } from 'lucide-react';
import { Modal, Button } from '../../../components/UIComponents';
import { StudentDetailedProfile } from '../../../types';
import { normalizeText, smartSearch } from '../../../utils/searchUtils';

interface AddVisitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddVisitor: (studentId: string, date: string) => void;
    initialDate: string;
    existingStudents: StudentDetailedProfile[];
    currentClassTitle?: string;
}

export const AddVisitorModal: React.FC<AddVisitorModalProps> = ({
    isOpen,
    onClose,
    onAddVisitor,
    initialDate,
    existingStudents,
    currentClassTitle
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(initialDate);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        const lower = normalizeText(searchTerm);
        return existingStudents.filter(s => 
            smartSearch(searchTerm, s.name) ||
            normalizeText(s.email).includes(lower) ||
            s.phone.includes(lower)
        ).slice(0, 5);
    }, [searchTerm, existingStudents]);

    const handleAdd = (studentId: string) => {
        onAddVisitor(studentId, selectedDate);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adaugă Vizitator">
            <div className="space-y-6">
                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                    <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        <span className="font-bold">Info:</span> Această acțiune va adăuga o prezență în istoricul cursantului și îl va afișa în lista de mai sus.
                    </p>
                </div>

                {/* Date Picker */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">DATA PREZENȚEI</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                        />
                    </div>
                </div>

                {/* Search Student */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">CAUTĂ CURSANT</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Caută după nume, telefon sau email..." 
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <img src={student.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover" alt={student.name} />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${student.subscription.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {student.subscription.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={() => handleAdd(student.id)} 
                                    className="!w-auto h-9 px-4 text-xs gap-1"
                                >
                                    <UserCheck size={14} /> Adaugă
                                </Button>
                            </div>
                        ))
                    ) : searchTerm ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-xs">Niciun rezultat găsit.</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <Search size={32} className="mx-auto mb-2 opacity-20"/>
                            <p className="text-xs">Începe să scrii pentru a căuta.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
