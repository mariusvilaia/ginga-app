
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, UserPlus, Phone, MessageCircle, AlertTriangle, Sparkles, X, CalendarCheck, StickyNote, ArrowLeft, Mail, Check, TrendingUp, User, MapPin, Calendar, MoreHorizontal, Target, ArrowRight, ListTodo, LayoutGrid, LayoutList, ChevronDown, Filter, ArrowUp, ArrowDown, CheckSquare, Square, Facebook, Instagram, Send, RotateCcw, Save, Briefcase, Tag, Flag, Camera, Upload, Loader2, Edit2, Mars, Venus, EyeOff, Eye, FileText, GripVertical, Globe, Megaphone, Users, Mic, Play, Pause, BrainCircuit, ChevronRight, Layers, Plus, Archive, Trash2 } from 'lucide-react';
import { MOCK_LEADS } from '../../constants';
import { LeadStage, LeadCategory, STAGE_TO_CATEGORY, Lead, DanceStyle, SkillLevel, ActivityLog, LeadSource, GroupDetailedProfile } from '../../types';
import { TargetIcon } from '../../components/shared/TargetIcon';
import { Button, Badge, Switch, Input, Modal } from '../../components/UIComponents';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { useData } from '../../contexts/DataContext';
import { GroupScheduler } from './components/GroupScheduler';
import { getLevelBadgeColor } from '../../utils/themeUtils';
import { LeadDetailView } from './components/LeadDetailView';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { normalizeText, smartSearch } from '../../utils/searchUtils';
import { guessGenderByName } from '../../utils/genderUtils';
import { analyzeSalesCall } from '../../services/geminiService';

interface LeadsViewProps {
    onNavigateToStudent: (id: string) => void;
    onAddTask: (title: string, priority?: 'high'|'medium'|'low', tag?: string, assignee?: {name: string, avatarUrl: string}, description?: string, status?: 'inbox' | 'pending' | 'done' | 'archived') => void;
}

type SortKey = 'gender' | 'name' | 'phone' | 'status' | 'style' | 'groups' | 'day' | 'notes' | 'date';
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
    groups: string[];
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
    notes: '',
    groups: []
};

const STAGE_OPTIONS = Object.values(LeadStage);
const SOURCE_OPTIONS = ['Website form', 'Facebook Lead Ads', 'Instagram DM', 'Referral', 'Direct call', 'Walk-in', 'Whatsapp'];

// Helper for Title Case
const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getRelevantDateFieldByStatus = (lead: Lead, status: string): string | undefined => {
    switch (status) {
        case 'Nou': return lead.createdAt || lead.entryDate;
        case 'Programat': 
            if (lead.scheduledClasses && lead.scheduledClasses.length > 0) {
                const upcoming = lead.scheduledClasses.map(c => c.date).sort();
                return upcoming[0];
            }
            return lead.scheduledClassDateTime;
        case 'Prezent': return lead.attendedAt;
        case 'Înrolat': return lead.enrolledAt;
        case 'Plătit': return lead.paidAt;
        default: return lead.createdAt || lead.entryDate;
    }
};

const getDateLabel = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    
    // Normalize to local date string YYYY-MM-DD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = toDateStr(today);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toDateStr(tomorrow);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateStr(yesterday);

    if (dateStr === todayStr) return 'Azi';
    if (dateStr === tomorrowStr) return 'Mâine';
    if (dateStr === yesterdayStr) return 'Ieri';
    
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
};

const groupLeadsByDate = (leads: Lead[], status: string) => {
    const groups: Record<string, Lead[]> = {};
    const noDateLeads: Lead[] = [];

    leads.forEach(lead => {
        const dateStr = getRelevantDateFieldByStatus(lead, status);
        if (!dateStr) {
            noDateLeads.push(lead);
        } else {
            const dateOnly = dateStr.split('T')[0];
            if (!groups[dateOnly]) groups[dateOnly] = [];
            groups[dateOnly].push(lead);
        }
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
        if (status === 'Programat') {
            return new Date(a).getTime() - new Date(b).getTime(); // Earliest upcoming first
        } else {
            return new Date(b).getTime() - new Date(a).getTime(); // Most recent first
        }
    });

    return { groups, sortedKeys, noDateLeads };
};

const getNextDateForDay = (dayName: string, time: string) => {
    const days: Record<string, number> = {
        'Duminică': 0, 'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6,
        'Duminica': 0, 'Marti': 2, 'Sambata': 6
    };
    const dayIndex = days[dayName];
    if (dayIndex === undefined) return '';
    
    const today = new Date();
    let diff = (dayIndex + 7 - today.getDay()) % 7;
    
    if (diff === 0) {
        const [hours, minutes] = time.split(':').map(Number);
        if (today.getHours() > hours || (today.getHours() === hours && today.getMinutes() >= minutes)) {
            diff = 7;
        }
    }
    
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + diff);
    
    const yyyy = resultDate.getFullYear();
    const mm = String(resultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(resultDate.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}T${time}`;
};

export const LeadsView: React.FC<LeadsViewProps> = ({ onNavigateToStudent, onAddTask }) => {
  const { groups, leads: contextLeads, updateLead, addLead, deleteLead } = useData(); 
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showLost, setShowLost] = useState(false);
  
  // Audio & AI State
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [savedAudioPath, setSavedAudioPath] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sync leads from context
  useEffect(() => {
      setLeads(contextLeads.length > 0 ? contextLeads : MOCK_LEADS);
  }, [contextLeads]);

  // Detail View State
  const [newNote, setNewNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulingLeadId, setSchedulingLeadId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{date: string, style: string, groupId?: string}[]>([{date: '', style: ''}]);
  const [notifyMethod, setNotifyMethod] = useState<'whatsapp' | 'messenger' | 'none'>('whatsapp');

  // New Lead Form
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadGender, setNewLeadGender] = useState<'M' | 'F' | ''>('');
  const [isGenderManuallySet, setIsGenderManuallySet] = useState(false);
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>('Walk-in');
  const [newLeadStyles, setNewLeadStyles] = useState<DanceStyle[]>([DanceStyle.SALSA]);

  // Sorting & Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  
  // Grouping State (Notion Style)
  const [groupBy, setGroupBy] = useState<string | null>('status'); // 'status', 'source', 'style', 'gender', 'date'
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
          { id: 'style', label: 'Stil', width: 150, minWidth: 100, filterOptions: Object.values(DanceStyle) },
          { id: 'groups', label: 'Grupe', width: 300, minWidth: 200 },
          { id: 'status', label: 'Stage', width: 160, minWidth: 130, filterOptions: STAGE_OPTIONS },
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

  // Auto-guess gender based on name
  useEffect(() => {
      if (!isGenderManuallySet && newLeadName.trim()) {
          const guessed = guessGenderByName(newLeadName);
          setNewLeadGender(guessed);
      }
  }, [newLeadName, isGenderManuallySet]);

  const handleCreateLead = async () => {
        if (!newLeadName || !newLeadPhone) return;
        
        const newLead: Lead = {
            id: `l_${Date.now()}`,
            name: newLeadName,
            phone: newLeadPhone,
            email: newLeadEmail,
            gender: newLeadGender || undefined,
            source: newLeadSource,
            entryDate: new Date().toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' }),
            stage: LeadStage.NEW,
            activities: [],
            stageHistory: [],
            interest: {
                styles: newLeadStyles,
                style: newLeadStyles[0] || DanceStyle.SALSA,
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
        setNewLeadEmail('');
        setNewLeadGender('');
        setIsGenderManuallySet(false);
        setNewLeadSource('Walk-in');
        setNewLeadStyles([DanceStyle.SALSA]);
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
          // 1. Upload to backend
          const formData = new FormData();
          formData.append('recording', blob);
          formData.append('leadName', selectedLead?.name || 'unknown');
          
          const uploadRes = await fetch('/api/recordings/upload', {
              method: 'POST',
              body: formData
          });
          const uploadData = await uploadRes.json();
          
          let currentAudioPath = null;
          if (uploadData.success) {
              currentAudioPath = uploadData.filePath;
              setSavedAudioPath(currentAudioPath);
              
              // Add initial recording activity
              const newActivity: ActivityLog = {
                  id: `act_rec_${Date.now()}`,
                  type: 'recording',
                  date: new Date().toLocaleString('ro-RO'),
                  description: `Apel înregistrat.`,
                  performedBy: 'Sistem',
                  recordingUrl: currentAudioPath
              };
              handleUpdateLead(selectedLead!.id, {
                  activityLog: [...(selectedLead!.activityLog || []), newActivity]
              });
          }

          // 2. AI Analysis
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
          console.error("Analysis or upload failed:", error);
          alert("Procesarea audio a eșuat.");
          setIsAnalyzing(false);
      }
  };

  const handleApplyAnalysis = () => {
      if (analysisData && selectedLead) {
          const newNoteContent = `[AI Analysis]\nSummary: ${analysisData.summary}\nSentiment: ${analysisData.sentiment}\nObjections: ${analysisData.objections.join(', ')}`;
          const updatedNotes = (selectedLead.notes || '') + '\n\n' + newNoteContent;
          
          const newActivity: ActivityLog = {
              id: `act_ai_${Date.now()}`,
              type: 'transcription',
              date: new Date().toLocaleString('ro-RO'),
              description: `Analiză AI finalizată: ${analysisData.summary.substring(0, 100)}...`,
              performedBy: 'Ginga AI'
          };

          handleUpdateLead(selectedLead.id, { 
              notes: updatedNotes,
              probability: analysisData.probability,
              activityLog: [...(selectedLead.activityLog || []), newActivity]
          });
          setAnalysisData(null); 
          setSavedAudioPath(null);
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

  const columnsKanban: LeadStage[] = Object.values(LeadStage);
  
  const filteredLeads = useMemo(() => {
      let result = leads.filter(l => {
          if (searchTerm) {
              const matchesGlobal = smartSearch(searchTerm, l.name) || l.phone.includes(searchTerm);
              if (!matchesGlobal) return false;
          }

          if (columnFilters.gender.length > 0 && !columnFilters.gender.includes(l.gender || '')) return false;
          if (columnFilters.source.length > 0 && !columnFilters.source.includes(l.source)) return false;
          if (columnFilters.status.length > 0 && !columnFilters.status.includes(l.stage)) return false;
          
          if (columnFilters.style.length > 0) {
              const primaryMatch = columnFilters.style.includes(l.interest.style);
              const stylesMatch = l.interest.styles?.some(s => columnFilters.style.includes(s));
              const groupMatch = l.interest.groupIds?.some(gid => {
                  const grp = groups.find(g => g.id === gid);
                  return grp && columnFilters.style.includes(grp.style);
              });
              if (!primaryMatch && !groupMatch && !stylesMatch) return false;
          }

          if (columnFilters.name && !l.name?.toLowerCase()?.includes(columnFilters.name.toLowerCase())) return false;
          if (columnFilters.phone && !l.phone?.includes(columnFilters.phone)) return false;
          if (columnFilters.notes && !l.notes?.toLowerCase()?.includes(columnFilters.notes.toLowerCase())) return false;
          if (columnFilters.date && !l.nextActionDate?.toLowerCase()?.includes(columnFilters.date.toLowerCase())) return false;
          if (columnFilters.groups.length > 0) {
              const hasGroup = l.interest.groupIds?.some(gid => {
                  const grp = groups.find(g => g.id === gid);
                  return grp && columnFilters.groups.includes(grp.name);
              });
              if (!hasGroup) return false;
          }

          return true;
      });

      if (sortConfig) {
          result.sort((a, b) => {
              const getValue = (item: Lead, key: SortKey) => {
                  switch (key) {
                      case 'name': return (item.name || '').toLowerCase();
                      case 'phone': return (item.phone || '').replace(/\D/g, ''); 
                      case 'status': return item.stage || '';
                      case 'gender': return item.gender || '';
                      case 'style': return `${item.interest.style} ${item.interest.level}`.toLowerCase();
                      case 'day': return (item.interest.preferredDays || []).join(', ');
                      case 'notes': return (item.notes || '').toLowerCase();
                      case 'groups': 
                          return (item.interest.groupIds || []).map(gid => groups.find(g => g.id === gid)?.name || '').join(', ');
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
          STAGE_OPTIONS.forEach(s => map.set(s, []));
      } else if (groupBy === 'source') {
          SOURCE_OPTIONS.forEach(s => map.set(s, []));
      }

      filteredLeads.forEach(lead => {
          let key = '';
          if (groupBy === 'status') key = lead.stage;
          else if (groupBy === 'source') key = lead.source;
          else if (groupBy === 'gender') key = lead.gender === 'M' ? 'Masculin' : lead.gender === 'F' ? 'Feminin' : 'Nedefinit';
          else if (groupBy === 'style') key = lead.interest.style;
          else if (groupBy === 'date') key = lead.entryDate;
          
          if (!key) key = 'Fără Grup';
          if (!map.has(key)) map.set(key, []);
          map.get(key)!.push(lead);
      });
      
      if (groupBy === 'status') {
          const sortedMap = new Map<string, Lead[]>();
          STAGE_OPTIONS.forEach(s => {
              if (map.has(s)) sortedMap.set(s, map.get(s)!);
          });
          return sortedMap;
      }
      
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

  const leadsByStatus = columnsKanban.reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter(l => l.stage === stage);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

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
      try { 
          // If stage is being updated, we need to handle it through the context's updateLead 
          // which has the validation logic.
          await updateLead(id, updates); 
      } catch (e) { 
          console.error(e); 
      }
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

  const handleDeleteLead = async (id: string) => {
      if (window.confirm('Ești sigur că vrei să ștergi acest lead?')) {
          setLeads(prev => prev.filter(l => l.id !== id));
          setSelectedLead(null);
          try { await deleteLead(id); } catch (e) { console.error(e); }
      }
  };

  const handleArchiveLead = async (id: string) => {
      // With only 5 statuses, archiving might not have a specific "Lost" stage.
      // We'll just close the detail view for now or we could add a 'hidden' flag.
      setSelectedLead(null);
  };

  const getStageDotColor = (stage: LeadStage) => {
      switch(stage) {
          case LeadStage.NEW: return 'bg-gray-400';
          case LeadStage.SCHEDULED: return 'bg-green-500';
          case LeadStage.ATTENDED: return 'bg-yellow-500';
          case LeadStage.ENROLLED: return 'bg-red-500';
          case LeadStage.PAID: return 'bg-black';
          default: return 'bg-gray-400';
      }
  }

  const getStatusDotColor = (status: any) => {
      return getStageDotColor(status as LeadStage);
  }

  // --- UNIFIED BADGE STYLES (BORDER + SOFT BG + TITLE CASE) ---
    const renderStageBadge = (stage: LeadStage) => {
        let styles = "bg-gray-50 text-gray-700 border-gray-200"; // Default
        let label = stage as string;

        switch(stage) {
            case LeadStage.NEW: 
                styles = "bg-gray-100 text-gray-700 border-gray-200"; 
                break;
            case LeadStage.SCHEDULED: 
                styles = "bg-green-50 text-green-700 border-green-200"; 
                break;
            case LeadStage.ATTENDED: 
                styles = "bg-yellow-50 text-yellow-700 border-yellow-200"; 
                break;
            case LeadStage.ENROLLED: 
                styles = "bg-red-50 text-red-700 border-red-200"; 
                break;
            case LeadStage.PAID: 
                styles = "bg-gray-900 text-white border-gray-900"; 
                break;
        }
        
        return <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles} whitespace-nowrap inline-block`}>{label}</span>;
    }

    const renderStatusBadge = (status: any) => {
        return renderStageBadge(status as LeadStage);
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
      
      return <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles} whitespace-nowrap inline-block`}>{label}</span>
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedLeadId(id);
      e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
      e.preventDefault();
      if (draggedLeadId) {
          const lead = leads.find(l => l.id === draggedLeadId);
          if (!lead) return;
          
          if (lead.stage === targetStage) return;

          if (targetStage === LeadStage.SCHEDULED) {
              setSchedulingLeadId(draggedLeadId);
              setScheduleForm([{ date: '', style: lead.interest?.style || '' }]);
              setIsScheduleModalOpen(true);
              setDraggedLeadId(null);
              return;
          }

          handleUpdateLead(draggedLeadId, { stage: targetStage });
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
                  {renderStageBadge(lead.stage)}
              </div>
              {isOpen && createPortal(
                  <div className="fixed inset-0 z-[9999] flex items-start justify-start" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                      <div className="absolute bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 min-w-[160px]" style={{ top: coords.top + 4, left: coords.left }}>
                          {STAGE_OPTIONS.map((opt) => (
                              <button key={opt} onClick={() => { handleUpdateLead(lead.id, { stage: opt as LeadStage }); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
                                  <div className="scale-90 origin-left pointer-events-none">{renderStageBadge(opt as LeadStage)}</div>
                                  {opt === lead.stage && <Check size={12} className="text-gray-400"/>}
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
          if (selectedIds.length === 0) return <button className="text-xs font-bold text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-md border border-gray-200 hover:border-blue-200 flex items-center gap-1 transition-all"><Plus size={12}/> Adaugă</button>;
          
          // Map IDs to Group Objects
          const selectedGroupsList = selectedIds.map(id => allGroups.find(g => g.id === id)).filter(g => !!g);
          
          return (
              <div className="flex flex-wrap gap-1 items-center">
                  {selectedGroupsList.map(grp => {
                      // CRITICAL FIX: Pass the group Name to detect "Start" keyword
                      const badgeColor = getLevelBadgeColor(grp!.name);
                      return (
                          <span key={grp!.id} className={`text-xs font-bold px-2 py-1 rounded-md border whitespace-nowrap ${badgeColor}`}>
                              {toTitleCase(grp!.name)}
                          </span>
                      );
                  })}
              </div>
          );
      };

      return (
          <>
                                              <div ref={containerRef} onClick={toggleDropdown} className="cursor-pointer min-h-[20px] flex items-center">
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

  const FilterPopover = ({ colId }: { colId: string }) => {
      const col = columns.find(c => c.id === colId);
      const options = useMemo(() => {
          if (colId === 'groups') return Array.from(new Set(groups.map(g => g.name))).sort();
          if (colId === 'style') return Object.values(DanceStyle);
          if (colId === 'gender') return ['M', 'F'];
          if (colId === 'source') return SOURCE_OPTIONS;
          if (colId === 'status') return STAGE_OPTIONS;
          if (colId === 'day') return ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
          return col?.filterOptions || [];
      }, [colId, col]);

      const isTextFilter = ['name', 'phone', 'notes', 'date'].includes(colId);
      const currentValues = (columnFilters as any)[colId] || (isTextFilter ? '' : []);
      
      const toggleOption = (opt: string) => {
          setColumnFilters(prev => {
              const current = (prev as any)[colId] as string[];
              const newValues = current.includes(opt) 
                  ? current.filter(o => o !== opt)
                  : [...current, opt];
              return { ...prev, [colId]: newValues };
          });
      };

      const handleTextChange = (val: string) => {
          setColumnFilters(prev => ({ ...prev, [colId]: val }));
      };

      const clearFilter = () => {
          setColumnFilters(prev => ({ ...prev, [colId]: isTextFilter ? '' : [] }));
      };

      return (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-3 w-56 z-50 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Filtrează</span>
                  <div className="flex items-center gap-1">
                      {(isTextFilter ? currentValues !== '' : (currentValues as string[]).length > 0) && (
                          <button onClick={clearFilter} className="text-[9px] font-bold text-blue-600 hover:underline mr-2">Șterge</button>
                      )}
                      <button onClick={() => setActiveFilterDropdown(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                          <X size={12} className="text-gray-400"/>
                      </button>
                  </div>
              </div>
              
              {isTextFilter ? (
                  <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                          autoFocus
                          type="text"
                          value={currentValues as string}
                          onChange={(e) => handleTextChange(e.target.value)}
                          placeholder="Caută..."
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                      />
                  </div>
              ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                      {options.map(opt => {
                          const isSelected = (currentValues as string[]).includes(opt);
                          // Calculate count
                          const count = leads.filter(l => {
                              if (colId === 'gender') return (l.gender || '') === opt;
                              if (colId === 'source') return l.source === opt;
                              if (colId === 'status') return l.stage === opt;
                              if (colId === 'style') {
                                  const primaryMatch = l.interest.style === opt;
                                  const stylesMatch = l.interest.styles?.includes(opt as DanceStyle);
                                  const groupMatch = l.interest.groupIds?.some(gid => {
                                      const grp = groups.find(g => g.id === gid);
                                      return grp && grp.style === opt;
                                  });
                                  return primaryMatch || stylesMatch || groupMatch;
                              }
                              if (colId === 'groups') {
                                  return l.interest.groupIds?.some(gid => {
                                      const grp = groups.find(g => g.id === gid);
                                      return grp && grp.name === opt;
                                  });
                              }
                              if (colId === 'day') return l.interest.preferredDays?.includes(opt);
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
              )}
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
          if (styleName === DanceStyle.BACHATA) return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
          if (styleName === DanceStyle.SALSA) return 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30';
          if (styleName === DanceStyle.KIZOMBA) return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30';
          return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      };

      return (
          <div className="flex flex-wrap gap-1">
              {styleList.slice(0, 3).map((s, i) => (
                  <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getBadgeStyle(s)}`}>
                      {s}
                  </span>
              ))}
              {styleList.length > 3 && (
                  <span className="text-[9px] font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500">
                      +{styleList.length - 3}
                  </span>
              )}
          </div>
      );
  };

  // --- FULL DETAILED VIEW ---
  if (selectedLead) {
      return (
          <LeadDetailView 
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onUpdate={handleUpdateLead}
              onDelete={handleDeleteLead}
              onArchive={handleArchiveLead}
              groups={groups}
              isRecording={isRecording}
              audioURL={audioURL}
              isAnalyzing={isAnalyzing}
              analysisData={analysisData}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onFileUpload={handleFileUpload}
              onApplyAnalysis={handleApplyAnalysis}
          />
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
                                          { id: 'style', label: 'Stil Dans' },
                                          { id: 'gender', label: 'Sex' },
                                          { id: 'date', label: 'Dată' },
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
                                  {(() => {
                                      const { groups, sortedKeys, noDateLeads } = groupLeadsByDate(leadsByStatus[status], status);
                                      
                                      const renderLeadCard = (lead: Lead) => (
                                          <div 
                                              key={lead.id} 
                                              draggable 
                                              onDragStart={(e) => handleDragStart(e, lead.id)}
                                              onClick={() => handleLeadClick(lead)}
                                              className="bg-white dark:bg-gray-800 p-2.5 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-all active:cursor-grabbing flex items-center gap-3 group relative"
                                          >
                                              {/* Avatar */}
                                              <div className="shrink-0">
                                                  {lead.avatarUrl ? (
                                                      <img 
                                                          src={lead.avatarUrl} 
                                                          alt={lead.name} 
                                                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" 
                                                      />
                                                  ) : (
                                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-sm ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                                          {lead.name.charAt(0)}
                                                      </div>
                                                  )}
                                              </div>

                                              {/* Info */}
                                              <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2">
                                                      <h4 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate">{lead.name}</h4>
                                                      <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} title={lead.phone} className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-1 rounded-full transition-colors shrink-0">
                                                          <Phone size={12} />
                                                      </a>
                                                  </div>
                                                  <div className="mt-1.5">
                                                      {renderStyleCell(lead)}
                                                  </div>
                                              </div>

                                              {/* More Options (Three dots) */}
                                              <div className="shrink-0 pr-2">
                                                  <MoreHorizontal size={16} className="text-gray-400" />
                                              </div>

                                              {/* Status Indicator (Subtle dot) */}
                                              <div className={`absolute top-3 right-8 w-2 h-2 rounded-full ${getStatusDotColor(lead.stage)}`}></div>
                                          </div>
                                      );

                                      return (
                                          <>
                                              {sortedKeys.map(dateKey => (
                                                  <div key={dateKey} className="mb-3">
                                                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                                                          {getDateLabel(dateKey)}
                                                      </div>
                                                      <div className="space-y-1.5">
                                                          {groups[dateKey].map(renderLeadCard)}
                                                      </div>
                                                  </div>
                                              ))}
                                              {noDateLeads.length > 0 && (
                                                  <div className="mb-3">
                                                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                                                          Fără dată
                                                      </div>
                                                      <div className="space-y-1.5">
                                                          {noDateLeads.map(renderLeadCard)}
                                                      </div>
                                                  </div>
                                              )}
                                          </>
                                      );
                                  })()}
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
                                      const filterVal = (columnFilters as any)[col.id];
                                      const hasActiveFilter = Array.isArray(filterVal) ? filterVal.length > 0 : !!filterVal;
                                      return (
                                          <div 
                                              key={col.id}
                                              className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group select-none relative"
                                              style={{ width: col.width, minWidth: col.minWidth }}
                                              draggable
                                              onDragStart={(e) => handleColDragStart(e, col.id)}
                                              onDragOver={(e) => handleColDragOver(e, col.id)}
                                              onDrop={(e) => handleColDrop(e, col.id)}
                                          >
                                              <div className="flex items-center gap-1 overflow-hidden flex-1">
                                                  <div 
                                                      className={`flex items-center gap-1 ${hasActiveFilter ? 'text-blue-600' : ''}`}
                                                      onClick={() => handleSort(col.id as any)}
                                                  >
                                                      {col.label} 
                                                      {sortConfig?.key === col.id && (sortConfig.direction === 'asc' ? <ArrowUp size={10}/> : <ArrowDown size={10}/>)}
                                                  </div>
                                                  <button 
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          setActiveFilterDropdown(activeFilterDropdown === col.id ? null : col.id);
                                                      }}
                                                      className={`ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${hasActiveFilter || activeFilterDropdown === col.id ? 'text-blue-600 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                                                  >
                                                      <Filter size={10} fill={hasActiveFilter ? "currentColor" : "none"} />
                                                  </button>
                                              </div>
                                              
                                              {activeFilterDropdown === col.id && (
                                                  <FilterPopover colId={col.id} />
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
                                                  className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm border-y border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none group"
                                                  onClick={() => toggleGroupCollapse(groupTitle)}
                                              >
                                                  <div className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-transform duration-200 ${collapsedGroups.has(groupTitle) ? '-rotate-90' : ''}`}>
                                                      <ChevronDown size={16} />
                                                  </div>
                                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{groupTitle}</span>
                                                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold">{groupLeads.length}</span>
                                                  
                                                  {/* Visual Drag Handle Hint (Placeholder for future DnD) */}
                                                  <div className="ml-auto opacity-0 group-hover:opacity-50">
                                                      <GripVertical size={12} className="text-gray-400"/>
                                                  </div>
                                              </div>
                                              
                                              {!collapsedGroups.has(groupTitle) && groupLeads.map(lead => (
                                                  <div key={lead.id} onClick={() => handleLeadClick(lead)} className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group">
                                                      {columns.map(col => (
                                                          <div key={col.id} className="px-3 py-2 flex items-center overflow-hidden text-sm text-gray-700 dark:text-gray-300" style={{ width: col.width, minWidth: col.minWidth }}>
                                                              {col.id === 'status' ? <StatusCell lead={lead} /> : 
                                                                col.id === 'style' ? renderStyleCell(lead) :
                                                                col.id === 'social' ? <div className="flex gap-1"><button onClick={(e) => handleSocialAction('whatsapp', lead, e)} className="p-1.5 rounded-md bg-green-50 text-green-600"><Phone size={14}/></button></div> :
                                                               col.id === 'name' ? (
                                                                  <div className="flex items-center gap-1.5">
                                                                      {lead.avatarUrl ? (
                                                                          <img src={lead.avatarUrl} className="w-8 h-8 rounded-md object-cover border border-gray-100" alt={lead.name} />
                                                                      ) : (
                                                                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                                                              {lead.name.charAt(0)}
                                                                          </div>
                                                                      )}
                                                                      <span className="font-bold text-gray-900 dark:text-white truncate text-sm">{lead.name}</span>
                                                                  </div>
                                                               ) :
                                                               col.id === 'groups' ? <GroupSelectorCell lead={lead} allGroups={groups} onUpdate={(u) => handleUpdateLead(lead.id, u)}/> :
                                                                col.id === 'gender' ? (
                                                                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F] dark:bg-pink-900/30 dark:text-pink-300' : lead.gender === 'M' ? 'bg-[#E3F2FD] text-[#0D47A1] dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                                        {lead.gender === 'M' ? 'M' : lead.gender === 'F' ? 'F' : '-'}
                                                                    </div>
                                                                ) :
                                                               col.id === 'phone' ? <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} title={lead.phone} className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"><Phone size={14} /></a> :
                                                               <span className="truncate">{col.id === 'notes' ? lead.notes : col.id === 'date' ? lead.nextActionDate : ''}</span>
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
                                                  <div key={col.id} className="px-3 py-2 flex items-center overflow-hidden text-sm text-gray-700 dark:text-gray-300" style={{ width: col.width, minWidth: col.minWidth }}>
                                                      {col.id === 'status' ? <StatusCell lead={lead} /> : 
                                                       col.id === 'style' ? renderStyleCell(lead) :
                                                       col.id === 'social' ? <div className="flex gap-1"><button onClick={(e) => handleSocialAction('whatsapp', lead, e)} className="p-1.5 rounded-md bg-green-50 text-green-600"><Phone size={14}/></button></div> :
                                                       col.id === 'name' ? (
                                                          <div className="flex items-center gap-1.5">
                                                              {lead.avatarUrl ? (
                                                                  <img src={lead.avatarUrl} className="w-8 h-8 rounded-md object-cover border border-gray-100" alt={lead.name} />
                                                              ) : (
                                                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F]' : 'bg-[#E3F2FD] text-[#0D47A1]'}`}>
                                                                      {lead.name.charAt(0)}
                                                                  </div>
                                                              )}
                                                              <span className="font-bold text-gray-900 dark:text-white truncate text-sm">{lead.name}</span>
                                                          </div>
                                                       ) :
                                                       col.id === 'groups' ? <GroupSelectorCell lead={lead} allGroups={groups} onUpdate={(u) => handleUpdateLead(lead.id, u)}/> :
                                                       col.id === 'gender' ? (
                                                           <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${lead.gender === 'F' ? 'bg-[#FCE4EC] text-[#880E4F] dark:bg-pink-900/30 dark:text-pink-300' : lead.gender === 'M' ? 'bg-[#E3F2FD] text-[#0D47A1] dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                               {lead.gender === 'M' ? 'M' : lead.gender === 'F' ? 'F' : '-'}
                                                           </div>
                                                       ) :
                                                       col.id === 'phone' ? <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} title={lead.phone} className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-1.5 rounded-full transition-colors inline-flex items-center justify-center"><Phone size={14} /></a> :
                                                       <span className="truncate">{col.id === 'notes' ? lead.notes : col.id === 'date' ? lead.nextActionDate : ''}</span>
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
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nume" value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} placeholder="Ex: Popescu Ion" className="h-9 text-xs" />
                        <Input label="Telefon" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="07xx xxx xxx" className="h-9 text-xs" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} placeholder="email@exemplu.com" className="h-9 text-xs" />
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-400">Sex</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { setNewLeadGender('M'); setIsGenderManuallySet(true); }} 
                                    className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${newLeadGender === 'M' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}
                                >
                                    Masculin
                                </button>
                                <button 
                                    onClick={() => { setNewLeadGender('F'); setIsGenderManuallySet(true); }} 
                                    className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${newLeadGender === 'F' ? 'bg-pink-600 border-pink-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-pink-300'}`}
                                >
                                    Feminin
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-400">Stiluri de interes</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(DanceStyle).map(style => {
                                    const isSelected = newLeadStyles.includes(style);
                                    return (
                                        <button
                                            key={style}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setNewLeadStyles(prev => prev.filter(s => s !== style));
                                                } else {
                                                    setNewLeadStyles(prev => [...prev, style]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                                        >
                                            {style}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                        <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} className="h-9 text-xs">Anulează</Button>
                        <Button onClick={handleCreateLead} className="h-9 text-xs">Salvează</Button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isScheduleModalOpen} onClose={() => { setIsScheduleModalOpen(false); setSchedulingLeadId(null); }} title="Programează Lead">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Selectează data, ora și stilul de dans pentru programare. Poți adăuga mai multe opțiuni.</p>
                    
                    {scheduleForm.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex-1 space-y-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Data și Ora</label>
                                    <Input 
                                        type="datetime-local" 
                                        value={item.date} 
                                        onChange={(e) => {
                                            const newForm = [...scheduleForm];
                                            newForm[index].date = e.target.value;
                                            setScheduleForm(newForm);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Grupă / Stil Dans</label>
                                    <select 
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-yellow outline-none transition-all"
                                        value={item.groupId ? `group_${item.groupId}` : (item.style ? `style_${item.style}` : '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const newForm = [...scheduleForm];
                                            
                                            if (val?.startsWith('group_')) {
                                                const gId = val.replace('group_', '');
                                                const selectedGroup = groups.find(g => g.id === gId);
                                                newForm[index].groupId = gId;
                                                newForm[index].style = selectedGroup ? selectedGroup.style : '';
                                                if (selectedGroup && selectedGroup.schedule) {
                                                    const nextDate = getNextDateForDay(selectedGroup.schedule.day, selectedGroup.schedule.time);
                                                    if (nextDate) {
                                                        newForm[index].date = nextDate;
                                                    }
                                                }
                                            } else if (val?.startsWith('style_')) {
                                                const styleName = val.replace('style_', '');
                                                newForm[index].groupId = '';
                                                newForm[index].style = styleName;
                                            } else {
                                                newForm[index].groupId = '';
                                                newForm[index].style = '';
                                            }
                                            
                                            setScheduleForm(newForm);
                                        }}
                                    >
                                        <option value="">Selectează grupa sau stilul</option>
                                        {Object.entries(
                                            groups.reduce((acc, group) => {
                                                const style = group.style || 'Altele';
                                                if (!acc[style]) acc[style] = [];
                                                acc[style].push(group);
                                                return acc;
                                            }, {} as Record<string, typeof groups>)
                                        ).map(([style, styleGroups]: [string, typeof groups]) => (
                                            <optgroup key={`opt_${style}`} label={`Grupe: ${style}`}>
                                                {styleGroups.map(group => (
                                                    <option key={`group_${group.id}`} value={`group_${group.id}`}>
                                                        {group.name} ({group.schedule?.day} {group.schedule?.time})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                        <optgroup label="Stiluri Generale (Fără grupă alocată)">
                                            {Object.values(DanceStyle).map(style => (
                                                <option key={`style_${style}`} value={`style_${style}`}>
                                                    Doar stil: {style}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            {scheduleForm.length > 1 && (
                                <button 
                                    onClick={() => setScheduleForm(scheduleForm.filter((_, i) => i !== index))}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    <Button 
                        variant="secondary" 
                        onClick={() => setScheduleForm([...scheduleForm, { date: '', style: '', groupId: '' }])}
                        className="w-full text-xs"
                    >
                        <Plus size={14} className="mr-1" /> Adaugă încă o programare
                    </Button>

                    <div className="py-2 space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Notificare Lead</label>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="notifyMethod"
                                    value="whatsapp"
                                    checked={notifyMethod === 'whatsapp'} 
                                    onChange={(e) => setNotifyMethod(e.target.value as any)}
                                    className="w-4 h-4 text-brand-yellow border-gray-300 focus:ring-brand-yellow"
                                />
                                Trimite mesaj automat pe WhatsApp
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="notifyMethod"
                                    value="messenger"
                                    checked={notifyMethod === 'messenger'} 
                                    onChange={(e) => setNotifyMethod(e.target.value as any)}
                                    className="w-4 h-4 text-brand-yellow border-gray-300 focus:ring-brand-yellow"
                                />
                                Copiază mesajul pentru Messenger / Instagram
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="notifyMethod"
                                    value="none"
                                    checked={notifyMethod === 'none'} 
                                    onChange={(e) => setNotifyMethod(e.target.value as any)}
                                    className="w-4 h-4 text-brand-yellow border-gray-300 focus:ring-brand-yellow"
                                />
                                Nu trimite notificare
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" onClick={() => { setIsScheduleModalOpen(false); setSchedulingLeadId(null); }}>Anulează</Button>
                        <Button 
                            onClick={async () => {
                                if (!schedulingLeadId) return;
                                const lead = leads.find(l => l.id === schedulingLeadId);
                                if (!lead) return;

                                const validClasses = scheduleForm.filter(c => c.date && (c.groupId || c.style));
                                if (validClasses.length === 0) {
                                    alert("Te rugăm să completezi cel puțin o programare validă (dată și grupă sau stil).");
                                    return;
                                }
                                
                                validClasses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                try {
                                    await handleUpdateLead(schedulingLeadId, { 
                                        stage: LeadStage.SCHEDULED, 
                                        scheduledClasses: validClasses,
                                        scheduledClassDateTime: validClasses[0].date
                                    });

                                    let message = `Salut ${lead.name.split(' ')[0]}!\n\nTe-am programat la cursurile de dans Ginga:\n`;
                                    validClasses.forEach(c => {
                                        const dateObj = new Date(c.date);
                                        const dateStr = dateObj.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
                                        const timeStr = dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
                                        const group = groups.find(g => g.id === c.groupId);
                                        const groupName = group ? group.name : c.style;
                                        message += `- ${groupName} pe ${dateStr}, ora ${timeStr}\n`;
                                    });
                                    message += `\nTe așteptăm cu drag!`;

                                    if (notifyMethod === 'whatsapp' && lead.phone) {
                                        let phone = lead.phone.replace(/\D/g, '');
                                        if (phone.startsWith('07')) phone = '40' + phone.substring(1);
                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                    } else if (notifyMethod === 'messenger') {
                                        navigator.clipboard.writeText(message).then(() => {
                                            alert('Mesajul a fost copiat în clipboard! Deschide Messenger sau Instagram și dă Paste (Lipește) în conversația cu lead-ul.');
                                        }).catch(err => {
                                            console.error('Failed to copy text: ', err);
                                            alert('Nu s-a putut copia mesajul automat. Te rugăm să-l copiezi manual.');
                                        });
                                    }

                                    setIsScheduleModalOpen(false);
                                    setSchedulingLeadId(null);
                                } catch (error) {
                                    console.error("Error scheduling lead", error);
                                }
                            }}
                        >
                            Salvează Programarea
                        </Button>
                    </div>
                </div>
            </Modal>
      </div>
  );
};
