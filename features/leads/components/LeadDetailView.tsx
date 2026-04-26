
import React, { useState, useMemo, useRef } from 'react';
import { 
    ArrowLeft, Edit2, MessageCircle, Trash2, Camera, Upload, 
    Calendar, XCircle, CheckCircle, AlertTriangle, BrainCircuit, 
    Mic, Loader2, Target, StickyNote, Archive, RotateCcw, 
    Phone, Mail, User, ChevronRight, Sparkles, Brain, 
    TrendingUp, Flag, Tag, Briefcase, MapPin, CalendarCheck, Clock, Check, X
} from 'lucide-react';
import { Lead, LeadStage, LeadActivity, StageHistory, DanceStyle, SkillLevel, GroupDetailedProfile, LeadSource } from '../../../types';
import { Button, Modal, Badge } from '../../../components/UIComponents';
import { GroupScheduler } from './GroupScheduler';
import { getLevelBadgeColor } from '../../../utils/themeUtils';

interface LeadDetailViewProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Lead>) => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    groups: GroupDetailedProfile[];
    isRecording?: boolean;
    audioURL?: string | null;
    isAnalyzing?: boolean;
    analysisData?: any;
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onApplyAnalysis?: () => void;
}

export const LeadDetailView: React.FC<LeadDetailViewProps> = ({ 
    lead, onClose, onUpdate, onDelete, onArchive, groups,
    isRecording, audioURL, isAnalyzing, analysisData,
    onStartRecording, onStopRecording, onFileUpload, onApplyAnalysis
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'funnel' | 'timeline'>('general');
    const [newNote, setNewNote] = useState('');
    const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
    const [activityDescriptionDraft, setActivityDescriptionDraft] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const metrics = useMemo(() => {
        // Probability color
        let probColor = 'text-gray-900';
        let probBg = 'bg-gray-50';
        if (lead.probability >= 70) { probColor = 'text-green-600'; probBg = 'bg-green-50'; }
        else if (lead.probability >= 40) { probColor = 'text-blue-600'; probBg = 'bg-blue-50'; }
        else { probColor = 'text-orange-600'; probBg = 'bg-orange-50'; }

        // Stage color
        let statusColor = 'text-gray-600';
        let statusBg = 'bg-gray-100';
        
        switch(lead.stage) {
            case LeadStage.NEW:
                statusColor = 'text-gray-600';
                statusBg = 'bg-gray-100';
                break;
            case LeadStage.SCHEDULED:
                statusColor = 'text-green-600';
                statusBg = 'bg-green-50';
                break;
            case LeadStage.ATTENDED:
                statusColor = 'text-yellow-600';
                statusBg = 'bg-yellow-50';
                break;
            case LeadStage.ENROLLED:
                statusColor = 'text-red-600';
                statusBg = 'bg-red-50';
                break;
            case LeadStage.PAID:
                statusColor = 'text-white';
                statusBg = 'bg-gray-900';
                break;
        }

        return {
            probColor,
            probBg,
            statusColor,
            statusBg
        };
    }, [lead]);

    const handleWhatsApp = () => {
        const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone.length === 10 ? `40${cleanPhone}` : cleanPhone}`, '_blank');
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const updatedNotes = newNote + '\n' + (lead.notes || '');
        
        const newActivity = {
            id: `act_note_${Date.now()}`,
            type: 'note' as const,
            date: new Date().toLocaleString('ro-RO'),
            description: newNote,
            performedBy: 'Utilizator'
        };

        onUpdate(lead.id, { 
            notes: updatedNotes,
            activityLog: [...(lead.activityLog || []), newActivity]
        });
        setNewNote('');
    };

    const handleEditActivity = (activity: any) => {
        setEditingActivityId(activity.id);
        setActivityDescriptionDraft(activity.description);
    };

    const handleSaveActivity = (id: string) => {
        const updatedLog = lead.activityLog?.map(act => 
            act.id === id ? { ...act, description: activityDescriptionDraft } : act
        );
        onUpdate(lead.id, { activityLog: updatedLog });
        setEditingActivityId(null);
    };

    const handleDeleteActivity = (id: string) => {
        if (confirm('Sigur vrei să ștergi această activitate?')) {
            const updatedLog = lead.activityLog?.filter(act => act.id !== id);
            onUpdate(lead.id, { activityLog: updatedLog });
        }
    };

    const STAGE_OPTIONS = Object.values(LeadStage);

    const canTransitionTo = (targetStage: LeadStage) => {
        return true; // Allow any transition
    };

    const [activityType, setActivityType] = useState<LeadActivity['type']>('note');
    const [activityOutcome, setActivityOutcome] = useState('');

    const handleAddActivity = () => {
        if (!newNote.trim()) return;
        
        const newActivity: LeadActivity = {
            id: `act_${Date.now()}`,
            leadId: lead.id,
            type: activityType,
            outcome: activityOutcome,
            content: newNote,
            createdAt: new Date().toISOString()
        };

        onUpdate(lead.id, { 
            activities: [...(lead.activities || []), newActivity]
        });
        setNewNote('');
        setActivityOutcome('');
    };

    const combinedTimeline = useMemo(() => {
        const items: any[] = [];
        
        (lead.activityLog || []).forEach(a => items.push({ ...a, sortDate: new Date(a.date.split(' ')[0].split('.').reverse().join('-') + 'T' + (a.date.split(' ')[1] || '00:00')).getTime(), source: 'legacy' }));
        (lead.activities || []).forEach(a => items.push({ ...a, sortDate: new Date(a.createdAt).getTime(), source: 'new' }));
        (lead.stageHistory || []).forEach(h => items.push({ ...h, sortDate: new Date(h.changedAt).getTime(), source: 'history', type: 'status_change', description: `Stage changed from ${h.fromStage || 'None'} to ${h.toStage}` }));
        
        return items.sort((a, b) => b.sortDate - a.sortDate);
    }, [lead.activityLog, lead.activities, lead.stageHistory]);

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 w-fit transition-colors">
                <ArrowLeft size={18} /> <span className="font-medium text-sm">Înapoi la listă</span>
            </button>

            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 flex-1 overflow-y-auto no-scrollbar pb-20 xl:pb-10">
                {/* LEFT COLUMN: Profile & Lead Info */}
                <div className="w-full xl:w-[400px] flex-shrink-0">
                    <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden sticky top-0 flex flex-col p-5 xl:p-8">
                        
                        {/* Header: Avatar + Info */}
                        <div className="flex flex-row xl:flex-col items-center xl:items-center gap-5 xl:gap-2 text-left xl:text-center mb-6">
                            <div className="relative group cursor-pointer shrink-0">
                                {lead.avatarUrl ? (
                                    <img src={lead.avatarUrl} className="w-20 h-20 xl:w-48 xl:h-48 rounded-full border-[3px] xl:border-[6px] border-white dark:border-gray-900 shadow-sm object-cover bg-white" alt={lead.name} />
                                ) : (
                                    <div className={`w-20 h-20 xl:w-48 xl:h-48 rounded-full border-[3px] xl:border-[6px] border-white dark:border-gray-900 shadow-sm flex items-center justify-center text-2xl xl:text-5xl font-black ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                        {lead.name.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-[3px] xl:border-[6px] border-transparent"><Camera size={24} className="text-white"/></div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl xl:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1 truncate">{lead.name}</h1>
                                <p className="text-xs xl:text-sm text-gray-500 font-medium truncate">{lead.email || 'Fără email'}</p>
                                <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs xl:text-sm font-bold text-green-600 hover:underline mt-1 inline-block">{lead.phone}</a>
                            </div>
                        </div>

                        {/* LEAD INFO WIDGET */}
                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6 text-left border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-end items-start mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                                <Badge color="bg-blue-100 text-blue-700 border-blue-200">
                                    {lead.source}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Următoarea Acțiune</p>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                                        <Calendar size={12} className="text-gray-400" />
                                        {lead.nextActionDate || 'Neprogramat'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status Plată</p>
                                    <span className="text-xs font-bold text-gray-400">În așteptare</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full gap-3 mt-auto">
                            <Button onClick={() => setIsEditing(!isEditing)} className="!w-auto h-10 px-6 text-xs gap-2 bg-amber-400 text-amber-950 border-none hover:bg-amber-500 font-bold shadow-sm">
                                <Edit2 size={14}/> {isEditing ? 'Salvează' : 'Editează'}
                            </Button>
                            <div className="flex gap-2">
                                <button onClick={handleWhatsApp} className="w-11 h-11 flex items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-600 hover:bg-green-100" title="WhatsApp"><MessageCircle size={18} /></button>
                                <button onClick={() => onArchive(lead.id)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100" title="Arhivează"><Archive size={18} /></button>
                                <button onClick={() => onDelete(lead.id)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50" title="Șterge"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Metrics & Tabs */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'general', label: 'General' },
                            { id: 'funnel', label: 'Funnel' },
                            { id: 'timeline', label: 'Timeline & Note' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id as any)} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                                    activeTab === t.id 
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* KPI GRID */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Probabilitate</p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-2xl xl:text-3xl font-black ${metrics.probColor}`}>{lead.probability}%</p>
                                        <Badge color={metrics.probBg}>Rating</Badge>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ultima acțiune</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl xl:text-3xl font-black text-gray-900 dark:text-white">{lead.lastActionDate}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 rounded-[24px] p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Valoare Estimată</p>
                                    <div>
                                        <p className="text-2xl xl:text-3xl font-black text-blue-600">269 <span className="text-sm text-gray-400">RON</span></p>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1">Potențial Silver</p>
                                    </div>
                                </div>

                                <div className={`rounded-[24px] p-6 border flex flex-col justify-between shadow-sm ${metrics.statusBg} border-transparent`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${metrics.statusColor}`}>Status Funnel</p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-lg xl:text-xl font-black ${metrics.statusColor}`}>{lead.stage}</p>
                                        <TrendingUp size={18} className={metrics.statusColor} />
                                    </div>
                                </div>
                            </div>

                            {/* INTEREST & SCHEDULER */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-lg"><Target size={20} className="text-amber-500"/> Detalii Interes</h3>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase mb-3 tracking-wider">Stiluri de interes</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.values(DanceStyle).map(style => {
                                                    const currentStyles = lead.interest.styles || (lead.interest.style ? [lead.interest.style] : []);
                                                    const isActive = currentStyles.includes(style);
                                                    return (
                                                        <button 
                                                            key={style}
                                                            onClick={() => {
                                                                let newStyles: DanceStyle[];
                                                                if (isActive) {
                                                                    newStyles = currentStyles.filter(s => s !== style);
                                                                } else {
                                                                    newStyles = [...currentStyles, style];
                                                                }
                                                                onUpdate(lead.id, {
                                                                    interest: {
                                                                        ...lead.interest,
                                                                        styles: newStyles,
                                                                        style: newStyles[0] || DanceStyle.SALSA // Fallback
                                                                    }
                                                                });
                                                            }}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isActive ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'}`}
                                                        >
                                                            {style}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Nivel</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{lead.interest.level}</p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Zile Preferate</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{lead.interest.preferredDays?.join(', ') || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-lg"><CalendarCheck size={20} className="text-blue-500"/> Programare</h3>
                                    <GroupScheduler lead={lead} onSave={onUpdate} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'funnel' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* FUNNEL ROADMAP */}
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-lg"><TrendingUp size={20} className="text-emerald-500"/> Funnel Roadmap</h3>
                                <div className="flex flex-wrap gap-2">
                                    {STAGE_OPTIONS.map(stage => {
                                        const isCurrent = lead.stage === stage;
                                        const canTransition = canTransitionTo(stage as LeadStage);
                                        
                                        return (
                                            <button 
                                                key={stage} 
                                                disabled={!canTransition && !isCurrent}
                                                onClick={() => {
                                                    if (stage === LeadStage.SCHEDULED) {
                                                        const dateTime = prompt("Introduceți data și ora programării (ex: 2026-03-15 18:30):");
                                                        if (!dateTime) return;
                                                        onUpdate(lead.id, { stage: stage as LeadStage, scheduledClassDateTime: dateTime });
                                                    } else {
                                                        onUpdate(lead.id, { stage: stage as LeadStage });
                                                    }
                                                }} 
                                                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border ${
                                                    isCurrent 
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' 
                                                        : canTransition 
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800 hover:border-emerald-300'
                                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-300 border-gray-100 dark:border-gray-700 cursor-not-allowed opacity-50'
                                                }`}
                                            >
                                                {stage.toUpperCase()}
                                            </button>
                                        );
                                    })}
                                </div>
                                {lead.stage === LeadStage.SCHEDULED ? (
                                    lead.scheduledClasses && lead.scheduledClasses.length > 0 ? (
                                        <div className="mt-4 space-y-2">
                                            {lead.scheduledClasses.map((cls, idx) => (
                                                <div key={idx} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                                                    <Calendar size={18} className="text-emerald-600"/>
                                                    <div>
                                                        <p className="text-[10px] text-emerald-600 font-black uppercase">Programat pentru: {cls.style}</p>
                                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{new Date(cls.date).toLocaleString('ro-RO')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : lead.scheduledClassDateTime && (
                                        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                                            <Calendar size={18} className="text-emerald-600"/>
                                            <div>
                                                <p className="text-[10px] text-emerald-600 font-black uppercase">Programat pentru:</p>
                                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{new Date(lead.scheduledClassDateTime).toLocaleString('ro-RO')}</p>
                                            </div>
                                        </div>
                                    )
                                ) : null}
                            </div>

                            {/* SALES ASSISTANT */}
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-800 p-8 rounded-[32px] border border-indigo-700 shadow-xl text-white">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black text-white flex items-center gap-3 text-xl"><BrainCircuit size={28} className="text-yellow-400"/> Sales Assistant AI</h3>
                                    <Badge color="bg-yellow-400 text-indigo-900 border-none">PREMIUM</Badge>
                                </div>
                                
                                {!isRecording && !audioURL && !analysisData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button onClick={onStartRecording} className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-sm font-black transition-all active:scale-95 shadow-lg">
                                            <Mic size={24}/> Înregistrează Apel
                                        </button>
                                        <label className="bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-sm font-black cursor-pointer transition-all border border-white/20">
                                            <Upload size={24}/> Upload Audio
                                            <input type="file" accept="audio/*" className="hidden" onChange={onFileUpload} />
                                        </label>
                                    </div>
                                )}

                                {isRecording && (
                                    <div className="flex flex-col items-center gap-4 py-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center relative z-10"><Mic size={32}/></div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-white mb-1">Se înregistrează...</p>
                                            <p className="text-xs text-indigo-200">AI-ul ascultă și pregătește analiza</p>
                                        </div>
                                        <button onClick={onStopRecording} className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-50 transition-all">Stop Înregistrare</button>
                                    </div>
                                )}

                                {(audioURL || isAnalyzing) && (
                                    <div className="space-y-6">
                                        {audioURL && (
                                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                                <audio src={audioURL} controls className="w-full h-10 opacity-90" />
                                            </div>
                                        )}
                                        
                                        {isAnalyzing ? (
                                            <div className="flex flex-col items-center gap-4 py-6">
                                                <Loader2 size={40} className="animate-spin text-yellow-400"/>
                                                <p className="text-indigo-100 font-bold">Se analizează conversația cu Gemini AI...</p>
                                            </div>
                                        ) : analysisData ? (
                                            <div className="bg-white/10 rounded-[24px] p-6 text-sm space-y-4 border border-white/10 animate-in fade-in zoom-in duration-300">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles size={16} className="text-yellow-400"/>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${analysisData.sentiment === 'positive' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>{analysisData.sentiment}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-indigo-300 font-black uppercase">Șanse Conversie</p>
                                                        <p className="text-2xl font-black text-yellow-400">{analysisData.probability}%</p>
                                                    </div>
                                                </div>
                                                <div className="bg-indigo-950/50 p-4 rounded-xl italic text-indigo-100 text-xs leading-relaxed border-l-4 border-yellow-400">
                                                    "{analysisData.summary}"
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-indigo-300 uppercase font-black mb-2 tracking-wider">Obiecții Identificate:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {analysisData.objections?.map((obj: string, i: number) => (
                                                            <span key={i} className="text-[10px] font-bold bg-red-500/20 text-red-200 px-3 py-1 rounded-full border border-red-500/30">{obj}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button onClick={onApplyAnalysis} className="w-full h-12 text-sm font-black bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl shadow-lg">Aplică Recomandările în Note</Button>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* ACTIVITY FEED (activityLog) */}
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2 text-lg"><Clock size={20} className="text-blue-500"/> Timeline Activitate</h3>
                                
                                <div className="space-y-0">
                                    {combinedTimeline.length > 0 ? (
                                        combinedTimeline.map((item, idx) => (
                                            <div key={item.id || idx} className="relative pl-10 pb-8 border-l-2 border-gray-100 dark:border-gray-800 last:pb-0 group">
                                                {/* Timeline Dot */}
                                                <div className={`absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 flex items-center justify-center shadow-sm ${
                                                    item.type === 'recording' ? 'border-red-500' : 
                                                    item.type === 'status_change' ? 'border-emerald-500' : 'border-blue-500'
                                                }`}>
                                                    {item.type === 'recording' ? <Mic size={10} className="text-red-500"/> : 
                                                     item.type === 'status_change' ? <TrendingUp size={10} className="text-emerald-500"/> :
                                                     item.type === 'note' ? <StickyNote size={10} className="text-yellow-500"/> :
                                                     item.type === 'call' ? <Phone size={10} className="text-blue-500"/> :
                                                     item.type === 'whatsapp' ? <MessageCircle size={10} className="text-green-500"/> :
                                                     <Clock size={10} className="text-blue-500"/>}
                                                </div>

                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.type?.replace('_', ' ')}</p>
                                                        <h5 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{item.description || item.content}</h5>
                                                        {item.outcome && <p className="text-[11px] text-gray-500 mt-1 italic">Outcome: {item.outcome}</p>}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">{item.date || new Date(item.createdAt || item.changedAt).toLocaleString('ro-RO')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-16">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Clock size={24} className="text-gray-300"/>
                                            </div>
                                            <p className="text-gray-400 italic text-sm">Nicio activitate înregistrată încă.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ADD ACTIVITY SECTION */}
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-lg"><StickyNote size={20} className="text-yellow-500"/> Adaugă Activitate</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Tip Activitate</label>
                                        <select 
                                            value={activityType}
                                            onChange={(e) => setActivityType(e.target.value as any)}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="call">Apel Telefonic</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="sms">SMS</option>
                                            <option value="email">Email</option>
                                            <option value="reminder">Reminder</option>
                                            <option value="note">Notă</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Outcome (Rezultat)</label>
                                        <input 
                                            type="text"
                                            value={activityOutcome}
                                            onChange={(e) => setActivityOutcome(e.target.value)}
                                            placeholder="Ex: A răspuns, revine mâine"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <textarea 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-[24px] p-5 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-4"
                                    placeholder="Detalii activitate..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handleAddActivity} disabled={!newNote.trim()} className="!w-auto h-11 px-8 text-sm font-bold rounded-2xl">Salvează Activitate</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
