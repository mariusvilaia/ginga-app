
import React from 'react';
import { 
  LayoutDashboard, Users, Layers, QrCode, UserCog, MessageSquare, CalendarDays, 
  ChevronRight, ChevronLeft, ListTodo, ClipboardCheck, Wallet, LogOut, Gamepad2, ScanFace, X
} from 'lucide-react';
import { GingaLogo } from '../../shared/GingaLogo';
import { TargetIcon } from '../../shared/TargetIcon';
import { UserProfile } from '../../../types';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: UserProfile;
  onLogout: () => void;
  isMobileOpen?: boolean;
  closeMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  toggleCollapse, 
  activeTab, 
  setActiveTab, 
  user,
  onLogout,
  isMobileOpen = false,
  closeMobile
}) => {
  const allItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Membri', icon: Users },
    { id: 'groups', label: 'Grupe', icon: Layers },
    { id: 'schedule', label: 'Orar', icon: CalendarDays },
    { id: 'attendance', label: 'Check-in', icon: QrCode },
    { id: 'instructors', label: 'Instructori', icon: UserCog },
    { id: 'finance', label: 'Finanțe', icon: Wallet },
    { id: 'leads', label: 'Leaduri', icon: TargetIcon },
    { id: 'instructor_attendance', label: 'Pontaj', icon: ClipboardCheck },
    { id: 'tasks', label: 'Taskuri', icon: ListTodo },
    { id: 'communications', label: 'Mesaje', icon: MessageSquare },
    { id: 'games', label: 'Jocuri', icon: Gamepad2 },
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobile}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 
          flex flex-col justify-between shadow-xl transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:shadow-none
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Toggle Button - Desktop Only */}
        <button 
          onClick={toggleCollapse} 
          className="hidden md:flex absolute -right-3 top-9 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shadow-sm z-30 transition-transform hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Close Button - Mobile Only */}
        <button 
          onClick={closeMobile} 
          className="md:hidden absolute right-4 top-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"
        >
          <X size={20} />
        </button>

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          {/* Logo Section */}
          <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'p-4 py-6' : 'p-8'}`}>
            <GingaLogo size="sm" collapsed={isCollapsed && !isMobileOpen} />
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-1 mt-2 mb-4">
            {allItems.map(item => (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobileOpen && closeMobile) closeMobile();
                }}
                title={isCollapsed && !isMobileOpen ? item.label : ''}
                className={`
                  w-full flex items-center gap-3 py-3 rounded-xl transition-all duration-200 font-bold text-sm
                  ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : 'px-4'}
                  ${activeTab === item.id 
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <item.icon size={20} className="shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span className="whitespace-nowrap overflow-hidden transition-all">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 mt-auto">
            <div className={`flex items-center gap-3 ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
                <div className="relative group shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full bg-gray-900 object-cover border border-gray-200 dark:border-gray-700" />
                </div>
                
                {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{user.role}</p>
                    </div>
                )}

                {(!isCollapsed || isMobileOpen) && (
                    <button 
                        onClick={onLogout}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Deconectare"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </div>
      </aside>
    </>
  );
};
