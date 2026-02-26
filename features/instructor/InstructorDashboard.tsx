
import React, { useState } from 'react';
import { Bell, Calendar, Users, ChevronRight, ChevronLeft, LayoutDashboard, Wallet, QrCode, LogOut, Clock, Menu } from 'lucide-react';
import { UserProfile, DanceClass } from '../../types';
import { Card, Button } from '../../components/UIComponents';
import { InstructorCheckInPage } from './InstructorCheckInPage';
import { GingaLogo } from '../../components/shared/GingaLogo';
import { useData } from '../../contexts/DataContext';
import { InstructorScheduleView, InstructorCheckInList, InstructorFinanceView } from './components/InstructorDashboardWidgets';

interface InstructorDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

type TabType = 'dashboard' | 'schedule' | 'checkin' | 'finance';

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ user, onLogout }) => {
  const { instructors, classes } = useData(); 
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [viewState, setViewState] = useState<{ mode: 'list' | 'class_checkin', class?: DanceClass }>({ mode: 'list' });
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCheckInQr, setActiveCheckInQr] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const userNamePart = (user.name || '').split(' ')[0].toLowerCase();
  
  const currentInstructorProfile = instructors.find(i => (i.name || '').toLowerCase().includes(userNamePart)) || instructors[0];
  
  const instructorClasses = classes.filter(cls => cls.instructors.some(inst => 
      (inst.name || '').toLowerCase().includes((currentInstructorProfile?.name || '').split(' ')[0].toLowerCase())
  ));
  
  const todayClasses = instructorClasses.filter(c => c.date === todayDate || true); // Mock logic for demo

  // Defensive check if profile is loaded
  if (!currentInstructorProfile) return <div>Loading Profile...</div>;

  const stats = {
      todayClasses: todayClasses.length,
      todayStudents: todayClasses.reduce((acc, curr) => acc + (curr.occupancy?.current || 0), 0),
      monthHours: currentInstructorProfile?.contract?.hoursThisMonth || 0,
      estimatedPay: currentInstructorProfile?.contract?.totalToPay || 0,
      hourlyRate: currentInstructorProfile?.contract?.hourlyRate || 0
  };

  const handleStartCheckIn = (cls: DanceClass) => setViewState({ mode: 'class_checkin', class: cls });
  const handleBackToDashboard = () => setViewState({ mode: 'list', class: undefined });

  if (viewState.mode === 'class_checkin' && viewState.class) return <InstructorCheckInPage danceClass={viewState.class} onBack={handleBackToDashboard} />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased flex">
        <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex-col h-screen sticky top-0 transition-all duration-300 relative`}>
            <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-9 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm z-50 hover:scale-110 transition-all">{isSidebarCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}</button>
            <div className={`p-8 flex justify-center ${isSidebarCollapsed ? 'px-4' : ''} transition-all`}><GingaLogo size="sm" collapsed={isSidebarCollapsed} /></div>
            <nav className="px-4 space-y-2 flex-1">
                {[{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'schedule', label: 'Orarul Meu', icon: Calendar }, { id: 'checkin', label: 'Check-in Desk', icon: QrCode }, { id: 'finance', label: 'Finanțe & Plăți', icon: Wallet }].map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-gray-50 text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'} ${isSidebarCollapsed ? 'justify-center px-2' : ''}`} title={isSidebarCollapsed ? item.label : ''}><item.icon size={18} className={activeTab === item.id ? 'text-[#E53935]' : ''}/>{!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}</button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto"><div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}><img src={currentInstructorProfile.avatarUrl} className="w-10 h-10 rounded-full bg-gray-100 object-cover border border-gray-200" />{!isSidebarCollapsed && <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{currentInstructorProfile.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Instructor</p></div>}{!isSidebarCollapsed && <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-lg"><LogOut size={18} /></button>}</div></div>
        </aside>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-16 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2"><h1 className="text-xl font-black text-gray-900 tracking-tight">ginga<span className="text-[#E53935]">.</span></h1><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">Instructor</span></div>
                <div className="flex items-center gap-3"><button className="relative p-2 rounded-full hover:bg-gray-50 transition-colors"><Bell size={20} className="text-gray-600" /><span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#E53935] rounded-full ring-2 ring-white"></span></button><img onClick={onLogout} src={currentInstructorProfile.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200 object-cover border border-gray-100" /></div>
            </header>
            
            <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 pb-24 md:pb-8">
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Salut, {(currentInstructorProfile.name || '').split(' ')[0]} 👋</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-white border-none shadow-sm p-5 flex flex-col justify-between h-28 relative overflow-hidden"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Calendar size={20} /></div><div><p className="text-2xl font-black text-gray-900">{stats.todayClasses}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cursuri azi</p></div></Card>
                                <Card className="bg-white border-none shadow-sm p-5 flex flex-col justify-between h-28 relative overflow-hidden"><div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2"><Users size={20} /></div><div><p className="text-2xl font-black text-gray-900">{stats.todayStudents}</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prezențe azi</p></div></Card>
                                <Card className="bg-white border-none shadow-sm p-5 flex flex-col justify-between h-28 relative overflow-hidden hidden md:flex"><div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2"><Clock size={20} /></div><div><p className="text-2xl font-black text-gray-900">{stats.monthHours}h</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ore Luna Asta</p></div></Card>
                                <Card className="bg-white border-none shadow-sm p-5 flex flex-col justify-between h-28 relative overflow-hidden hidden md:flex"><div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2"><Wallet size={20} /></div><div><p className="text-2xl font-black text-gray-900">{stats.estimatedPay} RON</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimat</p></div></Card>
                            </div>
                        </div>
                        <section className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Programul tău azi</h3>
                            <InstructorCheckInList classes={todayClasses} onStartCheckIn={handleStartCheckIn} onShowQr={(id) => setActiveCheckInQr(id)} />
                        </section>
                    </div>
                )}
                {activeTab === 'schedule' && <InstructorScheduleView profile={currentInstructorProfile} />}
                {activeTab === 'checkin' && <InstructorCheckInList classes={todayClasses} onStartCheckIn={handleStartCheckIn} onShowQr={(id) => setActiveCheckInQr(id)} />}
                {activeTab === 'finance' && <InstructorFinanceView stats={stats} />}
            </main>
        </div>

        {activeCheckInQr && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                <div className="w-full max-w-sm text-center bg-white p-8 rounded-[3rem] shadow-2xl mb-8 relative overflow-hidden"><div className="absolute top-0 left-0 right-0 h-2 bg-[#34A853]"></div><QrCode size={240} className="mx-auto text-gray-900" /></div>
                <Button onClick={() => setActiveCheckInQr(null)} className="bg-white text-gray-900 hover:bg-gray-100 rounded-2xl h-12">Închide</Button>
            </div>
        )}
    </div>
  );
};
