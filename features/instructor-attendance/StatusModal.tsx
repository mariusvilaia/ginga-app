
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, UserX, AlertCircle, RefreshCw, Trash2, MapPin, Clock } from 'lucide-react';
import { Modal, Button } from '../../components/UIComponents';
import { InstructorAttendanceRecord, AttendanceStatusType } from '../../types';
import { MOCK_INSTRUCTORS_DATA } from '../../constants';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: InstructorAttendanceRecord[]; 
    dateLabel: string;
    onSave: (updatedRecords: InstructorAttendanceRecord[]) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, records, dateLabel, onSave }) => {
    const [localRecords, setLocalRecords] = useState<InstructorAttendanceRecord[]>([]);

    useEffect(() => {
        if (isOpen) {
            setLocalRecords(JSON.parse(JSON.stringify(records))); 
        }
    }, [isOpen, records]);

    const handleStatusChange = (recordId: string, newStatus: AttendanceStatusType) => {
        setLocalRecords(prev => prev.map(rec => {
            if (rec.id === recordId) {
                return { 
                    ...rec, 
                    status: newStatus,
                    actualInstructorId: newStatus === 'substitute' ? '' : undefined 
                };
            }
            return rec;
        }));
    };

    const handleSubstituteChange = (recordId: string, subId: string) => {
        setLocalRecords(prev => prev.map(rec => {
            if (rec.id === recordId) {
                return { ...rec, actualInstructorId: subId };
            }
            return rec;
        }));
    };

    const handleSave = () => {
        onSave(localRecords);
        onClose();
    };

    // Updated color scheme: Substitute -> Yellow/Amber
    const statusOptions = [
        { id: 'titular', label: 'Titular', icon: CheckCircle, color: 'bg-green-50 text-green-600 border-green-200', ring: 'ring-green-500' },
        { id: 'substitute', label: 'Suplinitor', icon: RefreshCw, color: 'bg-amber-50 text-amber-600 border-amber-200', ring: 'ring-amber-500' },
        { id: 'absent', label: 'Absent', icon: UserX, color: 'bg-red-50 text-red-600 border-red-200', ring: 'ring-red-500' },
        { id: 'cancelled', label: 'Anulat', icon: Trash2, color: 'bg-gray-50 text-gray-600 border-gray-200', ring: 'ring-gray-500' },
    ];

    if (!localRecords.length) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalii: ${dateLabel}`}>
            <div className="space-y-6">
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                    {localRecords.map((record, index) => (
                        <div key={record.id} className="relative">
                            {index > 0 && <div className="absolute -top-3 left-0 right-0 h-px bg-gray-100 dark:bg-gray-800"></div>}
                            
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-black text-gray-900 dark:text-white text-lg">{record.className}</h4>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md flex items-center gap-1">
                                        <Clock size={12}/> {record.time}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin size={12}/> <span className="font-medium">{record.room}</span>
                                </div>
                            </div>

                            {/* Status Selector Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {statusOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleStatusChange(record.id, opt.id as any)}
                                        className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                                            record.status === opt.id 
                                            ? `${opt.color} ring-1 ring-offset-1 ${opt.ring}` 
                                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:bg-gray-50'
                                        }`}
                                    >
                                        <opt.icon size={16}/>
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Substitute Dropdown */}
                            {record.status === 'substitute' && (
                                <div className="animate-in fade-in slide-in-from-top-2 mb-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cine a ținut ora?</label>
                                    <select 
                                        value={record.actualInstructorId || ''} 
                                        onChange={(e) => handleSubstituteChange(record.id, e.target.value)}
                                        className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    >
                                        <option value="">Selectează Instructor...</option>
                                        {MOCK_INSTRUCTORS_DATA.filter(i => i.id !== record.instructorId).map(i => (
                                            <option key={i.id} value={i.id}>{i.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {record.status === 'absent' && (
                                <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-lg text-[10px] font-bold flex gap-2 items-center">
                                     <AlertCircle size={14} className="shrink-0"/>
                                     <span>Necesar suplinitor în sistem.</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                    <Button variant="secondary" onClick={onClose}>Anulează</Button>
                    <Button onClick={handleSave}>Salvează Tot</Button>
                </div>
            </div>
        </Modal>
    );
};
