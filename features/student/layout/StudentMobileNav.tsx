
import React from 'react';
import { Home, Calendar, QrCode, CreditCard, User } from 'lucide-react';

interface StudentMobileNavProps {
    activeTab: string;
    setActiveTab: (t: any) => void;
    onQrClick: () => void;
}

export const StudentMobileNav: React.FC<StudentMobileNavProps> = ({ activeTab, setActiveTab, onQrClick }) => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40 safe-area-pb">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-gray-900' : 'text-gray-400'}`}>
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Acasă</span>
        </button>
        <button onClick={() => setActiveTab('schedule')} className={`flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-gray-900' : 'text-gray-400'}`}>
            <Calendar size={24} strokeWidth={activeTab === 'schedule' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Orar</span>
        </button>
        <div className="relative -top-6">
            <button onClick={onQrClick} className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-gray-900/30 active:scale-95 transition-transform">
                <QrCode size={24} />
            </button>
        </div>
        <button onClick={() => setActiveTab('membership')} className={`flex flex-col items-center gap-1 ${activeTab === 'membership' ? 'text-gray-900' : 'text-gray-400'}`}>
            <CreditCard size={24} strokeWidth={activeTab === 'membership' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Abonament</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400'}`}>
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-[9px] font-bold">Profil</span>
        </button>
    </div>
);
