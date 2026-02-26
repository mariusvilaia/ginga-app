import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../components/UIComponents';
import { CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payment: { amount: number; date: string; description: string }) => void;
    studentName: string;
    initialData?: { amount: number; date: string; description: string } | null;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, onSave, studentName, initialData }) => {
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('Abonament Lunar');

    // Initialize/Reset state when modal opens or initialData changes
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setAmount(initialData.amount.toString());
                setDate(initialData.date);
                setDescription(initialData.description);
            } else {
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('Abonament Lunar');
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        if (!amount || !date) return;
        onSave({
            amount: parseFloat(amount),
            date,
            description
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editează Plată" : "Adaugă Plată Manuală"}>
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-bold">Info:</span> {initialData ? 'Editarea plății' : 'Adăugarea unei plăți'} va actualiza automat data expirării abonamentului pentru <strong>{studentName}</strong> (1 lună de la data plății).
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sumă (RON)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Data Plății</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descriere</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                placeholder="Ex: Abonament Silver"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose}>Anulează</Button>
                    <Button onClick={handleSubmit} disabled={!amount || !date}>Salvează Plată</Button>
                </div>
            </div>
        </Modal>
    );
};
