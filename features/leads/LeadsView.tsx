
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, UserPlus, Phone, MessageCircle, AlertTriangle, Sparkles, X, CalendarCheck, StickyNote, ArrowLeft, Mail, Check, TrendingUp, User, MapPin, Calendar, MoreHorizontal, Target, ArrowRight, ListTodo, LayoutGrid, LayoutList, ChevronDown, Filter, ArrowUp, ArrowDown, CheckSquare, Square, Facebook, Instagram, Send, RotateCcw, Save, Briefcase, Tag, Flag, Camera, Upload, Loader2, Edit2, Mars, Venus, EyeOff, Eye, FileText, GripVertical, Globe, Megaphone, Users, Mic, Play, Pause, BrainCircuit, ChevronRight, Layers, Plus } from 'lucide-react';
import { MOCK_LEADS } from '../../constants';
import { LeadStatus, Lead, DanceStyle, SkillLevel, ActivityLog, LeadSource, GroupDetailedProfile } from '../../types';
import { TargetIcon } from '../../components/shared/TargetIcon';
import { Button, Badge, Switch, Input, Modal } from '../../components/UIComponents';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { useData } from '../../contexts/DataContext';
import { GroupScheduler } from './components/GroupScheduler';
import { getLevelBadgeColor } from '../../utils/themeUtils';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { normalizeText, smartSearch } from '../../utils/searchUtils';
import { analyzeSalesCall } from '../../services/geminiService';

interface LeadsViewProps {
    onNavigateToStudent: (id: string) => void;
    onAddTask: (title: string, priority?: 'high'|'medium'|'low', tag?: string, assignee?: {name: string, avatarUrl: string}, description?: string, status?: 'inbox' | 'pending' | 'done' | 'archived') => void;
}

type SortKey = 'gender' | 'name' | 'phone' | 'source' | 'status' | 'style' | 'groups' | 'day' | 'notes' | 'date';
type ColId = SortKey | 'social';

interface FilterState {
    gender: string[];
    name: string;
    phone: string;
    source: string[];
    status: string[];
    style: string[];
    day: string[];
    date: string;
    notes: string;
}

const INITIAL_FILTERS: FilterState = {
    gender: [],
    name: '',
    phone: '',
    source: [],
    status: [],
    style: [],
    day: [],
    date: '',
    notes: ''
};

const STATUS_OPTIONS = ['Necontactat', 'Amanat', 'Programat', 'Calls back', 'Nu raspunde', 'Maybe', 'Retras', 'Trimis reminder', 'Prezent', 'Platit'];
const SOURCE_OPTIONS = ['Website form', 'Facebook Lead Ads', 'Instagram DM', 'Referral', 'Direct call', 'Walk-in', 'Whatsapp'];

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const LeadsView: React.FC<LeadsViewProps> = ({ onNavigateToStudent, onAddTask }) => {
  const { groups, leads: contextLeads, updateLead, addLead } = useData(); 
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showLost, setShowLost] = useState(false);
  
  // Audio & AI State
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sync leads from context
  useEffect(() => {
      if (contextLeads.length > 0) {
          setLeads(contextLeads);
      }
  }, [contextLeads]);

  // Detail View State
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lead Form
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>('Walk-in');

  // Sorting & Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  
  // Grouping State (Notion Style)
  const [groupBy, setGroupBy] = useState<string | null>(null); // 'status', 'source', 'style', 'gender'
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Column Configuration
  const [columns, setColumns] = useState<{id: ColId, label: string, width: number, minWidth: number, noSort?: boolean, noFilter?: boolean, filterOptions?: string[]}[]>(() => {
      const saved = localStorage.getItem('leads_columns_config_v5');
      if (saved) {
          try { return JSON.parse(saved); } catch (e) { console.error("Error parsing saved columns", e); }
      }
      return [
          { id: 'gender', label: 'Sex', width: 60, minWidth: 50, filterOptions: ['M', 'F'] },
          { id: 'name', label: 'Nume și Prenume', width: 240, minWidth: 150 },
          { id: 'phone', label: 'Telefon', width: 130, minWidth: 120 },
          { id: 'groups', label: 'Grupe', width: 300, minWidth: 200, noSort: true, noFilter: true },
          { id: 'status', label: 'Status', width: 160, minWidth: 130, filterOptions: STATUS_OPTIONS },
          { id: 'source', label: 'Sursă', width: 160, minWidth: 130, filterOptions: SOURCE_OPTIONS },
          { id: 'notes', label: 'Mențiuni', width: 250, minWidth: 200 },
          { id: 'date', label: 'Next Action', width: 130, minWidth: 120 }
      ];
  });

  // Save Columns
  useEffect(() => {
      localStorage.setItem('leads_columns_config_v5', JSON.stringify(columns));
  }, [columns]);

  // Column Drag & Resize Refs
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const resizingColId = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // Reset states when switching leads
  useEffect(() => {
      setIsEditing(false);
      setAudioURL(null);
      setAnalysisData(null);
      setIsAnalyzing(false);
  }, [selectedLead?.id]);

  const handleCreateLead = async () => {
        if (!newLeadName || !newLeadPhone) return;
        
        const newLead: Lead = {
            id: `l_${Date.now()}`,
            name: newLeadName,
            phone: newLeadPhone,
            source: newLeadSource,
            entryDate: new Date().toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' }),
            status: 'Necontactat',
            interest: {
                styles: [DanceStyle.BACHATA],
                style: DanceStyle.BACHATA,
                level: SkillLevel.BEGINNER,
                preferredDays: [],
                groupIds: []
            },
            ownerId: 'admin',
            lastActionDate: 'Azi',
            riskLevel: 'low',
            probability: 20,
            activityLog: [],
            notes: ''
        };
        
        await addLead(newLead);
        setIsAddModalOpen(false);
        setNewLeadName('');
        setNewLeadPhone('');
    };

  // --- AUDIO HANDLERS ---
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); 
              const url = URL.createObjectURL(audioBlob);
              setAudioURL(url);
              handleAnalyzeAudio(audioBlob);
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Error accessing microphone:", err);
          alert("Nu am putut accesa microfonul.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setAudioURL(url);
          handleAnalyzeAudio(file);
      }
  };

  const handleAnalyzeAudio = async (blob: Blob) => {
      setIsAnalyzing(true);
      try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
              const base64data = reader.result as string;
              const base64Content = base64data.split(',')[1];
              const mimeType = base64data.split(';')[0].split(':')[1];

              const result = await analyzeSalesCall(base64Content, mimeType);
              setAnalysisData(result);
              setIsAnalyzing(false);
          };
      } catch (error) {
          console.error("Analysis failed:", error);
          alert("Analiza audio a eșuat.");
          setIsAnalyzing(false);
      }
  };

  const handleApplyAnalysis = () => {
      if (analysisData && selectedLead) {
          const newNoteContent = `[AI Analysis]\nSummary: ${analysisData.summary}\nSentiment: ${analysisData.sentiment}\nObjections: ${analysisData.objections.join(', ')}`;
          const updatedNotes = (selectedLead.notes || '') + '\n\n' + newNoteContent;
          
          handleUpdateLead(selectedLead.id, { 
              notes: updatedNotes,
              probability: analysisData.probability 
          });
          setAnalysisData(null); 
      }
  };

  const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number) => {
      e.preventDefault();
      e.stopPropagation();
      resizingColId.current = colId;
      startX.current = e.clientX;
      startWidth.current = currentWidth;
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
      if (!resizingColId.current) return;
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(50, startWidth.current + diff);
      setColumns(prev => prev.map(col => col.id === resizingColId.current ? { ...col, width: newWidth } : col));
  };

  const handleResizeEnd = () => {
      resizingColId.current = null;
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
  };

  const handleColDragStart = (e: React.DragEvent, colId: string) => {
      setDraggedColId(colId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent, colId: string) => {
      e.preventDefault();
      if (draggedColId !== colId) {
          e.dataTransfer.dropEffect = 'move';
      }
  };

  const handleColDrop = (e: React.DragEvent, targetColId: string) => {
      e.preventDefault();
      if (!draggedColId || draggedColId === targetColId) return;

      const fromIndex = columns.findIndex(c => c.id === draggedColId);
      const toIndex = columns.findIndex(c => c.id === targetColId);

      if (fromIndex !== -1 && toIndex !== -1) {
          const newCols = [...columns];
          const [movedCol] = newCols.splice(fromIndex, 1);
          newCols.splice(toIndex, 0, movedCol);
          setColumns(newCols);
      }
      setDraggedColId(null);
  };

  const columnsKanban: LeadStatus[] = ['Necontactat', 'Amanat', 'Programat', 'Calls back', 'Nu raspunde', 'Maybe', 'Retras', 'Trimis reminder', 'Prezent', 'Platit'];
  
  const filteredLeads = useMemo(() => {
      let result = leads.filter(l => {
          if (!showLost && l.status === 'Lost') return false;
          if (searchTerm) {
              const matchesGlobal = smartSearch(searchTerm, l.name) || l.phone.includes(searchTerm);
              if (!matchesGlobal) return false;
          }

          if (columnFilters.gender.length > 0 && !columnFilters.gender.includes(l.gender || '')) return false;
          if (columnFilters.source.length > 0 && !columnFilters.source.includes(l.source)) return false;
          if (columnFilters.status.length > 0 && !columnFilters.status.includes(l.status)) return false;
          
          if (columnFilters.style.length > 0) {
              const primaryMatch = columnFilters.style.includes(l.interest.style);
              const stylesMatch = l.interest.styles?.some(s => columnFilters.style.includes(s));
              const groupMatch = l.interest.groupIds?.some(gid => {
                  const grp = groups.find(g => g.id === gid);
                  return grp && columnFilters.style.includes(grp.style);
              });
              if (!primaryMatch && !groupMatch && !stylesMatch) return false;
          }

          return true;
      });

      if (sortConfig) {
          result.sort((a, b) => {
              const getValue = (item: Lead, key: SortKey) => {
                  switch (key) {
                      case 'name': return (item.name || '').toLowerCase();
                      case 'phone': return (item.phone || '').replace(/\D/g, ''); 
                      case 'status': return item.status || '';
                      case 'source': return item.source || '';
                      case 'gender': return item.gender || '';
                      case 'style': return `${item.interest.style} ${item.interest.level}`.toLowerCase();
                      case 'day': return (item.interest.preferredDays || []).join(', ');
                      case 'notes': return (item.notes || '').toLowerCase();
                      case 'date': 
                          if (!item.nextActionDate) return 0;
                          const dStr = item.nextActionDate.toLowerCase();
                          const now = new Date();
                          if (dStr.includes('azi')) return now.getTime();
                          if (dStr.includes('ieri')) return new Date(now.setDate(now.getDate() - 1)).getTime();
                          if (dStr.includes('maine') || dStr.includes('mâine')) return new Date(now.setDate(now.getDate() + 1)).getTime();
                          const parts = item.nextActionDate.split('/');
                          if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                          return 0;
                      default: return '';
                  }
              };

              const aValue = getValue(a, sortConfig.key);
              const bValue = getValue(b, sortConfig.key);

              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }

      return result;
  }, [leads, searchTerm, columnFilters, showLost, sortConfig, groups]);

  const groupedData = useMemo(() => {
      if (!groupBy) return null;
      const map = new Map<string, Lead[]>();
      if (groupBy === 'status') {
          STATUS_OPTIONS.forEach(s => map.set(s, []));
      } else if (groupBy === 'source') {
          SOURCE_OPTIONS.forEach(s => map.set(s, []));
      }

      filteredLeads.forEach(lead => {
          let key = '';
          if (groupBy === 'status') key = lead.status;
          else if (groupBy === 'source') key = lead.source;
          else if (groupBy === 'gender') key = lead.gender === 'M' ? 'Masculin' : lead.gender === 'F' ? 'Feminin' : 'Nedefinit';
          else if (groupBy === 'style') key = lead.interest.style;
          
          if (!key) key = 'Fără Grup';
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(lead);
      });
      
      return map;
  }, [filteredLeads, groupBy]);

  const toggleGroupCollapse = (groupName: string) => {
      setCollapsedGroups(prev => {
          const next = new Set(prev);
          if (next.has(groupName)) next.delete(groupName);
          else next.add(groupName);
          return next;
      });
  };

  const leadsByStatus = columnsKanban.reduce((acc, status) => {
    acc[status] = filteredLeads.filter(l => l.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  const handleSort = (key: SortKey) => {
      setSortConfig(prev => {
          if (prev && prev.key === key) {
              return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
          }
          return { key, direction: 'asc' };
      });
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      if (selectedLead && selectedLead.id === id) {
          setSelectedLead(prev => prev ? { ...prev, ...updates } : null);
      }
      try { await updateLead(id, updates); } catch (e) { console.error(e); }
  };

  const handleLeadClick = (lead: Lead) => { setSelectedLead(lead); }

  const handleSocialAction = (type: 'whatsapp' | 'messenger' | 'facebook' | 'instagram', lead: Lead, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
      const finalPhone = cleanPhone.length === 10 ? `40${cleanPhone}` : cleanPhone;
      let url = '';
      const encodedName = encodeURIComponent(lead.name);

      switch(type) {
          case 'whatsapp': url = `https://wa.me/${finalPhone}`; break;
          case 'messenger': url = `https://www.facebook.com/search/people/?q=${encodedName}`; break;
          case 'facebook': url = `https://www.facebook.com/search/people/?q=${encodedName}`; break;
          case 'instagram': url = `https://www.google.com/search?q=site:instagram.com+${encodedName}`; break;
      }
      if (url) window.open(url, '_blank');
  };

  const getStatusDotColor = (status: LeadStatus) => {
      switch(status) {
          case 'Necontactat': return 'bg-gray-400';
          case 'Amanat': return 'bg-blue-500';
          case 'Programat': return 'bg-emerald-500';
          case 'Calls back': return 'bg-yellow-500';
          case 'Nu raspunde': return 'bg-yellow-500';
          case 'Maybe': return 'bg-orange-500';
          case 'Retras': return 'bg-red-500';
          case 'Trimis reminder': return 'bg-yellow-500';
          case 'Prezent': return 'bg-emerald-500';
          case 'Platit': return 'bg-emerald-500';
          default: return 'bg-gray-400';
      }
  }

  // --- UNIFIED BADGE STYLES (BORDER + SOFT BG + TITLE CASE) ---
  const renderStatusBadge = (status: LeadStatus) => {
      let styles = "bg-gray-50 text-gray-700 border-gray-200"; // Default
      let label = status as string;

      switch(status) {
          case 'Necontactat': 
              styles = "bg-gray-100 text-gray-700 border-gray-200"; 
              break;
          case 'Amanat': 
              styles = "bg-blue-100 text-blue-700 border-blue-200"; 
              break;
          case 'Programat': 
              styles = "bg-emerald-100 text-emerald-700 border-emerald-200"; 
              break;
          case 'Calls back': 
              styles = "bg-yellow-100 text-yellow-700 border-yellow-200"; 
              break;
          case 'Nu raspunde': 
              styles = "bg-yellow-100 text-yellow-700 border-yellow-200"; 
              break;
          case 'Maybe': 
              styles = "bg-orange-100 text-orange-700 border-orange-200"; 
              break;
          case 'Retras': 
              styles = "bg-red-100 text-red-700 border-red-200"; 
              break;
          case 'Trimis reminder': 
              styles = "bg-yellow-100 text-yellow-700 border-yellow-200"; 
              break;
          case 'Prezent': 
              styles = "bg-emerald-100 text-emerald-700 border-emerald-200"; 
              break;
          case 'Platit': 
              styles = "bg-emerald-100 text-emerald-700 border-emerald-200"; 
              break;
      }
      
      return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${styles} whitespace-nowrap inline-block`}>{label}</span>;
  }

  const renderSourceBadge = (source: string) => {
      let styles = "bg-gray-100 text-gray-700 border-gray-200";
      const s = source.toLowerCase();
      let label = toTitleCase(source);
      
      if (s.includes('website')) {
          styles = "bg-amber-100 text-amber-800 border-amber-200";
      } else if (s.includes('facebook')) {
          styles = "bg-blue-100 text-blue-800 border-blue-200";
      } else if (s.includes('instagram')) {
          styles = "bg-pink-100 text-pink-800 border-pink-200";
      } else if (s.includes('referral')) {
          styles = "bg-indigo-100 text-indigo-800 border-indigo-200";
      } else if (s.includes('direct call')) {
          styles = "bg-emerald-100 text-emerald-800 border-emerald-200";
      } else if (s.includes('walk-in')) {
          styles = "bg-rose-100 text-rose-800 border-rose-200";
      } else if (s.includes('whatsapp') || s.includes('phone')) {
          styles = "bg-green-100 text-green-800 border-green-200";
          label = "Whatsapp";
      }
      
      return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${styles} whitespace-nowrap inline-block`}>{label}</span>
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedLeadId(id);
      e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
      e.preventDefault();
      if (draggedLeadId) {
          handleUpdateLead(draggedLeadId, { status: targetStatus });
          setDraggedLeadId(null);
      }
  };

  const StatusCell = ({ lead }: { lead: Lead }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [coords, setCoords] = useState({ top: 0, left: 0 });
      const containerRef = useRef<HTMLDivElement>(null);

      const toggleDropdown = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isOpen) {
              setIsOpen(false);
          } else {
              if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
              }
              setIsOpen(true);
          }
      };

      return (
          <>
              <div ref={containerRef} onClick={toggleDropdown} className="cursor-pointer hover:opacity-80 transition-opacity inline-block">
                  {renderStatusBadge(lead.status)}
              </div>
              {isOpen && createPortal(
                  <div className="fixed inset-0 z-[9999] flex items-start justify-start" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                      <div className="absolute bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 min-w-[160px]" style={{ top: coords.top + 4, left: coords.left }}>
                          {STATUS_OPTIONS.map((opt) => (
                              <button key={opt} onClick={() => { handleUpdateLead(lead.id, { status: opt as LeadStatus }); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                                  <div className="scale-90 origin-left pointer-events-none">{renderStatusBadge(opt as LeadStatus)}</div>
                                  {opt === lead.status && <Check size={12} className="text-gray-400"/>}
                              </button>
                          ))}
                      </div>
                  </div>, document.body
              )}
          </>
      );
  };

  const SourceCell = ({ lead }: { lead: Lead }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [coords, setCoords] = useState({ top: 0, left: 0 });
      const containerRef = useRef<HTMLDivElement>(null);

      const toggleDropdown = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isOpen) {
              setIsOpen(false);
          } else {
              if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
              }
              setIsOpen(true);
          }
      };

      return (
          <>
              <div ref={containerRef} onClick={toggleDropdown} className="cursor-pointer hover:opacity-80 transition-opacity inline-block">
                  {renderSourceBadge(lead.source)}
              </div>
              {isOpen && createPortal(
                  <div className="fixed inset-0 z-[9999] flex items-start justify-start" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                      <div className="absolute bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 min-w-[160px]" style={{ top: coords.top + 4, left: coords.left }}>
                          {SOURCE_OPTIONS.map((opt) => (
                              <button key={opt} onClick={() => { handleUpdateLead(lead.id, { source: opt as LeadSource }); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                                  <div className="scale-90 origin-left pointer-events-none">{renderSourceBadge(opt)}</div>
                                  {opt === lead.source && <Check size={12} className="text-gray-400"/>}
                              </button>
                          ))}
                      </div>
                  </div>, document.body
              )}
          </>
      );
  };

  const GroupSelectorCell = ({ lead, allGroups, onUpdate }: { lead: Lead, allGroups: GroupDetailedProfile[], onUpdate: (updates: Partial<Lead>) => void }) => {
      const [isOpen, setIsOpen] = useState(false);
      const [coords, setCoords] = useState({ top: 0, left: 0 });
      const [searchTerm, setSearchTerm] = useState('');
      const containerRef = useRef<HTMLDivElement>(null);

      const selectedIds = lead.interest.groupIds || (lead.interest.groupId ? [lead.interest.groupId] : []);
      
      const toggleGroup = (groupId: string) => {
          const newIds = selectedIds.includes(groupId) 
              ? selectedIds.filter(id => id !== groupId)
              : [...selectedIds, groupId];
          
          onUpdate({ interest: { ...lead.interest, groupIds: newIds, groupId: newIds[0] || undefined } });
      };

      const toggleDropdown = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (isOpen) {
              setIsOpen(false);
          } else {
              if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
              }
              setIsOpen(true);
              setSearchTerm('');
          }
      };

      const filteredGroups = allGroups.filter(g => smartSearch(searchTerm, g.name)).slice(0, 10);

      // Render Badges (Improved to show ALL groups and full names)
      const renderBadges = () => {
          if (selectedIds.length === 0) return <button className="text-[10px] font-bold text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-2 py-1 rounded-md border border-gray-200 hover:border-blue-200 flex items-center gap-1 transition-all"><Plus size={10}/> Adaugă</button>;
          
          // Map IDs to Group Objects
          const selectedGroupsList = selectedIds.map(id => allGroups.find(g => g.id === id)).filter(g => !!g);
          
          return (
              <div className="flex flex-wrap gap-1 items-center">
                  {selectedGroupsList.map(grp => {
                      // CRITICAL FIX: Pass the group Name to detect "Start" keyword
                      const badgeColor = getLevelBadgeColor(grp!.name);
                      return (
                          <span key={grp!.id} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${badgeColor}`}>
                              {toTitleCase(grp!.name)}
                          </span>
                      );
                  })}
              </div>
          );
      };

      return (
          <>
              <div ref={containerRef} onClick={toggleDropdown} className="cursor-pointer min-h-[28px] flex items-center">
                  {renderBadges()}
              </div>
              {isOpen && createPortal(
                  <div className="fixed inset-0 z-[9999]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                      <div 
                          className="absolute bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 w-64 animate-in fade-in zoom-in-95 duration-200" 
                          style={{ top: coords.top + 8, left: coords.left }}
                          onClick={(e) => e.stopPropagation()}
                      >
                          <div className="relative mb-2">
                              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                              <input 
                                  autoFocus
                                  type="text" 
                                  placeholder="Caută grupă..." 
                                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                              />
                          </div>
                          <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
                              {filteredGroups.map(g => {
                                  const isSelected = selectedIds.includes(g.id);
                                  return (
                                      <button 
                                          key={g.id} 
                                          onClick={() => toggleGroup(g.id)}
                                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isSelected ? 'bg-blue-50/50 text-blue-700' : 'text-gray-700 dark:text-gray-300'}`}
                                      >
                                          <div className="text-left leading-tight">
                                              <div className="font-bold">{g.name}</div>
                                              <div className="text-[9px] text-gray-400 mt-0.5">{g.schedule.day} • {g.schedule.time}</div>
                                          </div>
                                          {isSelected && <Check size={14} className="text-blue-600"/>}
                                      </button>
                                  );
                              })}
                              {filteredGroups.length === 0 && <p className="text-center text-xs text-gray-400 py-2">Nicio grupă găsită.</p>}
                          </div>
                      </div>
                  </div>, document.body
              )}
          </>
      );
  };

  const FilterPopover = ({ colId, options }: { colId: string, options: string[] }) => {
      const currentValues = (columnFilters as any)[colId] || [];
      
      const toggleOption = (opt: string) => {
          setColumnFilters(prev => {
              const current = (prev as any)[colId] as string[];
              const newValues = current.includes(opt) 
                  ? current.filter(o => o !== opt)
                  : [...current, opt];
              return { ...prev, [colId]: newValues };
          });
      };

      return (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-3 w-48 z-50 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Filtrează</span>
                  <button onClick={() => setActiveFilterDropdown(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X size={12} className="text-gray-400"/></button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {options.map(opt => {
                      const isSelected = currentValues.includes(opt);
                      // Calculate count
                      const count = leads.filter(l => {
                          if (colId === 'gender') return (l.gender || '') === opt;
                          if (colId === 'source') return l.source === opt;
                          if (colId === 'status') return l.status === opt;
                          if (colId === 'style') {
                              // Match against any of the lead's styles
                              const primaryMatch = l.interest.style === opt;
                              const stylesMatch = l.interest.styles?.includes(opt as DanceStyle);
                              const groupMatch = l.interest.groupIds?.some(gid => {
                                  const grp = groups.find(g => g.id === gid);
                                  return grp && grp.style === opt;
                              });
                              return primaryMatch || stylesMatch || groupMatch;
                          }
                          return false;
                      }).length;

                      return (
                          <button 
                              key={opt}
                              onClick={() => toggleOption(opt)}
                              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                          >
                              <div className="flex items-center gap-2">
                                  <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                                  </div>
                                  <span className={isSelected ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}>{opt}</span>
                              </div>
                              <span className="text-[9px] text-gray-400 font-bold ml-2 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                                  {count}
                              </span>
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  };

  const renderStyleCell = (lead: Lead) => {
      // 1. Gather all styles from different sources
      const styles = new Set<string>();
      
      // Add primary style if exists
      if (lead.interest.style) styles.add(lead.interest.style);
      
      // Add multiple styles array if exists
      if (lead.interest.styles) {
          lead.interest.styles.forEach(s => styles.add(s));
      }

      // Add from groups
      if (lead.interest.groupIds) {
          lead.interest.groupIds.forEach(gid => {
              const grp = groups.find(g => g.id === gid);
              if (grp) styles.add(grp.style);
          });
      }

      const styleList = Array.from(styles);

      if (styleList.length === 0) return <span className="text-gray-400">-</span>;

      // Render badges
      const getBadgeStyle = (styleName: string) => {
          if (styleName === DanceStyle.BACHATA) return 'bg-[#7E5920] text-white border-[#5D4037]'; // Brownish for Bachata to match UI screenshot hint
          if (styleName === DanceStyle.SALSA) return 'bg-[#9F4A46] text-white border-[#7E3B38]';
          if (styleName === DanceStyle.KIZOMBA) return 'bg-[#3B628F] text-white border-[#2C4A6E]';
          return 'bg-gray-600 text-white border-gray-700';
      };

      return (
          <div className="flex flex-wrap gap-1">
              {styleList.slice(0, 3).map((s, i) => (
                  <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded shadow-sm border ${getBadgeStyle(s)}`}>
                      {s}
                  </span>
              ))}
              {styleList.length > 3 && (
                  <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500">
                      +{styleList.length - 3}
                  </span>
              )}
          </div>
      );
  };

  const toggleLeadStyle = (style: DanceStyle) => {
      if (!selectedLead) return;
      const currentStyles = selectedLead.interest.styles || (selectedLead.interest.style ? [selectedLead.interest.style] : []);
      
      let newStyles: DanceStyle[];
      if (currentStyles.includes(style)) {
          newStyles = currentStyles.filter(s => s !== style);
      } else {
          newStyles = [...currentStyles, style];
      }
      
      // Ensure at least one style is primary for backward compat if needed, or just sync
      handleUpdateLead(selectedLead.id, { 
          interest: { 
              ...selectedLead.interest, 
              styles: newStyles,
              style: newStyles.length > 0 ? newStyles[0] : selectedLead.interest.style 
          } 
      });
  };

  // --- FULL DETAILED VIEW ---
  if (selectedLead) {
      return (
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                          <ArrowLeft size={18}/>
                      </button>
                      
                      {/* Bigger Avatar in Details */}
                      <div className="relative">
                          {selectedLead.avatarUrl ? (
                              <img src={selectedLead.avatarUrl} alt={selectedLead.name} className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm" />
                          ) : (
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm border-2 border-white ${selectedLead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                  {selectedLead.name.charAt(0)}
                              </div>
                          )}
                      </div>

                      <div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white">{selectedLead.name}</h2>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                              <span>{selectedLead.phone}</span>
                              <span>•</span>
                              <span className="capitalize">{selectedLead.source}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-1.5">
                      <Button variant={isEditing ? 'primary' : 'secondary'} onClick={() => setIsEditing(!isEditing)} className="h-8 text-xs px-3">
                          {isEditing ? 'Terminat' : 'Editează'}
                      </Button>
                      <Button onClick={() => handleUpdateLead(selectedLead.id, { status: 'Platit' })} className="h-8 text-xs px-3 bg-green-600 hover:bg-green-700 border-none text-white">Convertește</Button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                  {/* Status Bar */}
                  <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
                      {columnsKanban.map(status => (
                          <button key={status} onClick={() => handleUpdateLead(selectedLead.id, { status })} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${selectedLead.status === status ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
                              {status}
                          </button>
                      ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Info & Scheduler */}
                      <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm"><Target size={16}/> Interes</h3>
                              
                              <div className="mb-3">
                                  <p className="text-[10px] text-gray-500 font-bold uppercase mb-1.5">Stil Dans</p>
                                  {isEditing ? (
                                      <div className="flex flex-wrap gap-1.5">
                                          {Object.values(DanceStyle).map(style => {
                                              const isActive = selectedLead.interest.styles?.includes(style) || selectedLead.interest.style === style;
                                              return (
                                                  <button 
                                                      key={style}
                                                      onClick={() => toggleLeadStyle(style)}
                                                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                                  >
                                                      {style}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                  ) : (
                                      <div>
                                          {renderStyleCell(selectedLead)}
                                      </div>
                                  )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div><p className="text-[10px] text-gray-500 font-bold uppercase">Nivel</p><p>{selectedLead.interest.level}</p></div>
                                  <div><p className="text-[10px] text-gray-500 font-bold uppercase">Zile Preferate</p><p>{selectedLead.interest.preferredDays?.join(', ') || '-'}</p></div>
                                  <div><p className="text-[10px] text-gray-500 font-bold uppercase">Probabilitate</p><p className={selectedLead.probability > 70 ? 'text-green-600 font-black' : 'text-gray-900'}>{selectedLead.probability}%</p></div>
                              </div>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2 text-sm"><CalendarCheck size={16}/> Programare</h3>
                              <GroupScheduler lead={selectedLead} onSave={handleUpdateLead} />
                          </div>
                      </div>

                      {/* Right: Notes & AI Activity */}
                      <div className="space-y-4">
                          {/* AI Sales Coach Widget */}
                          <div className="bg-gradient-to-br from-indigo-900 to-purple-800 p-4 rounded-xl border border-indigo-700 shadow-sm text-white">
                              <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm"><BrainCircuit size={16} className="text-yellow-400"/> Sales Assistant</h3>
                              
                              {!isRecording && !audioURL && !analysisData && (
                                  <div className="flex gap-1.5">
                                      <button onClick={startRecording} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95">
                                          <Mic size={14}/> Înregistrează Apel
                                      </button>
                                      <label className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all border border-white/20">
                                          <Upload size={14}/> Upload
                                          <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                                      </label>
                                  </div>
                              )}

                              {isRecording && (
                                  <div className="flex flex-col items-center gap-3 py-2">
                                      <div className="animate-pulse text-red-400 font-bold flex items-center gap-2"><Mic size={16}/> Se înregistrează...</div>
                                      <button onClick={stopRecording} className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-bold">Stop</button>
                                  </div>
                              )}

                              {(audioURL || isAnalyzing) && (
                                  <div className="space-y-4">
                                      {audioURL && <audio src={audioURL} controls className="w-full h-8 mt-2 opacity-90 rounded" />}
                                      
                                      {isAnalyzing ? (
                                          <div className="flex items-center gap-2 text-indigo-200 text-sm"><Loader2 size={14} className="animate-spin"/> Se analizează conversația cu AI...</div>
                                      ) : analysisData ? (
                                          <div className="bg-white/10 rounded-xl p-3 text-sm space-y-2 border border-white/10 mt-2">
                                              <div className="flex justify-between items-start">
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${analysisData.sentiment === 'positive' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>{analysisData.sentiment}</span>
                                                  <span className="font-bold text-yellow-400">{analysisData.probability}% Șanse</span>
                                              </div>
                                              <p className="text-indigo-100 text-xs italic">"{analysisData.summary}"</p>
                                              <div className="pt-2 border-t border-white/10">
                                                  <p className="text-[10px] text-indigo-300 uppercase font-bold mb-1">Obiecții:</p>
                                                  <div className="flex flex-wrap gap-1">
                                                      {analysisData.objections?.map((obj: string, i: number) => (
                                                          <span key={i} className="text-[10px] bg-red-500/20 text-red-200 px-1.5 rounded">{obj}</span>
                                                      ))}
                                                  </div>
                                              </div>
                                              <Button onClick={handleApplyAnalysis} className="w-full h-8 text-xs bg-white text-indigo-900 hover:bg-indigo-50 mt-2">Salvează în Note</Button>
                                          </div>
                                      ) : null}
                                  </div>
                              )}
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <div className="flex justify-between items-center mb-3">
                                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm"><StickyNote size={16}/> Notițe</h3>
                              </div>
                              <textarea 
                                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-xs min-h-[80px] outline-none focus:border-blue-500 mb-2"
                                  placeholder="Scrie o notă..."
                                  value={newNote}
                                  onChange={(e) => setNewNote(e.target.value)}
                              />
                              <div className="flex justify-end items-center">
                                  <Button onClick={() => { if(!newNote.trim()) return; handleUpdateLead(selectedLead.id, { notes: newNote + '\n' + (selectedLead.notes || '') }); setNewNote(''); }} disabled={!newNote.trim()} className="!w-auto h-8 text-xs px-3">Adaugă</Button>
                              </div>
                              <div className="mt-3 space-y-2 max-h-[150px] overflow-y-auto no-scrollbar">
                                  {selectedLead.notes && (
                                      <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-[11px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                          {selectedLead.notes}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- LIST VIEW ---
  return (
      <div className="h-full flex flex-col">
          {activeFilterDropdown && <div className="fixed inset-0 z-40" onClick={() => setActiveFilterDropdown(null)}></div>}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 shrink-0">
              <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Leaduri</h1>
                  <p className="text-gray-400 dark:text-gray-500 font-medium text-xs">Gestionează potențialii cursanți.</p>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                  <div className="relative flex-1 md:flex-none">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                          type="text" 
                          placeholder="Caută..." 
                          className="w-full md:w-40 lg:w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg items-center relative shrink-0">
                      <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><LayoutList size={16}/></button>
                      <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><LayoutGrid size={16}/></button>
                      
                      <div className="h-3 w-px bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                      
                      <div className="relative">
                          <button 
                              onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)} 
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${groupBy ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
                          >
                              <Layers size={12}/> {groupBy ? `By ${groupBy}` : 'Group'}
                          </button>
                          {isGroupMenuOpen && (
                              <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsGroupMenuOpen(false)}></div>
                                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 w-40 z-50 animate-in fade-in zoom-in duration-200">
                                      <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Grupează după</p>
                                      {[
                                          { id: null, label: 'Fără Grupare' },
                                          { id: 'status', label: 'Status' },
                                          { id: 'source', label: 'Sursă' },
                                          { id: 'style', label: 'Stil Dans' },
                                          { id: 'gender', label: 'Sex' },
                                      ].map(opt => (
                                          <button 
                                              key={String(opt.id)}
                                              onClick={() => { setGroupBy(opt.id as any); setIsGroupMenuOpen(false); }}
                                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${groupBy === opt.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                          >
                                              {opt.label}
                                              {groupBy === opt.id && <Check size={12}/>}
                                          </button>
                                      ))}
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
                  <Button onClick={() => setIsAddModalOpen(true)} className="!w-auto h-8 px-3 text-[11px] bg-brand-yellow text-gray-900 hover:bg-yellow-500 gap-1.5 shrink-0"><UserPlus size={14}/> Lead Nou</Button>
              </div>
          </div>

          <div className="flex-1 overflow-hidden">
              {viewMode === 'kanban' ? (
                  <div className="h-full overflow-x-auto overflow-y-hidden flex gap-4 pb-4">
                      {columnsKanban.map(status => (
                          <div key={status} className="w-72 flex-shrink-0 flex flex-col h-full">
                              <div className="mb-2 flex justify-between items-center px-1">
                                  <span className="font-bold text-[11px] text-gray-400 uppercase tracking-wider">{status}</span>
                                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md">{leadsByStatus[status].length}</span>
                              </div>
                              <div 
                                  className="flex-1 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-1.5 overflow-y-auto no-scrollbar space-y-1.5"
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, status)}
                              >
                                  {leadsByStatus[status].map(lead => (
                                      <div 
                                          key={lead.id} 
                                          draggable 
                                          onDragStart={(e) => handleDragStart(e, lead.id)}
                                          onClick={() => handleLeadClick(lead)}
                                          className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md transition-all active:cursor-grabbing"
                                      >
                                          <div className="flex justify-between items-start mb-1.5">
                                              <div className="flex items-center gap-2">
                                                  {/* Avatar Logic */}
                                                  {lead.avatarUrl ? (
                                                      <img 
                                                          src={lead.avatarUrl} 
                                                          alt={lead.name} 
                                                          className="w-7 h-7 rounded-md object-cover border border-gray-100" 
                                                      />
                                                  ) : (
                                                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                                          {lead.name.charAt(0)}
                                                      </div>
                                                  )}
                                                  <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[140px]">{lead.name}</h4>
                                              </div>
                                              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${getStatusDotColor(lead.status)}`}></span>
                                          </div>
                                          <div className="mb-1.5">
                                              <GroupSelectorCell lead={lead} allGroups={groups} onUpdate={(u) => handleUpdateLead(lead.id, u)}/>
                                          </div>
                                          {lead.nextActionDate && (
                                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">
                                                  <Calendar size={10}/> {lead.nextActionDate}
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                      {/* Unified Scroll Container */}
                      <div className="flex-1 overflow-auto no-scrollbar relative">
                          <div className="min-w-fit">
                              {/* Header */}
                              <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-0 z-20">
                                  {columns.map(col => {
                                      const hasActiveFilter = col.filterOptions && (columnFilters as any)[col.id]?.length > 0;
                                      return (
                                          <div 
                                              key={col.id}
                                              className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group select-none relative"
                                              style={{ width: col.width, minWidth: col.minWidth }}
                                              draggable
                                              onDragStart={(e) => handleColDragStart(e, col.id)}
                                              onDragOver={(e) => handleColDragOver(e, col.id)}
                                              onDrop={(e) => handleColDrop(e, col.id)}
                                          >
                                              <div className="flex items-center gap-1 overflow-hidden flex-1">
                                                  <div 
                                                      className={`flex items-center gap-1 ${hasActiveFilter ? 'text-blue-600' : ''}`}
                                                      onClick={() => !col.noSort && handleSort(col.id as any)}
                                                  >
                                                      {col.label} 
                                                      {sortConfig?.key === col.id && (sortConfig.direction === 'asc' ? <ArrowUp size={10}/> : <ArrowDown size={10}/>)}
                                                  </div>
                                                  {col.filterOptions && (
                                                      <button 
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              setActiveFilterDropdown(activeFilterDropdown === col.id ? null : col.id);
                                                          }}
                                                          className={`ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${hasActiveFilter || activeFilterDropdown === col.id ? 'text-blue-600 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                                                      >
                                                          <Filter size={10} fill={hasActiveFilter ? "currentColor" : "none"} />
                                                      </button>
                                                  )}
                                              </div>
                                              
                                              {activeFilterDropdown === col.id && col.filterOptions && (
                                                  <FilterPopover colId={col.id} options={col.filterOptions} />
                                              )}

                                              <div className="w-1 h-4 bg-gray-300 dark:bg-gray-600 opacity-0 group-hover:opacity-50 cursor-col-resize rounded absolute right-0" onMouseDown={(e) => handleResizeStart(e, col.id, col.width)} onClick={(e) => e.stopPropagation()} />
                                          </div>
                                      );
                                  })}
                              </div>

                              {/* Body */}
                              <div className="flex-1">
                                  {groupedData ? (
                                      Array.from(groupedData.entries()).map(([groupTitle, groupLeads]) => (
                                          <React.Fragment key={groupTitle}>
                                              {/* COLLAPSIBLE GROUP HEADER */}
                                              <div 
                                                  className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-y border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none group"
                                                  onClick={() => toggleGroupCollapse(groupTitle)}
                                              >
                                                  <div className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-transform duration-200 ${collapsedGroups.has(groupTitle) ? '-rotate-90' : ''}`}>
                                                      <ChevronDown size={14} />
                                                  </div>
                                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{groupTitle}</span>
                                                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-bold">{groupLeads.length}</span>
                                                  
                                                  {/* Visual Drag Handle Hint (Placeholder for future DnD) */}
                                                  <div className="ml-auto opacity-0 group-hover:opacity-50">
                                                      <GripVertical size={12} className="text-gray-400"/>
                                                  </div>
                                              </div>
                                              
                                              {!collapsedGroups.has(groupTitle) && groupLeads.map(lead => (
                                                  <div key={lead.id} onClick={() => handleLeadClick(lead)} className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                                                      {columns.map(col => (
                                                          <div key={col.id} className="px-3 py-2 flex items-center overflow-hidden text-[13px] text-gray-700 dark:text-gray-300" style={{ width: col.width, minWidth: col.minWidth }}>
                                                              {col.id === 'status' ? <StatusCell lead={lead} /> : 
                                                               col.id === 'source' ? <SourceCell lead={lead} /> :
                                                               col.id === 'social' ? <div className="flex gap-1"><button onClick={(e) => handleSocialAction('whatsapp', lead, e)} className="p-1 rounded-md bg-green-50 text-green-600"><Phone size={12}/></button></div> :
                                                               col.id === 'name' ? (
                                                                  <div className="flex items-center gap-2">
                                                                      {lead.avatarUrl ? (
                                                                          <img src={lead.avatarUrl} className="w-8 h-8 rounded-md object-cover border border-gray-100" alt={lead.name} />
                                                                      ) : (
                                                                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                                                              {lead.name.charAt(0)}
                                                                          </div>
                                                                      )}
                                                                      <span className="font-bold text-gray-900 dark:text-white truncate text-xs">{lead.name}</span>
                                                                  </div>
                                                               ) :
                                                               col.id === 'groups' ? <GroupSelectorCell lead={lead} allGroups={groups} onUpdate={(u) => handleUpdateLead(lead.id, u)}/> :
                                                                col.id === 'gender' ? (
                                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F] dark:bg-pink-900/30 dark:text-pink-300' : lead.gender === 'M' ? 'bg-[#E3F2FD] text-[#0D47A1] dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                                        {lead.gender === 'M' ? 'M' : lead.gender === 'F' ? 'F' : '-'}
                                                                    </div>
                                                                ) :
                                                               <span className="truncate">{col.id === 'phone' ? lead.phone : col.id === 'notes' ? lead.notes : col.id === 'date' ? lead.nextActionDate : ''}</span>
                                                              }
                                                          </div>
                                                      ))}
                                                  </div>
                                              ))}
                                          </React.Fragment>
                                      ))
                                  ) : (
                                      filteredLeads.map(lead => (
                                          <div key={lead.id} onClick={() => handleLeadClick(lead)} className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                                              {columns.map(col => (
                                                  <div key={col.id} className="px-4 py-3 flex items-center overflow-hidden text-sm text-gray-700 dark:text-gray-300" style={{ width: col.width, minWidth: col.minWidth }}>
                                                      {col.id === 'status' ? <StatusCell lead={lead} /> : 
                                                       col.id === 'source' ? <SourceCell lead={lead} /> :
                                                       col.id === 'social' ? <div className="flex gap-1"><button onClick={(e) => handleSocialAction('whatsapp', lead, e)} className="p-1.5 rounded-lg bg-green-50 text-green-600"><Phone size={14}/></button></div> :
                                                       col.id === 'name' ? (
                                                          <div className="flex items-center gap-3">
                                                              {lead.avatarUrl ? (
                                                                  <img src={lead.avatarUrl} className="w-10 h-10 rounded-lg object-cover border border-gray-100" alt={lead.name} />
                                                              ) : (
                                                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                                                      {lead.name.charAt(0)}
                                                                  </div>
                                                              )}
                                                              <span className="font-bold text-gray-900 dark:text-white truncate text-sm">{lead.name}</span>
                                                          </div>
                                                       ) :
                                                       col.id === 'groups' ? <GroupSelectorCell lead={lead} allGroups={groups} onUpdate={(u) => handleUpdateLead(lead.id, u)}/> :
                                                       col.id === 'gender' ? (
                                                           <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F] dark:bg-pink-900/30 dark:text-pink-300' : lead.gender === 'M' ? 'bg-[#E3F2FD] text-[#0D47A1] dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                               {lead.gender === 'M' ? 'M' : lead.gender === 'F' ? 'F' : '-'}
                                                           </div>
                                                       ) :
                                                       <span className="truncate">{col.id === 'phone' ? lead.phone : col.id === 'notes' ? lead.notes : col.id === 'date' ? lead.nextActionDate : ''}</span>
                                                      }
                                                  </div>
                                              ))}
                                          </div>
                                      ))
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* Add Lead Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adaugă Lead Nou">
                <div className="space-y-3">
                    <Input label="Nume" value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="Ex: Popescu Ion" className="h-9 text-xs" />
                    <Input label="Telefon" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="07xx xxx xxx" className="h-9 text-xs" />
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-400">Sursă</label>
                        <select 
                            value={newLeadSource} 
                            onChange={(e) => setNewLeadSource(e.target.value as LeadSource)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-xs outline-none focus:border-blue-500"
                        >
                            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-3">
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} className="h-9 text-xs">Anulează</Button>
                        <Button onClick={handleCreateLead} className="h-9 text-xs">Salvează</Button>
                    </div>
                </div>
            </Modal>
      </div>
  );
};
