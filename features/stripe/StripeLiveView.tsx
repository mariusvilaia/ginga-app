import React from 'react';
import { StripeIntegrationView } from '../finance/tabs/StripeIntegrationView';
import { CreditCard } from 'lucide-react';

export const StripeLiveView: React.FC = () => {
  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <CreditCard size={28} className="text-blue-500"/> Integrare Stripe Live
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
            Vizualizează și sincronizează clienții, abonamentele și plățile direct din Stripe.
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1 pb-4">
        <StripeIntegrationView />
      </div>
    </div>
  );
};
