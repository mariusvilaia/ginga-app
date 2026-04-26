
import React, { useState, useRef, useEffect } from 'react';
import { 
    ChevronRight, Mail, Phone, Edit2, Camera, Upload, Link as LinkIcon, 
    ArrowLeft, TrendingUp, MessageCircle, SlidersHorizontal, Trash2, Calendar, RefreshCw, Crop, Instagram, Facebook, User
} from 'lucide-react';
import { UserProfile, DanceStyle } from '../../types';
import { MembershipPage } from './MembershipPage';
import { StudentAttendancePage } from './StudentAttendancePage';
import { NotificationSettingsPage } from './NotificationSettingsPage';
import { Button, Modal, Input } from '../../components/UIComponents';
import { getSubscriptionColor } from '../../utils/themeUtils';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { normalizeRoPhone } from '../../utils/phoneUtils';

interface StudentProfilePageProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateSettings: (settings: any) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  initialSection?: 'overview' | 'membership' | 'history' | 'settings';
}

type ProfileTab = 'overview' | 'membership' | 'history' | 'settings';

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ 
    user, 
    onLogout, 
    onUpdateSettings, 
    onUpdateProfile, 
    initialSection = 'overview' 
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialSection as ProfileTab);
  
  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste Image Listener
  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          if (!isEditProfileOpen) return;

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
  }, [isEditProfileOpen]);

  const handleOpenEdit = () => {
      setEditName(user.name);
      setEditNickname(user.nickname || '');
      setEditPhone(user.phone);
      setEditInstagram(user.socialMedia?.instagram || '');
      setEditFacebook(user.socialMedia?.facebook || '');
      setEditAvatarUrl(user.avatarUrl || '');
      setIsEditProfileOpen(true);
  };

  const handleSaveProfile = () => {
      if (editName.trim().length < 2) {
          alert('Numele trebuie să aibă cel puțin 2 caractere.');
          return;
      }
      if (editPhone.trim().length < 10) {
          alert('Numărul de telefon pare invalid.');
          return;
      }

      onUpdateProfile({ 
          name: editName,
          nickname: editNickname,
          phone: normalizeRoPhone(editPhone), 
          avatarUrl: editAvatarUrl,
          socialMedia: {
              instagram: editInstagram,
              facebook: editFacebook
          }
      });
      setIsEditProfileOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCropImageSrc(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
      event.target.value = '';
  };

  const handleCropComplete = (base64: string) => {
      setEditAvatarUrl(base64);
      setCropImageSrc(null);
  };

  const handleWhatsApp = () => {
      const cleanPhone = user.phone.replace(/[^0-9]/g, '');
      const finalPhone = cleanPhone.length === 10 ? `40${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  // Logic for Subscription Visualization
  const daysLeft = user.subscription.expiryDate ? Math.ceil((new Date(user.subscription.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
  
  // Dots Logic Reuse
  const isUnlimited = user.subscription.sessionsTotal > 50;
  const maxDots = 10;
  let ratio = 0;
  let labelLeft = "";

  if (isUnlimited) {
      ratio = Math.max(0, Math.min(1, daysLeft / 30));
      labelLeft = `${Math.max(0, daysLeft)} days left`;
  } else {
      ratio = Math.max(0, Math.min(1, user.subscription.sessionsLeft / user.subscription.sessionsTotal));
      labelLeft = `${user.subscription.sessionsLeft} left`;
  }
  const activeDots = Math.ceil(ratio * maxDots);

  const getBadgeStyle = (type: string | undefined) => {
      if (type?.includes('Gold')) return 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]';
      if (type?.includes('Silver')) return 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
      if (type?.includes('Bronze')) return 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]';
      return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Status Logic
  let statusText = 'EXPIRAT';
  let statusColor = 'text-red-500';
  
  if (user.subscription.active) {
      if (user.subscription.autoPayEnabled === false) {
          statusText = 'ANULAT';
          statusColor = 'text-amber-500';
      } else {
          statusText = 'ACTIV';
          statusColor = 'text-green-600';
      }
  }

  // --- SUB-PAGE RENDERING ---
  if (activeTab === 'membership') {
      return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="mb-6 flex items-center gap-2">
                  <button onClick={() => setActiveTab('overview')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                      <ChevronRight size={20} className="rotate-180 text-gray-500"/>
                  </button>
                  <h2 className="text-2xl font-black text-gray-900">Abonament & Plăți</h2>
              </div>
              <MembershipPage user={user} onBack={() => setActiveTab('overview')} />
          </div>
      );
  }

  if (activeTab === 'history') {
      return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="mb-6 flex items-center gap-2">
                  <button onClick={() => setActiveTab('overview')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                      <ChevronRight size={20} className="rotate-180 text-gray-500"/>
                  </button>
                  <h2 className="text-2xl font-black text-gray-900">Istoric Prezențe</h2>
              </div>
              <StudentAttendancePage user={user} onBack={() => setActiveTab('overview')} />
          </div>
      );
  }

  if (activeTab === 'settings') {
      return (
          <NotificationSettingsPage 
            initialSettings={user.preferences.notificationSettings!} 
            user={user}
            onUpdateProfile={onUpdateProfile}
            onBack={() => setActiveTab('overview')} 
            onUpdate={onUpdateSettings} 
          />
      );
  }

  return (
    <div className="flex flex-col items-start gap-4 w-full h-full animate-in fade-in duration-300 max-w-full overflow-hidden">
      <button onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors">
          <ArrowLeft size={18} /> <span className="font-medium text-sm">Înapoi la listă</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8 w-full">
          
          {/* LEFT: MAIN PROFILE CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 w-full lg:w-[400px] shrink-0 flex flex-col">
              
              {/* Content */}
              <div className="p-8 flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative group cursor-pointer" onClick={handleOpenEdit}>
                      <img 
                          src={user.avatarUrl} 
                          className="w-32 h-32 rounded-full border-[5px] border-white dark:border-gray-900 shadow-sm object-cover bg-white" 
                          alt={user.name} 
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full border-[5px] border-transparent">
                          <Edit2 size={24} className="text-white"/>
                      </div>
                  </div>

                  {/* Name & Contact */}
                  <div className="mt-4 mb-6">
                      <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1">{user.name}</h1>
                      {user.nickname && <p className="text-sm font-bold text-gray-400 mb-1">"{user.nickname}"</p>}
                      <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{user.phone}</p>
                  </div>

                  {/* Subscription Widget (Dots Style) */}
                  <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6 text-left border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border ${getBadgeStyle(user.subscription.type)}`}>
                              {user.subscription.type.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-gray-400">{labelLeft}</span>
                      </div>
                      
                      <div className="flex gap-1.5 justify-center mb-4">
                           {[...Array(maxDots)].map((_, i) => (
                               <div key={i} className={`h-2 flex-1 rounded-full ${i < activeDots ? 'bg-[#34A853]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                           ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status</p>
                              <div className={`flex items-center gap-1 text-xs font-black ${statusColor}`}>
                                  {statusText}
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Expiră</p>
                              <div className="text-xs font-bold text-gray-900 dark:text-white">
                                  {user.subscription.expiryDate}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex w-full gap-3">
                      <Button onClick={handleWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 text-sm font-bold gap-2 shadow-lg shadow-green-100">
                          <MessageCircle size={18} /> WhatsApp
                      </Button>
                      <button 
                          onClick={handleOpenEdit}
                          title="Editează Profil"
                          className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                      >
                          <Edit2 size={18} />
                      </button>
                      <button 
                          onClick={() => alert("Această acțiune nu este disponibilă încă.")}
                          className="w-11 h-11 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                      >
                          <Trash2 size={18} />
                      </button>
                  </div>
              </div>
          </div>

          {/* RIGHT: STATS & INFO */}
          <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {/* KPI Cards */}
                  <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Engagement</p>
                      <div className="flex items-center gap-2">
                          <p className="text-3xl font-black text-green-600">{(user as any).kpi?.engagementScore || 0}</p>
                          <TrendingUp size={18} className="text-green-500"/>
                      </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Retenție</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{(user as any).kpi?.retentionRate || 0}%</p>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Streak</p>
                      <p className="text-3xl font-black text-blue-600">{user.stats.streakWeeks} săpt</p>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Ore</p>
                      <p className="text-3xl font-black text-gray-900 dark:text-white">{user.stats.totalClasses}</p>
                  </div>
              </div>
              
              {/* Empty state for rest of profile content - as requested clean layout */}
              <div className="h-full flex items-center justify-center opacity-0">
                  {/* Content would go here */}
              </div>
          </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Editează Profilul">
          <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Click sau Paste (Ctrl+V) pentru poză">
                      <img 
                        src={editAvatarUrl || 'https://via.placeholder.com/150'} 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-gray-100" 
                        alt="Profile Edit"
                      />
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={24} className="text-white"/>
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect}/>
                  
                  <div className="flex gap-4">
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                          <Upload size={14}/> Schimbă
                      </button>
                      {editAvatarUrl && (
                          <button onClick={() => setCropImageSrc(editAvatarUrl)} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                              <Crop size={14}/> Ajustează
                          </button>
                      )}
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Nume Complet" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ex: Andrei Popescu" />
                      <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Poreclă (Nickname)</label>
                          <div className="relative">
                              <input 
                                  type="text"
                                  value={editNickname} 
                                  onChange={(e) => setEditNickname(e.target.value)} 
                                  placeholder="Ex: J-Lo" 
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-0 focus:bg-white outline-none transition-all font-medium"
                              />
                              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Telefon</label>
                          <div className="relative">
                              <input 
                                  type="text"
                                  value={editPhone} 
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  onBlur={() => setEditPhone(normalizeRoPhone(editPhone))} 
                                  placeholder="07xx xxx xxx" 
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-0 focus:bg-white outline-none transition-all font-medium"
                              />
                              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Email (Read-only)</label>
                          <div className="relative">
                              <input 
                                  type="text"
                                  value={user.email} 
                                  readOnly
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                              />
                              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                      </div>
                  </div>
                  
                  {/* Social Media Inputs */}
                  <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Social Media Links</label>
                      <div className="grid grid-cols-1 gap-3">
                          <div className="relative">
                              <input 
                                  type="text"
                                  value={editInstagram} 
                                  onChange={(e) => setEditInstagram(e.target.value)} 
                                  placeholder="https://instagram.com/username" 
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:border-pink-500 focus:ring-0 focus:bg-white outline-none transition-all font-medium"
                              />
                              <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                          </div>
                          <div className="relative">
                              <input 
                                  type="text"
                                  value={editFacebook} 
                                  onChange={(e) => setEditFacebook(e.target.value)} 
                                  placeholder="https://facebook.com/username" 
                                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-100 bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-0 focus:bg-white outline-none transition-all font-medium"
                              />
                              <Facebook size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" />
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button variant="secondary" onClick={() => setIsEditProfileOpen(false)}>Anulează</Button>
                  <Button onClick={handleSaveProfile}>Salvează Modificările</Button>
              </div>
          </div>
          
          {cropImageSrc && (
              <ImageCropper 
                  src={cropImageSrc} 
                  onCrop={handleCropComplete} 
                  onCancel={() => setCropImageSrc(null)} 
              />
          )}
      </Modal>
    </div>
  );
};
