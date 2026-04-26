
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Search, Sun, Moon, Bell, Settings, LogOut, X, User, Layers, GraduationCap, ListTodo, MessageSquare, Command, ArrowRight, Menu, Target, CheckCircle2, CreditCard } from 'lucide-react';
import { UserProfile, AdminTask, GlobalSearchResult } from '../../../types';
import { MOCK_NOTIFICATIONS_HISTORY } from '../../../constants';
import { useGlobalSearch } from '../../../hooks/useGlobalSearch';
import { getHighlightedText } from '../../../services/searchService';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onNavigateToSettings: () => void;
  user: UserProfile;
  onLogout: () => void;
  tasks?: AdminTask[];
  onNavigate?: (tab: string, id?: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab,
  isDarkMode, 
  toggleDarkMode,
  onNavigateToSettings,
  user,
  onLogout,
  onNavigate,
  onToggleMobileMenu
}) => {
  const { query, setQuery, results, totalResults } = useGlobalSearch();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
      if (!results) return [];
      return [
          ...results.student,
          ...results.lead,
          ...results.group,
          ...results.instructor,
          ...results.task,
          ...results.message
      ];
  }, [results]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K to focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchFocused(true);
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        if (isSearchFocused) {
            inputRef.current?.blur();
            setIsSearchFocused(false);
        }
        setIsNotificationsOpen(false);
      }

      // Navigation when focused
      if (isSearchFocused && flatResults.length > 0) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex(prev => (prev + 1) % flatResults.length);
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
          } else if (e.key === 'Enter') {
              e.preventDefault();
              const selected = flatResults[selectedIndex];
              if (selected) handleResultClick(selected);
          }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused, flatResults, selectedIndex]);

  // Reset index on query change
  useEffect(() => {
      setSelectedIndex(0);
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
              setIsSearchFocused(false);
          }
          if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
              setIsNotificationsOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: GlobalSearchResult) => {
      if (onNavigate) onNavigate(result.route, result.id);
      else setActiveTab(result.route);
      
      setQuery('');
      setIsSearchFocused(false);
  };
  
  const getTitle = () => {
    switch(activeTab) {
      case 'overview': return 'Dashboard';
      case 'members': return 'Membri';
      case 'groups': return 'Grupe';
      case 'attendance': return 'Check-in';
      case 'instructors': return 'Echipa';
      case 'leads': return 'Leaduri';
      case 'tasks': return 'Taskuri';
      case 'communications': return 'Mesaje';
      case 'schedule': return 'Orar';
      case 'settings': return 'Setări';
      default: return 'Ginga';
    }
  };

  const unreadCount = MOCK_NOTIFICATIONS_HISTORY.filter(n => !n.read).length;

  const renderResultSection = (title: string, items: GlobalSearchResult[], startIndex: number, icon: React.ReactNode) => {
      if (items.length === 0) return null;
      return (
          <div className="mb-2">
              <div className="px-4 py-2 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-gray-800/50 mx-2 rounded-lg mb-1">
                  <span className="flex items-center gap-2">{icon} {title}</span>
                  <span className="bg-gray-200 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-300">{items.length}</span>
              </div>
              {items.map((result, idx) => {
                  const globalIdx = startIndex + idx;
                  const isSelected = globalIdx === selectedIndex;
                  
                  return (
                    <button 
                        key={result.id} 
                        onClick={() => handleResultClick(result)} 
                        className={`w-full flex items-center justify-between p-3 transition-colors group text-left px-4 mx-2 rounded-xl w-[calc(100%-16px)] ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-100 dark:ring-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {result.avatarUrl ? (
                                <img src={result.avatarUrl} alt={result.title} className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-gray-700 bg-gray-100 shrink-0"/>
                            ) : (
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 group-hover:bg-white dark:group-hover:bg-gray-900 transition-colors shrink-0">
                                    {icon}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p 
                                    className="text-sm font-bold text-gray-900 dark:text-white truncate"
                                    dangerouslySetInnerHTML={{ __html: getHighlightedText(result.title, query) }} 
                                />
                                <p className="text-xs text-gray-500 font-medium truncate">{result.subtitle}</p>
                            </div>
                        </div>
                        {isSelected && <ArrowRight size={16} className="text-blue-500" />}
                    </button>
                  );
              })}
          </div>
      );
  };

  return (
    <header className="h-16 md:h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 z-30 sticky top-0 transition-colors duration-300 gap-4">
       
       {/* 1. LEFT: TITLE & DATE */}
       <div className="flex items-center gap-4 shrink-0">
         <div className="flex items-center gap-3">
             <button onClick={onToggleMobileMenu} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                 <Menu size={20} />
             </button>
             <div>
               <h1 className="text-lg md:text-xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                 {getTitle()}
               </h1>
               <p className="hidden md:flex text-xs text-gray-400 font-medium items-center gap-1 mt-0.5">
                  {activeTab === 'overview' ? 'Overview complet' : <><Calendar size={12} /> {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</>}
               </p>
             </div>
         </div>
       </div>

       {/* 2. CENTER: GLOBAL SEARCH BAR */}
       <div className="hidden md:flex flex-1 justify-center px-4 md:px-8 z-40" ref={searchContainerRef}>
         <div className="w-full max-w-xl relative group">
            <div className={`
                flex items-center gap-3 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 transition-all duration-200 border-2
                ${isSearchFocused 
                    ? 'bg-white dark:bg-gray-900 border-blue-500 ring-4 ring-blue-500/10 shadow-lg' 
                    : 'border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'}
            `}>
                <Search size={18} className={`transition-colors shrink-0 ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Caută în tot Ginga..." 
                    className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                />
                {query ? (
                    <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors shrink-0">
                        <X size={14} />
                    </button>
                ) : (
                    <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 shrink-0">
                        <Command size={10} /> K
                    </div>
                )}
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {isSearchFocused && query && (
                <div 
                    ref={resultsRef}
                    className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[60] max-h-[70vh] overflow-y-auto no-scrollbar"
                >
                    {totalResults > 0 ? (
                        <div className="py-2">
                            {renderResultSection('Membri', results!.student, 0, <User size={14}/>)}
                            {renderResultSection('Leaduri', results!.lead, results!.student.length, <Target size={14}/>)}
                            {renderResultSection('Grupe', results!.group, results!.student.length + results!.lead.length, <Layers size={14}/>)}
                            {renderResultSection('Instructori', results!.instructor, results!.student.length + results!.lead.length + results!.group.length, <GraduationCap size={14}/>)}
                            {renderResultSection('Taskuri', results!.task, results!.student.length + results!.lead.length + results!.group.length + results!.instructor.length, <ListTodo size={14}/>)}
                            {renderResultSection('Mesaje', results!.message, results!.student.length + results!.lead.length + results!.group.length + results!.instructor.length + results!.task.length, <MessageSquare size={14}/>)}
                            
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 text-center border-t border-gray-100 dark:border-gray-700 mt-2 flex justify-between items-center px-4 text-xs text-gray-400 font-medium">
                                <span><span className="font-bold">↑↓</span> navigare</span>
                                <span><span className="font-bold">Enter</span> selectare</span>
                                <span><span className="font-bold">Esc</span> închidere</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            <Search size={40} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold text-gray-500 mb-1">Niciun rezultat găsit</p>
                            <p className="text-xs">Încearcă alte cuvinte cheie.</p>
                        </div>
                    )}
                </div>
            )}
         </div>
       </div>

       {/* 3. RIGHT: ACTIONS & PROFILE */}
       <div className="flex items-center justify-end gap-3 md:gap-4 shrink-0 relative z-50">
          <button onClick={() => setActiveTab('stripe')} className={`p-2 md:p-2.5 rounded-full border transition-all shrink-0 ${activeTab === 'stripe' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <CreditCard size={20} />
          </button>

         {/* Notifications Dropdown */}
         <div className="relative shrink-0" ref={notificationsRef}>
             <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 md:p-2.5 rounded-full border transition-all ${isNotificationsOpen ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
             >
               <Bell size={20} />
               {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>}
             </button>

             {isNotificationsOpen && (
                 <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                     <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                         <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notificări</h3>
                         <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><CheckCircle2 size={12}/> Mark all read</button>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                         {MOCK_NOTIFICATIONS_HISTORY.slice(0, 3).map(notif => (
                             <div key={notif.id} className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                 <div className="flex justify-between items-start mb-1"><h4 className="text-xs font-bold line-clamp-1">{notif.title}</h4><span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">{notif.timestamp}</span></div>
                                 <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
         </div>
         
         <button onClick={onNavigateToSettings} className="hidden md:flex p-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shrink-0">
            <Settings size={20}/>
         </button>

         <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100 dark:border-gray-800 shrink-0">
            <div className="hidden lg:flex flex-col items-end mr-1">
               <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{user.name}</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{user.role}</p>
            </div>
            <img src={user.avatarUrl} alt="User" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-sm object-cover" />
            <button 
              onClick={onLogout}
              className="hidden md:block p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <LogOut size={18} />
            </button>
         </div>
       </div>
    </header>
  );
};
