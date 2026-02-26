
import React, { useState } from 'react';
import { MessageCircle, Bell, FileText, Workflow, Megaphone, Edit3, CheckCircle, Info, AlertTriangle, CreditCard, Clock, XCircle, ArrowRightLeft, MapPin, Coffee, Zap } from 'lucide-react';
import { MOCK_TEMPLATES, MOCK_AUTOMATIONS, MOCK_BROADCASTS, MOCK_NOTIFICATIONS_HISTORY } from '../../constants';
import { MessagesModule } from './MessagesModule';
import { Button, Badge, Switch } from '../../components/UIComponents';
import { NotificationCategory } from '../../types';

interface CommunicationsViewProps {
    onNavigateToStudent: (id: string) => void;
    initialConversationId?: string | null;
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ onNavigateToStudent, initialConversationId }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications' | 'templates' | 'automations' | 'broadcasts'>('messages');

  const getNotifIcon = (category: NotificationCategory) => {
      switch(category) {
          case 'payment_upcoming':
          case 'payment_success': return <CreditCard size={18} />;
          case 'payment_failed': return <AlertTriangle size={18} />;
          case 'reminder_24h':
          case 'reminder_1h': return <Clock size={18} />;
          case 'class_cancelled': return <XCircle size={18} />;
          case 'class_moved': return <ArrowRightLeft size={18} />;
          case 'room_change': return <MapPin size={18} />;
          case 'urgent': return <Megaphone size={18} />;
          case 'policy': return <FileText size={18} />;
          case 'holiday': return <Coffee size={18} />;
          case 'inactivity': return <Zap size={18} />;
          default: return <Bell size={18} />;
      }
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10 h-full flex flex-col">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
          <div>
             <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Mesaje</h1>
             <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Inbox centralizat, notificări și automatizări</p>
          </div>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
             {[
               { id: 'messages', label: 'Mesaje', icon: MessageCircle },
               { id: 'notifications', label: 'Notificări', icon: Bell },
               { id: 'templates', label: 'Template-uri', icon: FileText },
               { id: 'automations', label: 'Automatizări', icon: Workflow },
               { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone }
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
               >
                 <tab.icon size={16} /> <span className="hidden lg:inline">{tab.label}</span>
               </button>
             ))}
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 min-h-0">
          {activeTab === 'messages' && <MessagesModule onNavigateToStudent={onNavigateToStudent} initialConversationId={initialConversationId} />}
          
          {activeTab === 'notifications' && (
             <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Bell size={20} className="text-gray-500" />
                        Notificări Recente
                    </h3>
                    <div className="flex gap-2">
                         <button className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Marchează totul ca citit</button>
                    </div>
                </div>
                
                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {MOCK_NOTIFICATIONS_HISTORY.length > 0 ? MOCK_NOTIFICATIONS_HISTORY.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-xl border flex gap-4 transition-all ${notif.read ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}>
                            {/* Icon based on type */}
                            <div className={`mt-1 p-2 rounded-full shrink-0 ${
                                notif.type === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                notif.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                notif.type === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                                {getNotifIcon(notif.category || 'general')}
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-bold ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notif.title}</h4>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notif.timestamp}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                            </div>
                            
                            {!notif.read && (
                                <div className="shrink-0 pt-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Bell size={48} className="mb-4 opacity-20" />
                            <p>Nu există notificări recente.</p>
                        </div>
                    )}
                </div>
             </div>
          )}

          {activeTab === 'templates' && (
             <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-full">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg text-gray-900 dark:text-white">Template-uri Mesaje</h3>
                   <Button className="w-auto h-9 text-xs px-4">Creează Template</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {MOCK_TEMPLATES.map(t => (
                      <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                         <div className="flex justify-between items-start mb-2">
                            <Badge color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 capitalize">{t.category}</Badge>
                            <button className="text-gray-400 hover:text-gray-600"><Edit3 size={16}/></button>
                         </div>
                         <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t.title}</h4>
                         <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg italic">"{t.content}"</p>
                         <Button variant="secondary" className="w-full h-8 text-xs">Folosește</Button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'automations' && (
             <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-full">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg text-gray-900 dark:text-white">Reguli Automatizare</h3>
                   <Button className="w-auto h-9 text-xs px-4">Regulă Nouă</Button>
                </div>
                <div className="space-y-4">
                   {MOCK_AUTOMATIONS.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                         <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                               <Workflow size={20}/>
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-900 dark:text-white">{rule.name}</h4>
                               <p className="text-xs text-gray-500">Trigger: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{rule.trigger}</span> • Action: {rule.action}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Switch checked={rule.isActive} onChange={() => {}} />
                            <button className="text-gray-400 hover:text-gray-600"><Edit3 size={18}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
          
          {activeTab === 'broadcasts' && (
             <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-full">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg text-gray-900 dark:text-white">Campanii Broadcast</h3>
                   <Button className="w-auto h-9 text-xs px-4 bg-purple-600 hover:bg-purple-700 text-white border-none">Campanie Nouă</Button>
                </div>
                <div className="space-y-4">
                   {MOCK_BROADCASTS.map(b => (
                      <div key={b.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 p-2 rounded-lg">
                               <Megaphone size={20}/>
                            </div>
                            <div>
                               <h4 className="font-bold text-gray-900 dark:text-white">{b.name}</h4>
                               <div className="flex gap-2 mt-1">
                                  <Badge color="bg-gray-100 text-gray-500 text-[10px]">{b.targetSegment}</Badge>
                                  <Badge color="bg-green-100 text-green-600 text-[10px]">{b.channel}</Badge>
                                </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                            <Badge color={b.status === 'sent' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}>{b.status}</Badge>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};
