import React, { useState } from 'react';
import { Button } from '../../../components/UIComponents';
import { VacationManagerModal } from '../components/VacationManagerModal';
import { Clock, PlusCircle } from 'lucide-react';

export const VacationsTab: React.FC = () => {
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Management Vacanțe</h3>
          <p className="text-xs text-gray-500">Definește perioadele de vacanță ale academiei. Abonamentele vor fi prelungite automat.</p>
        </div>
        <Button onClick={() => setIsVacationModalOpen(true)} className="!w-auto px-4 h-9 text-xs gap-2">
          <PlusCircle size={14} /> Adaugă Perioadă
        </Button>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
        <p className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
          <Clock size={16}/> Funcționalitate Globală
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Perioadele de vacanță setate aici se vor aplica tuturor membrilor activi, prelungind automat valabilitatea abonamentelor lor.
        </p>
      </div>

      {/* Aici se va afișa lista de vacanțe existente */}
      <p className="text-sm text-gray-400 text-center py-8">Lista perioadelor de vacanță va fi afișată aici.</p>

      <VacationManagerModal isOpen={isVacationModalOpen} onClose={() => setIsVacationModalOpen(false)} />
    </div>
  );
};
