
import React from 'react';
import { LayoutDashboard, Users, CalendarDays, Menu, Target } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onToggleSidebar: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, onToggleSidebar }) => {
  // Requested order: Menu (handled separately), Membri, Home, Orar, Leaduri
  const items = [
    { id: 'members', label: 'Membri', icon: Users },
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'schedule', label: 'Orar', icon: CalendarDays },
    { id: 'leads', label: 'Leaduri', icon: Target },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center z-40 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* 1. Menu Button (First) */}
      <button 
        onClick={onToggleSidebar} 
        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Menu size={24} strokeWidth={2} />
        <span className="text-[10px] font-bold">Meniu</span>
      </button>

      {/* 2-5. Navigation Items */}
      {items.map(item => (
        <button 
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-bold">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
