
import React from 'react';
import { LayoutGrid, Calendar, CreditCard, User, ChevronRight, ChevronLeft, LogOut, QrCode, Globe } from 'lucide-react';
import { GingaLogo } from '../../../components/shared/GingaLogo';
import { UserProfile } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface StudentSidebarProps {
    isCollapsed: boolean;
    setCollapsed: (v: boolean) => void;
    activeTab: string;
    setActiveTab: (t: any) => void;
    user: UserProfile;
    onLogout: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ isCollapsed, setCollapsed, activeTab, setActiveTab, user, onLogout }) => {
    const { language, setLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'ro' ? 'en' : 'ro');
    };

    return (
        <aside className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-100 flex-col h-screen sticky top-0 transition-all duration-300 relative`}>
            <button onClick={() => setCollapsed(!isCollapsed)} className="absolute -right-3 top-9 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm z-50 hover:scale-110 transition-all">
                {isCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
            </button>
            <div className={`p-8 flex justify-center ${isCollapsed ? 'px-4' : ''} transition-all`}>
                <GingaLogo size="sm" collapsed={isCollapsed} />
            </div>
            <nav className="px-4 space-y-2 flex-1">
                {[
                    { id: 'home', label: 'Dashboard', icon: LayoutGrid },
                    { id: 'checkin', label: 'Check-in', icon: QrCode },
                    { id: 'schedule', label: 'Orar Cursuri', icon: Calendar },
                    { id: 'membership', label: 'Abonament', icon: CreditCard },
                    { id: 'profile', label: 'Profilul Meu', icon: User },
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        title={isCollapsed ? item.label : ''}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === item.id ? 'bg-gray-50 text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                    >
                        <item.icon size={18} className={activeTab === item.id ? 'text-[#E53935]' : ''}/>
                        {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto">
                <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                    <button 
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        title={t(language === 'ro' ? 'lang.en' : 'lang.ro')}
                    >
                        <Globe size={16} />
                        {!isCollapsed && <span>{language.toUpperCase()}</span>}
                    </button>
                </div>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-gray-100 object-cover border border-gray-200" alt={user.name} />
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Student</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 rounded-lg">
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
};
