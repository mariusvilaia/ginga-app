
import React, { useState, useEffect } from 'react';
import { Search, Phone, MoreVertical, Paperclip, Image as ImageIcon, SendHorizontal, MessageCircle, StickyNote, Check, CheckCheck, Wallet, Calendar, AlertTriangle, Shield } from 'lucide-react';
import { MOCK_CONVERSATIONS, MOCK_ADMIN_STUDENTS } from '../../constants';
import { Button } from '../../components/UIComponents';

interface MessagesModuleProps {
    onNavigateToStudent: (id: string) => void;
    initialConversationId?: string | null;
}

interface MessageItem {
    id: string;
    text: string;
    sender: 'me' | 'them';
    time: string;
    channel: 'sms' | 'whatsapp' | 'app';
    status: 'sent' | 'delivered' | 'read';
}

export const MessagesModule: React.FC<MessagesModuleProps> = ({ onNavigateToStudent, initialConversationId }) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || MOCK_CONVERSATIONS[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'direct'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [inputMode, setInputMode] = useState<'chat' | 'note'>('chat');
  const [messageText, setMessageText] = useState('');
  
  // Sync prop change
  useEffect(() => {
      if (initialConversationId) {
          setActiveConversationId(initialConversationId);
      }
  }, [initialConversationId]);

  // Mock Messages State - RESTORED FROM SCREENSHOT
  const [messages, setMessages] = useState<MessageItem[]>([
      { id: '1', text: 'Bună ziua! Vroiam să întreb dacă mai sunt locuri la workshop-ul de weekend?', sender: 'them', time: 'Ieri 14:20', channel: 'sms', status: 'read' },
      { id: '2', text: 'Bună Andrei! Da, mai avem 3 locuri disponibile pentru workshop-ul de Bachata.', sender: 'me', time: 'Ieri 14:35', channel: 'app', status: 'read' },
      { id: '3', text: 'Super! Mă pot înscrie direct din aplicație?', sender: 'them', time: 'Ieri 14:36', channel: 'whatsapp', status: 'read' },
      { id: '4', text: 'Da, secțiunea "Evenimente". Dacă ai probleme, te pot ajuta eu manual.', sender: 'me', time: 'Ieri 14:37', channel: 'whatsapp', status: 'read' },
      { id: '5', text: 'Am reușit! Mulțumesc mult.', sender: 'them', time: 'Ieri 14:45', channel: 'whatsapp', status: 'read' },
      { id: '6', text: 'Notă: Studentul a achitat avansul de 50 RON cash la recepție.', sender: 'me', time: 'Ieri 18:00', channel: 'app', status: 'read' }, 
      { id: '7', text: 'Salut! Mai este valabil abonamentul meu curent pentru săptămâna viitoare?', sender: 'them', time: '09:00', channel: 'whatsapp', status: 'read' },
  ]);

  const activeConversation = MOCK_CONVERSATIONS.find(c => c.id === activeConversationId);
  const relatedStudent = activeConversation?.relatedStudentId ? MOCK_ADMIN_STUDENTS.find(s => s.id === activeConversation?.relatedStudentId) : null;

  const handleSendMessage = () => {
      if (!messageText.trim()) return;
      const newMessage: MessageItem = {
          id: Date.now().toString(),
          text: inputMode === 'note' ? `Notă: ${messageText}` : messageText,
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'app', 
          status: 'sent'
      };
      setMessages([...messages, newMessage]);
      setMessageText('');
  };

  const handleQuickReply = (text: string) => {
      setMessageText(text);
  };

  const filteredConversations = MOCK_CONVERSATIONS.filter(c => {
      if (showUnreadOnly && c.unreadCount === 0) return false;
      if (activeTab === 'groups' && c.type !== 'group') return false;
      if (activeTab === 'direct' && c.type === 'group') return false;
      return true;
  });

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden gap-0">
      
      {/* 1. LEFT SIDEBAR: CONVERSATION LIST */}
      <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header & Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
           <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Caută..." className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold outline-none focus:border-blue-500 transition-all" />
           </div>
           
           <div className="flex gap-1">
             {['all', 'groups', 'direct'].map(filter => (
               <button 
                 key={filter} 
                 onClick={() => setActiveTab(filter as any)}
                 className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${activeTab === filter ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
               >
                 {filter === 'all' ? 'Toate' : filter === 'groups' ? 'Grupe' : 'Individual'}
               </button>
             ))}
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
           {filteredConversations.map(conv => {
             const isSelected = activeConversationId === conv.id;
             return (
               <div 
                 key={conv.id} 
                 onClick={() => setActiveConversationId(conv.id)}
                 className={`p-4 border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all relative group ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
               >
                 {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                 
                 <div className="flex gap-3">
                   <div className="relative shrink-0">
                     <img src={conv.avatarUrl} className={`w-12 h-12 object-cover border border-gray-100 dark:border-gray-700 ${conv.type === 'group' ? 'rounded-xl' : 'rounded-full'}`} />
                     {conv.isOnline && conv.type !== 'group' && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>}
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <div className="flex justify-between items-center mb-1">
                       <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{conv.name}</h4>
                       <span className={`text-[10px] ${conv.unreadCount > 0 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{conv.lastMessageTime}</span>
                     </div>
                     <div className="flex justify-between items-start">
                        <p className={`text-xs truncate max-w-[80%] ${conv.unreadCount > 0 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {conv.unreadCount}
                            </span>
                        )}
                     </div>
                     {conv.tags && (
                         <div className="flex gap-1 mt-2">
                             {conv.tags.map(tag => (
                                 <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase tracking-wide">
                                     {tag}
                                 </span>
                             ))}
                         </div>
                     )}
                   </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {/* 2. CENTER: CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden relative">
         {activeConversation ? (
           <>
             {/* Chat Header */}
             <div className="h-16 px-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => relatedStudent && onNavigateToStudent(relatedStudent.id)}>
                   <img src={activeConversation.avatarUrl} className={`w-10 h-10 ${activeConversation.type === 'group' ? 'rounded-xl' : 'rounded-full'}`} />
                   <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">{activeConversation.name}</h3>
                      {activeConversation.type === 'group' ? (
                          <p className="text-xs text-gray-500">24 Membri • 2 Online</p>
                      ) : (
                          <p className="text-xs text-gray-500 font-medium">Click pentru profil</p>
                      )}
                   </div>
                </div>
                <div className="flex gap-2 text-gray-400">
                   <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><Phone size={20} /></button>
                   <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
                <div className="flex justify-center mb-4">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full uppercase tracking-wider">Astăzi</span>
                </div>
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                        {msg.sender === 'them' && <img src={activeConversation.avatarUrl} className="w-8 h-8 rounded-full mt-1" />}
                        
                        <div className={`max-w-[70%] flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                            {msg.sender === 'them' && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 uppercase ${
                                    msg.channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                                    msg.channel === 'sms' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {msg.channel}
                                </span>
                            )}

                            {msg.text.includes('Notă:') || msg.text.includes('Notă Internă') ? (
                                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-900 shadow-sm w-full text-center my-2 max-w-md mx-auto">
                                    <p className="text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1"><StickyNote size={12}/> Notă Internă</p>
                                    <p className="text-sm italic">{msg.text.replace(/Notă:|Notă Internă:/g, '').trim()}</p>
                                    <span className="text-[10px] text-yellow-700 mt-1 block">{msg.time}</span>
                                </div>
                            ) : (
                                <>
                                    <div className={`px-4 py-3 rounded-2xl shadow-sm border text-sm leading-relaxed ${
                                        msg.sender === 'me' 
                                        ? 'bg-gray-900 text-white rounded-tr-none border-transparent'
                                        : 'bg-white border-gray-100 text-gray-900 rounded-tl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 mr-1">
                                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                                        {msg.sender === 'me' && (
                                            <CheckCheck size={12} className={msg.status === 'read' ? 'text-blue-500' : 'text-gray-300'}/>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
             </div>

             {/* Smart Input Area */}
             <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                {/* Quick Replies Row */}
                <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                    <button onClick={() => handleQuickReply('Link Plată')} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600 transition-colors whitespace-nowrap">Link Plată</button>
                    <button onClick={() => handleQuickReply('Reminder Clasǎ')} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600 transition-colors whitespace-nowrap">Reminder Clasǎ</button>
                    <button onClick={() => handleQuickReply('Oferǎ Recuperare')} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600 transition-colors whitespace-nowrap">Oferǎ Recuperare</button>
                </div>

                <div className="flex items-end gap-3 p-2 rounded-2xl border border-gray-200 bg-white">
                   <div className="flex gap-1 pb-2 pl-1 text-gray-400">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Paperclip size={18}/></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg"><ImageIcon size={18}/></button>
                   </div>
                   <textarea 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Scrie un mesaj..."
                      className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-32 py-2 placeholder-gray-400"
                      rows={1}
                   />
                   <div className="flex gap-2 pb-1 pr-1">
                      <button onClick={handleSendMessage} className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm">
                          {activeConversation.type === 'group' ? 'Send' : 'Reply'}
                      </button>
                   </div>
                </div>
             </div>
           </>
         ) : (
           <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={48} className="mb-4 opacity-20" />
              <p>Selectează o conversație</p>
           </div>
         )}
      </div>
    </div>
  );
};
