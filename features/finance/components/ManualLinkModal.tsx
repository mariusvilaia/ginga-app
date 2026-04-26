import React, { useState } from 'react';
import { StudentDetailedProfile } from '../../../types';
import { Button } from '../../../components/UIComponents';
import { X, Search } from 'lucide-react';

interface ManualLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentDetailedProfile[];
  onLink: (studentId: string) => void;
  stripeCustomerName: string;
}

export const ManualLinkModal: React.FC<ManualLinkModalProps> = ({ isOpen, onClose, students, onLink, stripeCustomerName }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Link Manual</h3>
            <p className="text-sm text-gray-500">Asociază clientul Stripe <span className="font-bold">{stripeCustomerName}</span> cu un student.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Caută student după nume sau email..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {filteredStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.email}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onLink(student.id)}>
                  Selectează
                </Button>
              </div>
            ))}
             {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500 italic">
                    Niciun student găsit.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
