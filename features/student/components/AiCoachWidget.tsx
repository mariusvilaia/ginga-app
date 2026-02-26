import React, { useState } from 'react';
import { Sparkles, Send, Bot, MessageSquare } from 'lucide-react';
import { getDanceCoachAdvice } from '../../../services/geminiService';
import { UserProfile, SkillLevel } from '../../../types';

export const AiCoachWidget = ({ user }: { user: UserProfile }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
        const result = await getDanceCoachAdvice(query, {
            style: user.favoriteStyle,
            level: user.enrollments[0]?.level || SkillLevel.BEGINNER,
            goal: user.goal
        });
        setResponse(result);
    } catch (e) {
        setResponse("A apărut o eroare de conexiune. Încearcă din nou.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden group border border-indigo-700/50">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                    <Sparkles className="text-yellow-300" size={20} />
                </div>
                <div>
                    <h3 className="font-black text-lg tracking-tight leading-none">Ginga AI Coach</h3>
                    <p className="text-[10px] text-indigo-200 font-medium mt-0.5">Sfaturi personalizate pentru {user.favoriteStyle}</p>
                </div>
            </div>

            {!response ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-2 bg-white/10 p-1 rounded-2xl border border-white/10 focus-within:bg-white/20 focus-within:border-white/30 transition-all">
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                            placeholder="Ex: Cum îmi îmbunătățesc postura?"
                            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-indigo-300 outline-none w-full"
                        />
                        <button 
                            onClick={handleAsk}
                            disabled={isLoading || !query.trim()}
                            className="bg-white text-indigo-900 p-3 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 font-bold"
                        >
                            {isLoading ? <span className="animate-spin block w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full"></span> : <Send size={18} />}
                        </button>
                    </div>
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => setQuery("Cum să nu mai amețesc la piruete?")} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap transition-colors">🌪️ Piruete</button>
                        <button onClick={() => setQuery("Sfaturi pentru musicalitate")} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap transition-colors">🎵 Musicalitate</button>
                        <button onClick={() => setQuery("Cum conduc mai bine partenera?")} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap transition-colors">🤝 Leading</button>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-sm leading-relaxed mb-4 shadow-inner relative backdrop-blur-sm">
                        <Bot size={16} className="absolute top-4 left-4 text-indigo-300 opacity-50" />
                        <div className="pl-6 text-indigo-50">
                            {response}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            onClick={() => { setResponse(''); setQuery(''); }}
                            className="text-xs font-bold text-indigo-200 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <MessageSquare size={12} /> Altă întrebare
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};