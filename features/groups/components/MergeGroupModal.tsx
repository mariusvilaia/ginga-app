
import React, { useState, useMemo } from 'react';
import { GitMerge, ArrowRight, Trash2 } from 'lucide-react';
import { Modal, Button, Switch } from '../../../components/UIComponents';
import { GroupDetailedProfile } from '../../../types';
import { useData } from '../../../contexts/DataContext';

interface MergeGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceGroup: GroupDetailedProfile;
    onMergeSuccess: () => void;
}

export const MergeGroupModal: React.FC<MergeGroupModalProps> = ({ isOpen, onClose, sourceGroup, onMergeSuccess }) => {
    const { groups, students, mergeGroups } = useData();
    const [targetGroupId, setTargetGroupId] = useState<string>('');
    const [deleteSource, setDeleteSource] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter available targets (exclude source group)
    const availableTargets = useMemo(() => {
        return groups.filter(g => g.id !== sourceGroup.id);
    }, [groups, sourceGroup.id]);

    // Calculate students to be moved
    const studentsToMove = useMemo(() => {
        return students.filter(s => 
            s.enrollments?.some(e => e.groupId === sourceGroup.id) || 
            s.mainGroup === sourceGroup.name
        ).length;
    }, [students, sourceGroup]);

    const handleMerge = async () => {
        if (!targetGroupId) return;
        
        const targetGroup = groups.find(g => g.id === targetGroupId);
        if (!targetGroup) return;

        // Confirmation is implied by the modal itself. Removing window.confirm to avoid blocking issues.
        setIsProcessing(true);
        try {
            await mergeGroups(sourceGroup.id, targetGroupId, deleteSource);
            onMergeSuccess();
            onClose();
            // Reset state
            setTargetGroupId('');
            setDeleteSource(false);
        } catch (error) {
            alert("A apărut o eroare la unirea grupelor. Verifică consola pentru detalii.");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Unește Grupe (Merge)">
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300 mb-2">
                        <GitMerge size={20} />
                        <h4 className="font-bold text-sm">Proces de Unificare</h4>
                    </div>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400 leading-relaxed">
                        Această acțiune va muta toți cursanții din grupa curentă într-o altă grupă existentă. 
                        Istoricul de prezență va rămâne neschimbat, dar apartenența lor curentă va fi actualizată.
                    </p>
                </div>

                {/* VISUAL FLOW */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex-1 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-center opacity-60">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">SURSA</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{sourceGroup.name}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{studentsToMove} Cursanți</p>
                    </div>
                    <div className="px-3 text-gray-400">
                        <ArrowRight size={20} />
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 p-3 rounded-xl border-2 border-blue-500 dark:border-blue-600 text-center relative">
                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">DESTINAȚIA</p>
                        {targetGroupId ? (
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {groups.find(g => g.id === targetGroupId)?.name}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Selectează...</p>
                        )}
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-sm">
                            <GitMerge size={12} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Alege Grupa Destinație</label>
                    <select 
                        value={targetGroupId}
                        onChange={(e) => setTargetGroupId(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-900 dark:text-white transition-all"
                    >
                        <option value="">Selectează Grupa...</option>
                        {availableTargets.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.schedule.day}, {g.schedule.time})</option>
                        ))}
                    </select>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${deleteSource ? 'bg-red-100 text-red-600' : 'bg-white text-gray-400'}`}>
                            <Trash2 size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white">Șterge grupa sursă</p>
                            <p className="text-[10px] text-gray-500">După mutare, șterge grupa "{sourceGroup.name}"</p>
                        </div>
                    </div>
                    <Switch checked={deleteSource} onChange={setDeleteSource} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="secondary" onClick={onClose} disabled={isProcessing}>Anulează</Button>
                    <Button 
                        onClick={handleMerge} 
                        disabled={!targetGroupId || isProcessing}
                        isLoading={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Confirmă Unirea
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
