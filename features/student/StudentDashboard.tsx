
import React, { useState, useMemo } from 'react';
import { Bell, ChevronLeft, Menu } from 'lucide-react';
import { UserProfile, NotificationSettings } from '../../types';
import { MOCK_NOTIFICATIONS_HISTORY } from '../../constants';
import { StudentSchedulePage } from '../students/StudentSchedulePage'; // Corrected import based on file list
import { StudentProfilePage } from './StudentProfilePage';
import { MembershipPage } from './MembershipPage';
import { GingaLogo } from '../../components/shared/GingaLogo';
import { useData } from '../../contexts/DataContext';
import { StudentSidebar } from './layout/StudentSidebar';
import { StudentMobileNav } from './layout/StudentMobileNav';
import { StudentHomeView } from './tabs/StudentHomeView';
import { Button } from '../../components/UIComponents';
import { QrCode } from 'lucide-react';

interface StudentDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  startOnMembership?: boolean;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
}

type TabType = 'home' | 'schedule' | 'membership' | 'profile' | 'notifications' | 'checkin';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user: initialUser, onLogout, startOnMembership = false, onUpdateProfile }) => {
  // CONNECT TO LIVE DATA: Get the latest version of this student from the global state
  // This ensures that if an Admin updates the subscription/groups, the student sees it immediately.
  const { students, instructors } = useData();
  
  const liveUser = useMemo(() => {
      return students.find(s => s.id === initialUser.id) || initialUser;
  }, [students, initialUser]);

  const [activeTab, setActiveTab] = useState<TabType>(startOnMembership ? 'membership' : 'home');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(liveUser.preferences.notificationSettings || {
      account_payments: { push: true, email: true },
      account_invoices: { push: false, email: true },
      account_subscription: { push: true, email: true },
      security_logins: { push: true, email: true },
      schedule_cancellations: { push: true, email: false },
      schedule_changes: { push: true, email: false },
      schedule_substitutions: { push: true, email: false },
      reminders_24h: { push: true, email: false },
      reminders_1h: { push: true, email: false },
      news_events: { push: false, email: true },
      news_workshops: { push: false, email: true },
      news_general: { push: false, email: false }
  });

  const getInstructorAvatar = (inst: { id?: string; name: string; avatarUrl?: string }) => {
      if (inst.id) {
          const match = instructors.find(i => i.id === inst.id);
          if (match) return match.avatarUrl;
      }
      
      const safeInstName = (inst.name || '').toLowerCase();
      if (safeInstName) {
          const matchName = instructors.find(i => (i.name || '').toLowerCase().includes(safeInstName) || safeInstName.includes((i.name || '').toLowerCase()));
          if (matchName) return matchName.avatarUrl;
      }
      return inst.avatarUrl || 'https://via.placeholder.com/150?text=Instr';
  };

  const isStaff = liveUser.subscription.type === 'Staff';
  const expiryDate = new Date(liveUser.subscription.expiryDate);
  const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isExpired = !isStaff && (daysLeft < 0 || !liveUser.subscription.active);
  
  const alerts = [];
  if (!isStaff) {
      if (daysLeft <= 3 && daysLeft >= 0) alerts.push({ type: 'warning', text: `Abonamentul expiră în ${daysLeft} zile!` });
      if (isExpired) alerts.push({ type: 'critical', text: 'Abonament expirat. Reînnoiește pentru acces.' });
  }

  // QR Generation URL
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${liveUser.id}`;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased flex">
        <StudentSidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} activeTab={activeTab} setActiveTab={setActiveTab} user={liveUser} onLogout={onLogout} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 h-16 flex items-center justify-between shrink-0">
                <GingaLogo size="sm" />
                <button onClick={() => setActiveTab('notifications')} className="relative p-2 rounded-full hover:bg-gray-50 transition-colors">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#E53935] rounded-full ring-2 ring-white"></span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 pb-24 md:pb-10">
                <div className="max-w-7xl mx-auto h-full">
                    {activeTab === 'home' && (
                        <StudentHomeView 
                            user={liveUser} 
                            alerts={alerts} 
                            setActiveTab={setActiveTab} 
                            onShowQr={() => setShowQrModal(true)} 
                            getInstructorAvatar={getInstructorAvatar} 
                        />
                    )}
                    {activeTab === 'schedule' && (
                        <StudentSchedulePage 
                            user={liveUser} 
                            onBack={() => setActiveTab('home')} 
                            onNavigateToMembership={() => setActiveTab('membership')} 
                        />
                    )}
                    {activeTab === 'membership' && (
                        <div className="animate-in fade-in slide-in-from-right-8 h-full flex flex-col">
                            <div className="mb-6">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Abonament & Plăți</h1>
                                <p className="text-gray-500 font-medium">Gestionează planul tău și istoricul plăților.</p>
                            </div>
                            <MembershipPage user={liveUser} onBack={() => setActiveTab('home')} />
                        </div>
                    )}
                    {activeTab === 'profile' && (
                        <StudentProfilePage 
                            user={liveUser} 
                            onLogout={onLogout} 
                            onUpdateSettings={setNotifSettings} 
                            onUpdateProfile={onUpdateProfile} 
                        />
                    )}
                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in slide-in-from-right-8 max-w-3xl mx-auto">
                            <div className="mb-6 flex items-center gap-4">
                                <button onClick={() => setActiveTab('home')} className="md:hidden p-2 -ml-2 text-gray-600">
                                    <ChevronLeft size={24}/>
                                </button>
                                <h2 className="text-2xl font-black text-gray-900">Notificări</h2>
                            </div>
                            <div className="space-y-4">
                                {MOCK_NOTIFICATIONS_HISTORY.map(n => (
                                    <div key={n.id} className={`p-4 rounded-2xl border flex gap-4 ${n.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                                        <div className={`mt-1 p-2 rounded-full shrink-0 ${n.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <Bell size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm mb-1">{n.title}</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed mb-2">{n.message}</p>
                                            <span className="text-[10px] text-gray-400 font-bold">{n.timestamp}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'checkin' && (
                        <div className="animate-in fade-in slide-in-from-right-8 h-full flex flex-col items-center justify-center">
                            <div className="w-full max-w-sm text-center">
                                <div className="bg-white p-8 rounded-[3rem] shadow-2xl mb-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-[#34A853]"></div>
                                    <img src={qrImageUrl} alt="Codul meu Ginga" className="mx-auto w-64 h-64" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Cod Intrare Ginga</h2>
                                <p className="text-gray-500 text-sm mb-8">Arată acest cod la camera tabletei de la recepție pentru check-in automat.</p>
                                <Button onClick={() => setActiveTab('home')} className="bg-gray-900 text-white hover:bg-gray-800 rounded-2xl h-12 border-none">Înapoi la Dashboard</Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <StudentMobileNav activeTab={activeTab} setActiveTab={setActiveTab} onQrClick={() => setShowQrModal(true)} />
        </div>

        {showQrModal && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
              <div className="w-full max-w-sm text-center">
                <div className="bg-white p-8 rounded-[3rem] shadow-2xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-[#34A853]"></div>
                    <img src={qrImageUrl} alt="Codul meu Ginga" className="mx-auto w-64 h-64" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Cod Intrare Ginga</h2>
                <p className="text-white/60 text-sm mb-8">Arată acest cod la camera tabletei de la recepție pentru check-in automat.</p>
                <Button onClick={() => setShowQrModal(false)} className="bg-white text-gray-900 hover:bg-gray-100 rounded-2xl h-12 border-none">Închide</Button>
              </div>
            </div>
        )}
    </div>
  );
};
