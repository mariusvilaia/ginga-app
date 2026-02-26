import React, { useEffect, useState } from 'react';
import { 
  Users, CreditCard, RefreshCw, AlertCircle, CheckCircle2, 
  ExternalLink, Search, Filter, ArrowRight, UserPlus, Link as LinkIcon,
  GitMerge
} from 'lucide-react';
import { 
  fetchStripeCustomers, 
  fetchStripeSubscriptions, 
  fetchStripePayments,
  syncStripePayments,
  StripeCustomer,
  StripeSubscription,
  StripePayment
} from '../../../src/services/stripeService';
import { StudentDetailedProfile, Transaction } from '../../../types';
import { SyncedPayment } from '../../../src/services/stripeService';
import { useData } from '../../../contexts/DataContext';
import { calculateAdjustedExpiryDate } from '../../../utils/dateUtils';
import { Button } from '../../../components/UIComponents';

export const StripeIntegrationView: React.FC = () => {
  const { students, updateStudent, vacationPeriods } = useData();
  const [syncingStudentId, setSyncingStudentId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadStripeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custs, subs, pays] = await Promise.all([
        fetchStripeCustomers(),
        fetchStripeSubscriptions(),
        fetchStripePayments()
      ]);
      setCustomers(custs);
      setSubscriptions(subs);
      setPayments(pays);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Stripe. Check your API keys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStripeData();
  }, []);

  const handleSyncPayments = async (student: StudentDetailedProfile, customer: StripeCustomer) => {
    setSyncingStudentId(student.id);
    try {
      const syncedPayments = await syncStripePayments({
        email: customer.email || undefined,
        name: customer.name || undefined,

      });


      if (syncedPayments && syncedPayments.length > 0) {
        // Merge new payments with existing ones, avoiding duplicates by ID
        const existingPaymentIds = new Set((student.paymentHistory || []).map(p => p.id));
        const newPayments = syncedPayments.filter(sp => !existingPaymentIds.has(sp.id));

        let updatedPaymentHistory: any[] = [...(student.paymentHistory || []), ...newPayments];
        updatedPaymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Recalculate subscription expiry based on the LATEST payment
        const latestPayment = updatedPaymentHistory[0];
        let newExpiryDateStr = student.subscription.expiryDate;
        let newLastPaymentDate = student.subscription.lastPaymentDate;

        if (latestPayment) {
          const adjustedExpiryDate = calculateAdjustedExpiryDate(latestPayment.date, vacationPeriods);
          newExpiryDateStr = adjustedExpiryDate.toISOString().split('T')[0];
          newLastPaymentDate = latestPayment.date;
        }

        const updatedStudent: StudentDetailedProfile = {
          ...student,
          paymentHistory: updatedPaymentHistory,
          subscription: {
            ...student.subscription,
            active: true,
            lastPaymentDate: newLastPaymentDate,
            expiryDate: newExpiryDateStr,
          },
        };


        updateStudent(student.id, {
          paymentHistory: updatedPaymentHistory,
          subscription: {
            ...student.subscription,
            active: true,
            lastPaymentDate: newLastPaymentDate,
            expiryDate: newExpiryDateStr,
          },
        });

      }
      alert(`Sincronizare reușită pentru ${student.name}!`);
    } catch (err: any) {
      console.error("Failed to sync payments:", err);
      alert(`Eroare la sincronizarea plăților pentru ${student.name}: ${err.message}`);
    } finally {
      setSyncingStudentId(null);
    }
  };

  const matchedData = customers.map(customer => {
    const student = students.find(s => s.email.toLowerCase() === customer.email.toLowerCase());
    const customerSubs = subscriptions.filter(s => 
      typeof s.customer === 'string' ? s.customer === customer.id : s.customer.id === customer.id
    );
    const customerPayments = payments.filter(p => p.customer === customer.id);

    return {
      customer,
      student,
      subscriptions: customerSubs,
      payments: customerPayments,
      isMatched: !!student
    };
  });

  const filteredData = matchedData.filter(item => 
    item.customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
        <p className="text-gray-500 font-medium">Se încarcă datele din Stripe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-8 flex flex-col items-center text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Eroare de Conectare</h3>
        <p className="text-red-600 dark:text-red-400 mb-6 max-w-md">{error}</p>
        <div className="flex gap-4">
          <Button onClick={loadStripeData} variant="secondary" className="gap-2">
            <RefreshCw size={16} /> Reîncearcă
          </Button>
          <a 
            href="https://dashboard.stripe.com/apikeys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Configurează Stripe <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Clienți Stripe</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{customers.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
              <CreditCard size={20} />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Abonamente Active</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {subscriptions.filter(s => s.status === 'active').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
              <GitMerge size={20} />
            </div>
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Meciuri Găsite</span>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {matchedData.filter(m => m.isMatched).length} / {customers.length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Caută după nume sau email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2 text-xs h-9">
            <Filter size={14} /> Filtrează
          </Button>
          <Button onClick={loadStripeData} variant="secondary" className="gap-2 text-xs h-9">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Stripe</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Matching</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Abonament Real</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ultima Plată</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredData.map((item) => (
                <tr key={item.customer.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white">{item.customer.name || 'Fără nume'}</span>
                      <span className="text-xs text-gray-500">{item.customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.isMatched ? (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold">Conectat: {item.student?.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold">Neconectat</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.subscriptions.length > 0 ? (
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                          item.subscriptions[0].status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.subscriptions[0].status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1">
                          {(item.subscriptions[0].plan.amount / 100).toFixed(2)} {item.subscriptions[0].plan.currency.toUpperCase()} / {item.subscriptions[0].plan.interval}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Fără abonament</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {item.payments.length > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {(item.payments[0].amount / 100).toFixed(2)} {item.payments[0].currency.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(item.payments[0].created * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Nicio plată</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.isMatched && item.student && ( // Only show sync button for matched students
                        <Button 
                          variant="secondary" 
                          className="h-8 px-3 text-[10px] gap-1"
                          onClick={() => handleSyncPayments(item.student!, item.customer)}
                          disabled={syncingStudentId === item.student.id}
                        >
                          {syncingStudentId === item.student.id ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <GitMerge size={12} />
                          )}
                          Sincronizează
                        </Button>
                      )}
                      {!item.isMatched && (
                        <Button variant="secondary" className="h-8 px-3 text-[10px] gap-1">
                          <LinkIcon size={12} /> Link Manual
                        </Button>
                      )}
                      <a 
                        href={`https://dashboard.stripe.com/customers/${item.customer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    Nu s-au găsit clienți care să corespundă căutării.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matching Logic Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <AlertCircle size={18} /> Cum funcționează matching-ul?
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
          Sistemul încearcă automat să asocieze clienții din <span className="font-bold">Stripe</span> cu studenții din <span className="font-bold">Ginga</span> folosind adresa de email. 
          Dacă un client nu este găsit automat, puteți folosi butonul "Link Manual" pentru a-l asocia cu un profil existent. 
          Odată asociați, datele despre abonamente și plăți vor fi sincronizate în timp real.
        </p>
      </div>
    </div>
  );
};
