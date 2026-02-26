
import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Wallet, Calendar, Bell, PartyPopper, ShieldCheck, ChevronRight, Mail, Smartphone,
  XCircle, RefreshCw, UserCheck, CheckCircle2, FileText, AlertCircle, Zap, GraduationCap, Megaphone,
  User, Camera, Save, Loader2
} from 'lucide-react';
import { NotificationSettings, ChannelPreferences, UserProfile } from '../../types';
import { Switch, Button, Input } from '../../components/UIComponents';

interface NotificationSettingsPageProps {
  initialSettings: NotificationSettings;
  user: UserProfile;
  onBack: () => void;
  onUpdate: (settings: NotificationSettings) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

// Map settings keys to categories for UI grouping
const NOTIFICATION_CATEGORIES = [
  {
    id: 'account',
    title: 'Activitate Cont',
    desc: 'Plăți, confirmări abonament și facturi.',
    icon: Wallet,
    color: 'text-blue-600 bg-blue-50',
    explanation: 'Alerte critice legate de situația financiară a contului tău. Recomandăm să le păstrezi active pentru a evita întreruperea serviciilor.',
    settings: [
        { 
          key: 'account_payments', 
          label: 'Confirmări Plată', 
          desc: 'Când o plată este procesată cu succes.', 
          allowed: ['push', 'email'],
          itemIcon: CheckCircle2,
          itemColor: 'text-green-600 bg-green-50'
        },
        { 
          key: 'account_invoices', 
          label: 'Emitere Factură', 
          desc: 'Alertă când se emite o factură nouă.', 
          allowed: ['email'],
          itemIcon: FileText,
          itemColor: 'text-blue-600 bg-blue-50'
        },
        { 
          key: 'account_subscription', 
          label: 'Status Abonament', 
          desc: 'Avertizări de expirare sau probleme.', 
          allowed: ['push', 'email'],
          itemIcon: AlertCircle,
          itemColor: 'text-orange-600 bg-orange-50'
        }
    ]
  },
  {
    id: 'security',
    title: 'Securitate',
    desc: 'Login nou, schimbare parolă.',
    icon: ShieldCheck,
    color: 'text-green-600 bg-green-50',
    explanation: 'Te notificăm imediat dacă detectăm activitate suspectă sau logări de pe dispozitive noi.',
    settings: [
        { 
          key: 'security_logins', 
          label: 'Login Nou', 
          desc: 'Conectare de pe un dispozitiv necunoscut.', 
          allowed: ['push', 'email'],
          itemIcon: ShieldCheck,
          itemColor: 'text-emerald-600 bg-emerald-50'
        }
    ]
  },
  {
    id: 'schedule',
    title: 'Orar & Modificări',
    desc: 'Anulări cursuri, schimbări de sală.',
    icon: Calendar,
    color: 'text-purple-600 bg-purple-50',
    explanation: 'Fii la curent cu orice modificare de ultim moment a orarului. Astfel eviți drumurile inutile la sală.',
    settings: [
        { 
          key: 'schedule_cancellations', 
          label: 'Curs Anulat', 
          desc: 'Notificare urgentă dacă un curs se anulează.', 
          allowed: ['push'],
          itemIcon: XCircle,
          itemColor: 'text-red-600 bg-red-50'
        },
        { 
          key: 'schedule_changes', 
          label: 'Schimbare Oră/Sală', 
          desc: 'Modificări de logistică sau program.', 
          allowed: ['push'],
          itemIcon: RefreshCw,
          itemColor: 'text-amber-600 bg-amber-50'
        },
        { 
          key: 'schedule_substitutions', 
          label: 'Instructor Suplinitor', 
          desc: 'Află dacă instructorul tău este înlocuit.', 
          allowed: ['push'],
          itemIcon: UserCheck,
          itemColor: 'text-blue-600 bg-blue-50'
        }
    ]
  },
  {
    id: 'reminders',
    title: 'Remindere',
    desc: 'Notificări înainte de curs.',
    icon: Bell,
    color: 'text-indigo-600 bg-indigo-50',
    explanation: 'Primești un reminder prietenos înainte de fiecare clasă programată pentru a nu întârzia.',
    settings: [
        { 
          key: 'reminders_24h', 
          label: 'Cu 24h înainte', 
          desc: 'Reminder general cu o zi înainte.', 
          allowed: ['push'],
          itemIcon: Calendar,
          itemColor: 'text-indigo-600 bg-indigo-50'
        },
        { 
          key: 'reminders_1h', 
          label: 'Cu 1h înainte', 
          desc: 'Reminder scurt chiar înainte de plecare.', 
          allowed: ['push'],
          itemIcon: Zap,
          itemColor: 'text-indigo-600 bg-indigo-50'
        }
    ]
  },
  {
    id: 'news',
    title: 'Noutăți & Comunitate',
    desc: 'Evenimente, workshop-uri, party-uri.',
    icon: PartyPopper,
    color: 'text-orange-600 bg-orange-50',
    explanation: 'Rămâi conectat cu comunitatea Ginga. Află primul despre evenimente speciale și oportunități de socializare.',
    settings: [
        { 
          key: 'news_events', 
          label: 'Party-uri & Evenimente', 
          desc: 'Invitații la serile sociale și festivaluri.', 
          allowed: ['push', 'email'],
          itemIcon: PartyPopper,
          itemColor: 'text-pink-600 bg-pink-50'
        },
        { 
          key: 'news_workshops', 
          label: 'Workshop-uri Noi', 
          desc: 'Anunțuri despre seminarii speciale.', 
          allowed: ['push', 'email'],
          itemIcon: GraduationCap,
          itemColor: 'text-yellow-600 bg-yellow-50'
        },
        { 
          key: 'news_general', 
          label: 'Anunțuri Generale', 
          desc: 'Știri administrative sau regulament.', 
          allowed: ['email'],
          itemIcon: Megaphone,
          itemColor: 'text-gray-600 bg-gray-50'
        }
    ]
  }
];

export const NotificationSettingsPage: React.FC<NotificationSettingsPageProps> = ({ 
  initialSettings, 
  user,
  onBack,
  onUpdate,
  onUpdateProfile
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [newAvatar, setNewAvatar] = useState(user.avatarUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChannelToggle = (settingKey: keyof NotificationSettings, channel: keyof ChannelPreferences) => {
    setSettings(prev => {
        const currentPrefs = prev[settingKey];
        const newPrefs = { ...currentPrefs, [channel]: !currentPrefs[channel] };
        const newSettings = { ...prev, [settingKey]: newPrefs };
        onUpdate(newSettings);
        return newSettings;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert("Imaginea este prea mare (Max 5MB).");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewAvatar(reader.result as string);
              setIsEditing(true);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = async () => {
      if (!newName.trim()) return;
      setIsSavingProfile(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onUpdateProfile({ name: newName, avatarUrl: newAvatar });
      setIsSavingProfile(false);
      setIsEditing(false);
  };

  const selectedCategory = NOTIFICATION_CATEGORIES.find(c => c.id === selectedCategoryId);

  // --- SUB-PAGE RENDERER ---
  if (selectedCategory) {
      return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-20 flex items-center gap-4">
                <button 
                    onClick={() => setSelectedCategoryId(null)}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-black text-gray-900">{selectedCategory.title}</h1>
            </div>

            <main className="p-6 max-w-2xl mx-auto w-full space-y-6">
                
                {/* Hero / Explanation Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-2xl ${selectedCategory.color}`}>
                            <selectedCategory.icon size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-lg text-gray-900">De ce e important?</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Configurează canalele</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {selectedCategory.explanation}
                    </p>
                </div>

                {/* Toggles List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                    {selectedCategory.settings.map((item) => (
                        <div key={item.key} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-4 flex-1">
                                {item.itemIcon && (
                                  <div className={`p-2.5 rounded-xl shrink-0 ${item.itemColor}`}>
                                    <item.itemIcon size={20} />
                                  </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">{item.label}</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-snug">{item.desc}</p>
                                </div>
                            </div>
                            
                            {/* Channel Selectors */}
                            <div className="flex gap-2 shrink-0 self-end md:self-auto">
                                {item.allowed.includes('push') && (
                                    <button 
                                        onClick={() => handleChannelToggle(item.key as keyof NotificationSettings, 'push')}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                                            settings[item.key as keyof NotificationSettings].push 
                                            ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                                            : 'bg-white text-gray-300 border-gray-200 hover:border-gray-300'
                                        }`}
                                        title="Notificare Push"
                                    >
                                        <Smartphone size={18} strokeWidth={2.5} />
                                    </button>
                                )}
                                
                                {item.allowed.includes('email') && (
                                    <button 
                                        onClick={() => handleChannelToggle(item.key as keyof NotificationSettings, 'email')}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                                            settings[item.key as keyof NotificationSettings].email
                                            ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm' 
                                            : 'bg-white text-gray-300 border-gray-200 hover:border-gray-300'
                                        }`}
                                        title="Email"
                                    >
                                        <Mail size={18} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-6 mt-4 opacity-50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><Smartphone size={12}/> Push</div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase"><Mail size={12}/> Email</div>
                </div>

            </main>
        </div>
      );
  }

  // --- MAIN LIST RENDERER ---
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-20 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-900">Setări</h1>
      </div>

      <main className="p-6 max-w-2xl mx-auto w-full space-y-8">
        
        {/* PROFILE EDIT SECTION */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Profilul Meu</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img 
                        src={newAvatar || 'https://via.placeholder.com/150'} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-gray-100" 
                        alt="Profile"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white"/>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
                
                <div className="flex-1 w-full space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nume Complet</label>
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={(e) => { setNewName(e.target.value); setIsEditing(true); }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-900"
                        />
                    </div>
                    {isEditing && (
                        <Button 
                            onClick={handleSaveProfile} 
                            isLoading={isSavingProfile}
                            className="w-full bg-gray-900 text-white hover:bg-black h-10 text-xs"
                        >
                            {isSavingProfile ? 'Se salvează...' : 'Salvează Modificările'}
                        </Button>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Notificări</h3>
            </div>
            {NOTIFICATION_CATEGORIES.map((cat, idx) => (
                <button 
                    key={cat.id} 
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full p-6 flex items-center gap-4 hover:bg-gray-50/80 transition-all text-left group ${idx !== NOTIFICATION_CATEGORIES.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                    <div className={`p-3 rounded-xl shrink-0 ${cat.color} group-hover:scale-110 transition-transform duration-300`}>
                        <cat.icon size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{cat.title}</h3>
                        <p className="text-xs text-gray-500 font-medium truncate">
                            {cat.desc}
                        </p>
                    </div>

                    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
            ))}
        </div>

        <div className="text-center">
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Poți modifica aceste setări oricând. Modificările se aplică instantaneu pe toate dispozitivele tale conectate la contul Ginga.
            </p>
        </div>

      </main>
    </div>
  );
};
