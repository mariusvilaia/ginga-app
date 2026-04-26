
import React, { useState, useRef, useEffect } from 'react';
import { Building2, CreditCard as CreditCardIcon, Globe, Lock, Edit3, MessageCircle, FileText as FileTextIcon, RefreshCw, Link as LinkIcon, UserCog, Camera, Upload, Crop, Mail, Phone, User, CheckCircle, AlertTriangle, Key, RotateCw, Trash2, Clock, Sun } from 'lucide-react';
import { COMPANY_DETAILS } from '../../constants';
import { getSubscriptionColor } from '../../utils/themeUtils';
import { Button, Input, Switch, Badge } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';
import { UserProfile } from '../../types';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { normalizeRoPhone } from '../../utils/phoneUtils';
import { VacationsTab } from './tabs/VacationsTab';

interface SettingsViewProps {
    user?: UserProfile;
    onUpdateProfile?: (data: Partial<UserProfile>) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateProfile, isDarkMode, toggleDarkMode }) => {
    const { subscriptionPlans, syncStripePlans, configureStripeKey, fetchStripeCustomers, refreshSubscriptionPlans, hardResetDatabase } = useData(); 
    const [activeTab, setActiveTab] = useState<'general' | 'subscriptions' | 'integrations' | 'security' | 'profile'>('general');
    const [isSyncingStripe, setIsSyncingStripe] = useState(false);
    const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Stripe Config State
    const [stripeKey, setStripeKey] = useState('');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [isStripeConnected, setIsStripeConnected] = useState(false);

    // Profile State
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '');
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [tempAvatar, setTempAvatar] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Paste Image Listener for Profile Tab
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (activeTab !== 'profile') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            setCropImageSrc(event.target?.result as string);
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [activeTab]);

    const handleStripeSync = async () => {
        if (!isStripeConnected) {
            alert("Activează mai întâi integrarea Stripe din switch-ul de sus.");
            return;
        }
        setIsSyncingStripe(true);
        try {
            await fetchStripeCustomers(); // Sync Members via Backend Proxy
            alert("Sincronizare completă! Lista de membri a fost actualizată din Stripe.");
        } catch (e: any) {
            console.error(e);
            alert(`Eroare la sincronizare: ${e.message || e.toString()}`);
        } finally {
            setIsSyncingStripe(false);
        }
    };

    const handleUpdatePrices = async () => {
        setIsUpdatingPrices(true);
        try {
            await refreshSubscriptionPlans();
            alert("Prețurile abonamentelor au fost actualizate în baza de date.");
        } catch (e) {
            alert("Eroare la actualizarea prețurilor.");
        } finally {
            setIsUpdatingPrices(false);
        }
    };

    const handleHardReset = async () => {
        if (confirm("ATENȚIE: Această acțiune va șterge toate datele din baza de date și va reîncărca datele demo originale. Ești sigur?")) {
            setIsResetting(true);
            await hardResetDatabase();
            setIsResetting(false);
        }
    };

    const handleSaveStripeKey = async () => {
        if (!stripeKey?.startsWith('rk_') && !stripeKey?.startsWith('sk_')) {
            alert("Cheia trebuie să înceapă cu 'rk_' (Restricted) sau 'sk_' (Secret).");
            return;
        }
        
        setIsSavingKey(true);
        try {
            await configureStripeKey(stripeKey);
            setStripeKey('');
            setIsStripeConnected(true);
            alert("Cheia Stripe a fost salvată cu succes!");
        } catch (e: any) {
            console.error("Save Error:", e);
            alert(`Eroare la salvare: ${e.message || "Verifică consola pentru detalii."}`);
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCropImageSrc(reader.result as string);
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    };

    const handleCropComplete = (base64: string) => {
        setTempAvatar(base64);
        setCropImageSrc(null);
    };

    const handleSaveProfile = async () => {
        if (!onUpdateProfile) return;
        setIsSavingProfile(true);
        await new Promise(r => setTimeout(r, 800));
        onUpdateProfile({
            name: editName,
            phone: normalizeRoPhone(editPhone),
            avatarUrl: tempAvatar || user?.avatarUrl
        });
        setIsSavingProfile(false);
        alert("Profil actualizat cu succes!");
    };

    return (
        <div className="h-full flex flex-col max-w-5xl mx-auto relative animate-in fade-in duration-300">
            {cropImageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <ImageCropper src={cropImageSrc} onCrop={handleCropComplete} onCancel={() => setCropImageSrc(null)} />
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Setări</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Configurează detaliile școlii, abonamentele și profilul.</p>
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Sidebar */}
                <div className="w-full lg:w-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2 shadow-sm shrink-0">
                    {[
                        { id: 'general', label: 'General', icon: Building2 },
                        { id: 'profile', label: 'Profil Admin', icon: UserCog },
                        { id: 'subscriptions', label: 'Abonamente', icon: CreditCardIcon },
                        { id: 'integrations', label: 'Integrări', icon: Globe },
                        { id: 'security', label: 'Securitate', icon: Lock },
                        { id: 'vacations', label: 'Vacanțe', icon: Clock },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm mb-1
                            ${activeTab === tab.id 
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 w-full">
                    
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">Informații Școală</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nume Școală" defaultValue={COMPANY_DETAILS.name} />
                                <Input label="Email Contact" defaultValue="contact@ginga.ro" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="CUI" defaultValue={COMPANY_DETAILS.cui} />
                                <Input label="Reg. Com." defaultValue={COMPANY_DETAILS.regCom} />
                            </div>
                            <Input label="Adresă Sediu" defaultValue={COMPANY_DETAILS.address} />

                            <div className="pt-8 border-t border-gray-100 dark:border-gray-800 mt-8">
                                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase flex items-center gap-2"><Sun className="inline-block" size={16}/> Mod Afișaj</h4>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Dark Mode</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Activează modul întunecat pentru interfață.</p>
                                    </div>
                                    <Switch checked={isDarkMode} onChange={toggleDarkMode} />
                                </div>
                            </div>
                            
                            <div className="pt-8 border-t border-gray-100 dark:border-gray-800 mt-8">
                                <h4 className="text-sm font-bold text-red-600 mb-2 uppercase flex items-center gap-2"><AlertTriangle size={16}/> Zona de Pericol</h4>
                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-red-900 dark:text-red-200">Resetează Baza de Date</p>
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">Șterge tot și reîncarcă datele demo originale. Ireversibil.</p>
                                    </div>
                                    <Button 
                                        variant="danger" 
                                        onClick={handleHardReset} 
                                        isLoading={isResetting}
                                        className="!w-auto px-4 h-9 text-xs"
                                    >
                                        <Trash2 size={14} className="mr-1"/> Resetează
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button className="!w-auto px-8">Salvează Modificările</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && user && (
                        <div className="space-y-8 animate-in fade-in">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4">Profil Administrator</h3>
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Click sau Paste (Ctrl+V) pentru poză">
                                    <img src={tempAvatar || user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 shadow-lg"/>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><Camera size={32} className="text-white" /></div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"><Upload size={16}/> Încarcă</button>
                                    {(tempAvatar || user.avatarUrl) && <button onClick={() => setCropImageSrc(tempAvatar || user.avatarUrl || '')} className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"><Crop size={16}/> Ajustează</button>}
                                </div>
                            </div>
                            <div className="space-y-4 max-w-xl mx-auto">
                                <Input label="Nume Complet" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                <Input label="Email (Read-only)" value={user.email} readOnly disabled />
                                <Input 
                                    label="Telefon" 
                                    value={editPhone} 
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    onBlur={() => setEditPhone(normalizeRoPhone(editPhone))}
                                />
                                <div className="pt-4 flex justify-end"><Button onClick={handleSaveProfile} isLoading={isSavingProfile} className="!w-auto px-8">Salvează Modificările</Button></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                         <div className="space-y-8">
                             <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                                 <div>
                                     <h3 className="text-xl font-bold text-gray-900 dark:text-white">Integrări Externe</h3>
                                     <p className="text-xs text-gray-500">Conectează serviciile de plăți și facturare.</p>
                                 </div>
                             </div>
                             
                             {/* STRIPE CONFIGURATION CARD */}
                             <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 flex justify-between items-start">
                                     <div className="flex gap-4">
                                         <div className="p-3 bg-white dark:bg-indigo-900 rounded-xl shadow-sm text-indigo-600"><CreditCardIcon size={32}/></div>
                                         <div>
                                             <h4 className="font-bold text-gray-900 dark:text-white text-lg">Stripe Payments</h4>
                                             <p className="text-sm text-gray-600 dark:text-gray-300">Sincronizează automat clienții și abonamentele.</p>
                                             {isStripeConnected && (
                                                 <div className="flex items-center gap-2 mt-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded w-fit">
                                                     <CheckCircle size={12}/> Conectat Activ
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                     <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                                         <Switch 
                                            checked={isStripeConnected} 
                                            onChange={(val) => setIsStripeConnected(val)} 
                                         />
                                     </div>
                                 </div>
                                 
                                 <div className={`p-6 space-y-4 bg-white dark:bg-gray-900 transition-all ${isStripeConnected ? 'opacity-100' : 'opacity-100'}`}>
                                     <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3">
                                         <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5"/>
                                         <div className="text-xs text-yellow-800">
                                             <p className="font-bold mb-1">Configurare Securizată</p>
                                             <p>Pentru securitate, folosește un <strong>Restricted Key</strong> (rk_...). Dacă testezi, poți folosi și un <strong>Secret Key</strong> (sk_...).</p>
                                         </div>
                                     </div>

                                     <div className="space-y-2">
                                         <label className="text-xs font-bold uppercase text-gray-500">Stripe API Key (rk_... / sk_...)</label>
                                         <div className="flex gap-2">
                                             <div className="relative flex-1">
                                                 <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                                 <input 
                                                     type="password" 
                                                     placeholder="rk_live_... sau sk_test_..." 
                                                     value={stripeKey}
                                                     onChange={(e) => setStripeKey(e.target.value)}
                                                     className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                                                 />
                                             </div>
                                             <Button 
                                                 onClick={handleSaveStripeKey} 
                                                 isLoading={isSavingKey}
                                                 disabled={!stripeKey}
                                                 className="!w-auto px-4 bg-gray-900 text-white"
                                             >
                                                 Salvează Cheia
                                             </Button>
                                         </div>
                                     </div>

                                     <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                         <p className="text-xs text-gray-400">Ultima sincronizare: {new Date().toLocaleDateString()}</p>
                                         <Button 
                                             variant="secondary" 
                                             onClick={handleStripeSync} 
                                             isLoading={isSyncingStripe}
                                             disabled={!isStripeConnected}
                                             className="!w-auto px-6 border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                                         >
                                             <RefreshCw size={16} className={`mr-2 ${isSyncingStripe ? 'animate-spin' : ''}`}/> 
                                             {isSyncingStripe ? 'Se sincronizează...' : 'Sincronizează Acum'}
                                         </Button>
                                     </div>
                                 </div>
                             </div>

                             {/* Revolut Business (Placeholder) */}
                             <div className="flex items-center justify-between p-5 border border-gray-100 dark:border-gray-800 rounded-2xl opacity-60">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-black text-white rounded-xl"><span className="font-black text-lg">R</span></div>
                                     <div><h4 className="font-bold text-gray-900 dark:text-white">Revolut Business</h4><p className="text-xs text-gray-500">Sincronizare conturi bancare & cheltuieli</p></div>
                                 </div>
                                 <div className="flex items-center gap-4"><span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Curând</span><Switch checked={false} onChange={() => {}} /></div>
                             </div>
                         </div>
                    )}

                    {activeTab === 'vacations' && <VacationsTab />}

                    {activeTab === 'subscriptions' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
                                <div><h3 className="text-xl font-bold text-gray-900 dark:text-white">Planuri Abonament</h3><p className="text-xs text-gray-500">Sincronizate automat cu Stripe</p></div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={handleUpdatePrices} isLoading={isUpdatingPrices} className="!w-auto h-9 px-4 text-xs gap-2 border-dashed"><RotateCw size={14} className={isUpdatingPrices ? 'animate-spin' : ''}/> Update Prețuri Default</Button>
                                    <Button variant="secondary" onClick={handleStripeSync} isLoading={isSyncingStripe} className="!w-auto h-9 px-4 text-xs gap-2"><RefreshCw size={14} className={isSyncingStripe ? 'animate-spin' : ''}/> Sync Stripe</Button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {subscriptionPlans.filter(p => p.category === 'monthly').map(plan => (
                                    <div key={plan.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${getSubscriptionColor(plan.name)}`}>{plan.name.charAt(0)}</div>
                                            <div><h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">{plan.name} <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">Stripe</span></h4><p className="text-xs text-gray-500">{plan.sessions === 999 ? 'Nelimitat' : `${plan.sessions} Ședințe`} • {plan.price} {plan.currency || 'RON'} • {plan.interval === 'month' ? 'Lunar' : 'Fix'}</p></div>
                                        </div>
                                        <div className="flex items-center gap-3"><Badge color="bg-green-100 text-green-700">Activ</Badge><button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
