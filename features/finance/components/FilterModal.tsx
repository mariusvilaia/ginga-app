import React from 'react';
import { Button } from '../../../components/UIComponents';
import { X, Check } from 'lucide-react';

export interface StripeFilters {
  matchingStatus: 'all' | 'matched' | 'unmatched';
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: StripeFilters;
  onApply: (newFilters: StripeFilters) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = React.useState<StripeFilters>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtrează Clienți Stripe</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Status Matching</label>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <button 
                onClick={() => setLocalFilters(f => ({ ...f, matchingStatus: 'all' }))}
                className={`w-full text-left p-3 rounded-xl transition-colors text-sm font-bold flex items-center justify-between ${localFilters.matchingStatus === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                Toate statusurile
                {localFilters.matchingStatus === 'all' && <Check size={16} />}
              </button>
              <button 
                onClick={() => setLocalFilters(f => ({ ...f, matchingStatus: 'matched' }))}
                className={`w-full text-left p-3 rounded-xl transition-colors text-sm font-bold flex items-center justify-between ${localFilters.matchingStatus === 'matched' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                Doar Conectați
                {localFilters.matchingStatus === 'matched' && <Check size={16} />}
              </button>
              <button 
                onClick={() => setLocalFilters(f => ({ ...f, matchingStatus: 'unmatched' }))}
                className={`w-full text-left p-3 rounded-xl transition-colors text-sm font-bold flex items-center justify-between ${localFilters.matchingStatus === 'unmatched' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                Doar Neconectați
                {localFilters.matchingStatus === 'unmatched' && <Check size={16} />}
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Anulează</Button>
            <Button onClick={handleApply}>Aplică Filtre</Button>
        </div>
      </div>
    </div>
  );
};
