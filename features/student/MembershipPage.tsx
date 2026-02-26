
import React, { useState, useMemo } from 'react';
import { Check, ChevronRight, CreditCard, ShieldCheck, Download, History, AlertCircle, Loader2, FastForward, Coins, Gem, Sparkles, Crown, ArrowUpCircle, ArrowDownCircle, Clock, Unlock, CalendarOff } from 'lucide-react';
import { UserProfile } from '../../types';
import { Card, Badge, Button, Modal, Switch } from '../../components/UIComponents';

interface MembershipPageProps {
  user: UserProfile;
  onBack: () => void;
}

// Pricing Data Matrix
const PRICING_MATRIX = {
  packets: [
    { count: 1, price: 79 },
    { count: 2, price: 139 },
    { count: 3, price: 179 },
    { count: 4, price: 239 },
  ],
  subs: {
    Bronze: {
      id: 1,
      name: 'Bronze',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: <Sparkles size={24} className="text-orange-500" />,
      features: ['1 oră / săptămână', 'Valabil 30 de zile', 'Acces party-uri cu plată'],
      pricing: {
        loialty: { 1: 189, 3: 179, 6: 169, 12: 159 },
        flexible: { 1: 209, 3: 199, 6: 189, 12: 179 }
      },
      points: {
        loialty: { 1: 50, 3: 200, 6: 500, 12: 1000 },
        flexible: { 1: 0, 3: 100, 6: 250, 12: 500 }
      }
    },
    Silver: {
      id: 3, 
      name: 'Silver',
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: <Gem size={24} className="text-slate-400" />,
      features: ['2 ore / săptămână', 'Valabil 30 de zile', '1 Party inclus/lună'],
      pricing: {
        loialty: { 1: 269, 3: 259, 6: 249, 12: 239 },
        flexible: { 1: 289, 3: 279, 6: 269, 12: 259 }
      },
      points: {
        loialty: { 1: 100, 3: 400, 6: 1000, 12: 2000 },
        flexible: { 1: 0, 3: 200, 6: 500, 12: 1000 }
      }
    },
    Gold: {
      id: 2,
      name: 'Gold',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Gem size={24} className="text-amber-500" />,
      features: ['3 ore / săptămână', 'Valabil 30 de zile', 'Toate Party-urile incluse'],
      pricing: {
        loialty: { 1: 349, 3: 339, 6: 329, 12: 319 },
        flexible: { 1: 369, 3: 359, 6: 349, 12: 339 }
      },
      points: {
        loialty: { 1: 150, 3: 600, 6: 1500, 12: 3000 },
        flexible: { 1: 0, 3: 300, 6: 750, 12: 1500 }
      }
    },
    Platinum: {
      id: 4,
      name: 'Platinum',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Crown size={24} className="text-indigo-500" />,
      features: ['Acces NELIMITAT', 'Valabil 30 de zile', '1 Private Class / lună'],
      pricing: {
        loialty: { 1: 449, 3: 439, 6: 429, 12: 419 },
        flexible: { 1: 469, 3: 459, 6: 449, 12: 439 }
      },
      points: {
        loialty: { 1: 200, 3: 800, 6: 2000, 12: 4000 },
        flexible: { 1: 0, 3: 400, 6: 1000, 12: 2000 }
      }
    }
  }
};

const MOCK_PAYMENTS = [
  { id: 'GINGA-20241022-0042', date: '22 Oct 2024', amount: 269, status: 'Succes' },
  { id: 'GINGA-20240920-1121', date: '20 Sept 2024', amount: 269, status: 'Succes' },
];

export const MembershipPage: React.FC<MembershipPageProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'packs' | 'subs'>('subs');
  
  // Subscription Configuration State
  const duration = 1; // Forced Monthly
  const [isLoyalty, setIsLoyalty] = useState(true); // True = Loyalty, False = Flexible

  // Payment Flow State
  const [paymentStep, setPaymentStep] = useState<'idle' | 'confirm' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    basePrice: number;
    finalPrice: number;
    details: string;
    type: 'pack' | 'sub' | 'upgrade' | 'downgrade';
    proratedDays?: number;
  } | null>(null);

  // --- HELPER LOGIC ---
  const currentPlanName = user.subscription.active ? user.subscription.type.replace(/ Plan \(\d+\)/, '') : null;
  
  // Get current plan level ID (1-4)
  const currentPlanLevel = currentPlanName && PRICING_MATRIX.subs[currentPlanName as keyof typeof PRICING_MATRIX.subs] 
    ? PRICING_MATRIX.subs[currentPlanName as keyof typeof PRICING_MATRIX.subs].id 
    : 0;

  // Calculate Days Left
  const getDaysLeft = () => {
      if (!user.subscription.expiryDate) return 0;
      const diff = new Date(user.subscription.expiryDate).getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const getPrice = (tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') => {
    const variant = isLoyalty ? 'loialty' : 'flexible';
    return PRICING_MATRIX.subs[tier].pricing[variant][duration];
  };

  const getPoints = (tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') => {
    const variant = isLoyalty ? 'loialty' : 'flexible';
    return PRICING_MATRIX.subs[tier].points[variant][duration];
  };

  // --- ACTIONS ---

  const handleSelectPlan = (tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum') => {
    const targetPlan = PRICING_MATRIX.subs[tier];
    const targetPrice = getPrice(tier);
    const targetLevel = targetPlan.id;

    // 1. Upgrade Logic
    if (currentPlanName && user.subscription.active && targetLevel > currentPlanLevel) {
       const daysLeft = getDaysLeft();
       // Assume current plan price (simplified for demo, normally fetched from user history)
       const currentPlanPrice = getPrice(currentPlanName as any);
       const priceDiffPerDay = (targetPrice - currentPlanPrice) / 30;
       const proratedCost = Math.ceil(priceDiffPerDay * daysLeft);

       setSelectedItem({
           name: `Upgrade la ${targetPlan.name}`,
           basePrice: targetPrice,
           finalPrice: Math.max(0, proratedCost),
           details: `Upgrade imediat pt. ${daysLeft} zile rămase`,
           type: 'upgrade',
           proratedDays: daysLeft
       });
       setPaymentStep('confirm');
       return;
    }

    // 2. Downgrade Logic
    if (currentPlanName && user.subscription.active && targetLevel < currentPlanLevel) {
        setSelectedItem({
            name: `Schimbare la ${targetPlan.name}`,
            basePrice: targetPrice,
            finalPrice: 0, // Pay later
            details: `Activ din ${user.subscription.expiryDate}`,
            type: 'downgrade'
        });
        setPaymentStep('confirm');
        return;
    }

    // 3. New Purchase or Renewal (Same Level)
    setSelectedItem({
        name: `Abonament ${targetPlan.name} (${isLoyalty ? 'Loialty' : 'Flexible'})`,
        basePrice: targetPrice * duration,
        finalPrice: targetPrice * duration,
        details: isLoyalty 
            ? 'Plată lunară automată (Anulezi oricând)' 
            : 'Plată unică. Fără reînnoire automată.',
        type: 'sub'
    });
    setPaymentStep('confirm');
  };

  const handleBuyPack = (pack: any) => {
      setSelectedItem({
          name: `${pack.count} Ședințe`,
          basePrice: pack.price,
          finalPrice: pack.price,
          details: 'Valabilitate 30 zile',
          type: 'pack'
      });
      setPaymentStep('confirm');
  }

  const simulatePayment = async () => {
    setPaymentStep('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentStep('success');
  };

  return (
    <div className="font-sans antialiased w-full">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* TAB SWITCHER */}
        <div className="flex bg-gray-200 p-1 rounded-2xl w-full max-w-sm mx-auto">
          <button 
            onClick={() => setActiveTab('subs')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'subs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Abonamente
          </button>
          <button 
            onClick={() => setActiveTab('packs')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${activeTab === 'packs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pachete Ședințe
          </button>
        </div>

        {activeTab === 'packs' ? (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
            {PRICING_MATRIX.packets.map(pack => (
              <Card key={pack.count} className="border-none shadow-sm flex flex-col items-center justify-center p-6 text-center hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => handleBuyPack(pack)}>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 font-black text-lg">
                  {pack.count}
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">{pack.price} RON</h3>
                <p className="text-xs text-gray-500 font-medium">{pack.count === 1 ? 'o ședință' : `${pack.count} ședințe`}</p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* CONFIGURATOR */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 max-w-3xl mx-auto">
              {/* Loyalty Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isLoyalty ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isLoyalty ? <ShieldCheck size={20} /> : <CalendarOff size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{isLoyalty ? 'Preț Loialty (Recomandat)' : 'Preț Flexible'}</p>
                    <p className="text-[10px] text-gray-500 font-medium">
                        {isLoyalty 
                            ? 'Cel mai bun preț. Debit automat lunar.' 
                            : 'Plată unică. Fără reînnoire automată.'}
                    </p>
                  </div>
                </div>
                <Switch checked={isLoyalty} onChange={setIsLoyalty} />
              </div>
            </div>

            {/* SUBSCRIPTION CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {(['Bronze', 'Gold', 'Silver', 'Platinum'] as const).map(tier => {
                const plan = PRICING_MATRIX.subs[tier];
                const price = getPrice(tier);
                const points = getPoints(tier);
                const isCurrent = currentPlanName === tier;
                const isUpgrade = currentPlanLevel > 0 && plan.id > currentPlanLevel;
                const isDowngrade = currentPlanLevel > 0 && plan.id < currentPlanLevel;
                
                return (
                  <div key={tier} className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group relative ${isCurrent ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-100'}`}>
                    
                    {isCurrent && (
                        <div className="absolute top-0 inset-x-0 bg-blue-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest z-10">Plan Curent</div>
                    )}

                    <div className={`p-6 border-b ${plan.color.replace('text-', 'border-').split(' ')[2]} ${plan.color.split(' ')[0]} bg-opacity-30 ${isCurrent ? 'pt-8' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-lg font-black uppercase tracking-tight bg-white/80 shadow-sm backdrop-blur-sm ${plan.color.split(' ')[1]}`}>
                          {plan.name}
                        </span>
                        {plan.icon}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900">{price.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500">RON</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                          {isLoyalty ? '/ Lună (Recurent)' : '/ 30 Zile (Unic)'}
                      </p>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-600">
                            <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                      
                      {points > 0 && (
                        <div className="mb-6 flex items-center gap-2 bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-yellow-700">
                          <Coins size={16} />
                          <span className="text-xs font-bold">+{points} Ginga Points</span>
                        </div>
                      )}

                      <Button 
                        disabled={isCurrent} 
                        onClick={() => handleSelectPlan(tier)}
                        className={`w-full ${isCurrent ? 'bg-green-600 hover:bg-green-700 text-white' : (isUpgrade || isDowngrade) ? 'bg-[#F4B400] hover:bg-yellow-500 text-gray-900 shadow-md' : 'bg-gray-900 hover:bg-black text-white'}`}
                      >
                        {isCurrent ? 'Plan Activ' : isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : `Alege ${plan.name}`}
                        {isUpgrade && <ArrowUpCircle size={16} className="ml-2"/>}
                        {isDowngrade && <ArrowDownCircle size={16} className="ml-2"/>}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HISTORY LINK */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Istoric Recente</h3>
            <History size={16} className="text-gray-300" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {MOCK_PAYMENTS.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-4">
                <div>
                  <p className="text-xs font-black text-gray-900">{p.id}</p>
                  <p className="text-[10px] text-gray-400">{p.date}</p>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{p.amount} RON</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* PAYMENT MODAL */}
      <Modal isOpen={paymentStep !== 'idle'} onClose={() => setPaymentStep('idle')} title={selectedItem?.type === 'downgrade' ? 'Confirmare Schimbare' : 'Confirmare Plată'}>
        {paymentStep === 'confirm' && selectedItem && (
          <div className="space-y-6">
            
            {/* Context Banner */}
            {selectedItem.type === 'upgrade' && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-indigo-800">
                    <Sparkles size={20} className="shrink-0"/>
                    <div className="text-xs">
                        <p className="font-bold">Upgrade Proporțional</p>
                        <p className="opacity-80">Plătești doar diferența pentru cele {selectedItem.proratedDays} zile rămase din abonamentul curent.</p>
                    </div>
                </div>
            )}

            {selectedItem.type === 'downgrade' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-amber-800">
                    <Clock size={20} className="shrink-0"/>
                    <div className="text-xs">
                        <p className="font-bold">Modificare Programată</p>
                        <p className="opacity-80">Downgrade-ul va intra în vigoare automat după expirarea abonamentului curent.</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Produs</span>
                <span className="text-sm font-black text-gray-900 text-right">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase">Detalii</span>
                <span className="text-xs font-medium text-gray-700">{selectedItem.details}</span>
              </div>
              
              <div className="h-px bg-gray-200 w-full"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900 uppercase">
                    {selectedItem.type === 'downgrade' ? 'Cost Viitor' : 'Total de plată'}
                </span>
                <span className="text-xl font-black text-blue-600">
                    {selectedItem.type === 'downgrade' ? `${selectedItem.basePrice.toLocaleString()} RON` : `${selectedItem.finalPrice.toLocaleString()} RON`}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedItem.type === 'downgrade' ? (
                  <Button onClick={simulatePayment} className="w-full bg-amber-500 hover:bg-amber-600 text-white border-none">Confirmă Modificarea</Button>
              ) : (
                  <Button onClick={simulatePayment} className="w-full bg-blue-600 hover:bg-blue-700">Plătește cu Cardul</Button>
              )}
              <Button variant="ghost" onClick={() => setPaymentStep('idle')}>Anulează</Button>
            </div>
          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-900">
                {selectedItem?.type === 'downgrade' ? 'Actualizăm planul...' : 'Procesăm plata securizată...'}
            </p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl font-black text-gray-900">Succes!</h3>
            <p className="text-xs text-gray-500 max-w-xs">
                {selectedItem?.type === 'downgrade' 
                    ? 'Modificarea a fost programată. Vei trece la noul plan după expirarea celui curent.' 
                    : 'Abonamentul tău a fost actualizat cu succes.'}
            </p>
            <Button onClick={() => setPaymentStep('idle')} className="w-full mt-4">Înapoi la Cont</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
