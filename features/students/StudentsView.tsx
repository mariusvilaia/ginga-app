
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, UserPlus, FolderPlus, Plus, Download, ChevronRight, MessageCircle, CheckCircle, AlertTriangle, Loader2, Trash2, Edit2, GripVertical, Upload, ArrowUp, ArrowDown, Clock, ChevronDown, LayoutList, LayoutGrid, XCircle, CreditCard, Filter, X, CheckSquare, Square, Infinity, Check, Archive, RotateCcw, Phone, RefreshCw } from 'lucide-react';
import { Button, Modal } from '../../components/UIComponents';
import { getSubscriptionColor, getLevelBadgeColor } from '../../utils/themeUtils';
import { AddStudentModal } from './AddStudentModal';
import { StudentDetailedProfile, DanceStyle, SkillLevel, UserProfile } from '../../types';
import { useData } from '../../contexts/DataContext';
import { StudentDetailView } from './components/StudentDetailView';
import { normalizeText, smartSearch } from '../../utils/searchUtils';
import { calculateSubscriptionExpiryDate } from '../../utils/dateUtils';
import { guessGenderByName, guessRoleByGender } from '../../utils/genderUtils';
import { syncStripePayments } from '../../src/services/stripeService';
import { useLanguage } from '../../contexts/LanguageContext';

interface StudentsViewProps {
    initialStudentId: string | null;
    onClearInitial: () => void;
    onAddTask: (title: string, priority?: 'high'|'medium'|'low', tag?: string, assignee?: {name: string, avatarUrl: string}, description?: string, status?: 'inbox' | 'pending' | 'done' | 'archived') => void;
    currentUser: UserProfile;
    onNavigateToGroup?: (groupId: string) => void;
}

type ColId = 'name' | 'subscription' | 'days_left' | 'status' | 'groups' | 'actions';

export const StudentsView: React.FC<StudentsViewProps> = ({ initialStudentId, onClearInitial, onAddTask, currentUser, onNavigateToGroup }) => {
  const { language, t } = useLanguage();
  const { students, groups, updateStudent, addStudent, deleteStudent, removeStudentFromGroup, vacationPeriods } = useData(); 
  
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [detailViewStudentId, setDetailViewStudentId] = useState<string | null>(initialStudentId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<StudentDetailedProfile | null>(null);
  
  // Modal States
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null); // For permanent delete
  const [studentToRemoveFromGroup, setStudentToRemoveFromGroup] = useState<{id: string, name: string} | null>(null); // For removing from group
  const [syncingStudentId, setSyncingStudentId] = useState<string | null>(null);
  
  const [isAddEnrollmentModalOpen, setIsAddEnrollmentModalOpen] = useState(false);
  const [studentToAddEnrollment, setStudentToAddEnrollment] = useState<StudentDetailedProfile | null>(null);
  const [enrollmentGroupId, setEnrollmentGroupId] = useState<string>('');

  const handleSyncPayments = async (student: StudentDetailedProfile) => {
      setSyncingStudentId(student.id);
      try {
          const { payments: newPayments, subscription: syncedSubscription } = await syncStripePayments({
              email: student.email,
              name: student.name,
              phone: student.phone,
              stripeCustomerId: student.stripeCustomerId
          });

          let updatedSubscription = { ...student.subscription };
          let hasSubscriptionChanges = false;

          if (syncedSubscription) {
              let newPlan = updatedSubscription.type;
              if (syncedSubscription.planName?.includes('Bronze')) newPlan = 'Bronze';
              else if (syncedSubscription.planName?.includes('Silver')) newPlan = 'Silver';
              else if (syncedSubscription.planName?.includes('Gold')) newPlan = 'Gold';
              else if (syncedSubscription.planName?.includes('Platinum')) newPlan = 'Platinum';

              if (newPlan !== updatedSubscription.type) {
                  updatedSubscription.type = newPlan;
                  hasSubscriptionChanges = true;
              }
              
              if (syncedSubscription.status === 'active') {
                  updatedSubscription.active = true;
                  hasSubscriptionChanges = true;
              }
          }

          if (newPayments && newPayments.length > 0) {
              const stripePayments = newPayments;
              const stripeKeys = new Set(stripePayments.map(p => {
                  const datePart = p.date.includes('T') ? p.date.split('T')[0] : p.date;
                  return `${datePart}_${p.amount}`;
              }));

              const manualPaymentsToKeep = (student.paymentHistory || [])
                  .filter(p => !p.id || p.id.startsWith('pay_'))
                  .filter(p => {
                      const datePart = p.date.includes('T') ? p.date.split('T')[0] : p.date;
                      return !stripeKeys.has(`${datePart}_${p.amount}`);
                  });

              const updatedPaymentHistory = [...manualPaymentsToKeep, ...stripePayments];
              updatedPaymentHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              const addedCount = updatedPaymentHistory.length - (student.paymentHistory?.length || 0);

              const latestPayment = updatedPaymentHistory[0];
              let newExpiryDateStr = updatedSubscription.expiryDate;
              let newLastPaymentDate = updatedSubscription.lastPaymentDate;

              if (latestPayment) {
                  const adjustedExpiryDate = calculateSubscriptionExpiryDate(updatedPaymentHistory, updatedSubscription.expiryDate, vacationPeriods);
                  newExpiryDateStr = adjustedExpiryDate.toISOString().split('T')[0];
                  newLastPaymentDate = latestPayment.date;
              }

              await updateStudent(student.id, {
                  paymentHistory: updatedPaymentHistory,
                  subscription: {
                      ...updatedSubscription,
                      active: true,
                      lastPaymentDate: newLastPaymentDate,
                      expiryDate: newExpiryDateStr,
                  }
              });
              if (addedCount > 0) {
                  alert(t('members.syncSuccessAdded').replace('{name}', student.name).replace('{count}', addedCount.toString()) || `Sincronizare reușită pentru ${student.name}! ${addedCount} plăți noi adăugate.`);
              } else if (hasSubscriptionChanges) {
                  alert(t('members.syncSuccessUpdated').replace('{name}', student.name) || `Abonamentul a fost actualizat pentru ${student.name}. Istoricul plăților este la zi.`);
              } else {
                  alert(t('members.syncSuccessNoChanges').replace('{name}', student.name) || `Sincronizare reușită pentru ${student.name}! Istoricul a fost actualizat și corectat.`);
              }
          } else {
              if (hasSubscriptionChanges) {
                  await updateStudent(student.id, { subscription: updatedSubscription });
                  alert(t('members.syncSuccessUpdatedNoPayments').replace('{name}', student.name) || `Abonamentul a fost actualizat pentru ${student.name}, dar nu există plăți noi.`);
              } else {
                  alert(t('members.syncNoPaymentsFound').replace('{name}', student.name) || `Nu s-au găsit plăți noi în Stripe pentru ${student.name}.`);
              }
          }
      } catch (err: any) {
          console.error(`Eroare la sincronizarea plăților pentru ${student.name}:`, err);
          alert((t('members.syncError') || `Eroare la sincronizarea plăților: `) + err.message);
      } finally {
          setSyncingStudentId(null);
      }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('TOTI');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [sortConfig, setSortConfig] = useState<{ key: ColId; direction: 'asc' | 'desc' } | null>(null);

  // --- NEW FILTER STATE ---
  const [columnFilters, setColumnFilters] = useState({
      subscription: [] as string[],
      days_left: [] as string[],
      status: [] as string[]
  });
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);

  // Sync initialStudentId prop with state
  useEffect(() => {
      if (initialStudentId) {
          setDetailViewStudentId(initialStudentId);
          setSelectedIds(new Set([initialStudentId]));
          setLastSelectedId(initialStudentId);
      }
  }, [initialStudentId]);

  // Column State with Resizing Refs
  const [columns, setColumns] = useState<{id: ColId, label: string, width: number, filterOptions?: string[]}[]>([
      { id: 'name', label: t('members.colName'), width: 320 }, 
      { id: 'subscription', label: t('members.colPlan'), width: 110, filterOptions: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Staff'] },
      { id: 'days_left', label: t('members.colValidity'), width: 160, filterOptions: ['Valid', 'Expiră curând', 'Expirat'] }, 
      { id: 'status', label: t('members.colStatus'), width: 110, filterOptions: ['Activ', 'Inactiv', 'Risc', 'Restant'] },
      { id: 'groups', label: t('members.colGroups'), width: 220 }, // Flexible column
      { id: 'actions', label: t('members.colActions'), width: 180 },
  ]);

  const resizingColId = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

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

  // Updated Days Left logic
  const getAdjustedExpiryDate = (student: StudentDetailedProfile) => {
      return student.subscription?.expiryDate ? new Date(student.subscription.expiryDate) : new Date();
  };

  const getDaysLeft = (student: StudentDetailedProfile) => {
      if (!student.subscription?.expiryDate) return 0;
      const expiryDate = getAdjustedExpiryDate(student);
      return Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  };

  const baseStudentsForFilters = useMemo(() => {
      return students.filter(student => {
        // 1. Global Search (Smart Search for Name)
        const isNameMatch = smartSearch(searchTerm, student.name);
        const isPhoneMatch = (student.phone || '').includes(searchTerm);
        
        if (!isNameMatch && !isPhoneMatch) return false;

        if (selectedGroupId && !student.enrollments.some(enr => enr.groupId === selectedGroupId) && student.mainGroup !== groups.find(g => g.id === selectedGroupId)?.name) return false;
        
        const isStaff = student.subscription?.type === 'Staff';
        const daysLeft = getDaysLeft(student);
        const isArchived = student.status === 'inactive';

        // 2. Quick Filters (Top Bar)
        if (activeFilter === 'ARCHIVED') {
            return isArchived;
        }
        
        // Hide archived students from normal views
        if (isArchived) return false;

        if (activeFilter === 'ACTIV' && student.status !== 'active') return false;
        if (activeFilter === 'RISC' && student.risk?.level !== 'high') return false;
        
        // FIX: Exclude from "RESTANT" view if (Is Staff) OR (Days Left >= 0)
        if (activeFilter === 'RESTANT' && (isStaff || daysLeft >= 0)) return false; 
        
        if (activeFilter === 'NOI' && !(student.joinDate || '').includes(new Date().toISOString().slice(0, 7))) return false;
        if (activeFilter === 'LEADER') {
            const role = student.enrollments?.[0]?.role || guessRoleByGender(student.gender);
            if (role !== 'Leader') return false;
        }
        if (activeFilter === 'FOLLOWER') {
            const role = student.enrollments?.[0]?.role || guessRoleByGender(student.gender);
            if (role !== 'Follower') return false;
        }
        if (['GOLD', 'SILVER', 'BRONZE'].includes(activeFilter) && !(student.subscription?.type || '').toUpperCase().includes(activeFilter)) return false;
        
        // Style Filters
        if (['Salsa', 'Bachata', 'Kizomba'].includes(activeFilter)) {
             if (!student.enrollments?.some(e => e.style === activeFilter)) return false;
        }

        return true;
      });
  }, [students, searchTerm, selectedGroupId, activeFilter]);

  const filteredStudents = useMemo(() => {
      let result = baseStudentsForFilters.filter(student => {
        const isStaff = student.subscription?.type === 'Staff';
        const daysLeft = getDaysLeft(student);

        // 3. Column Specific Filters
        // Plan Filter
        if (columnFilters.subscription.length > 0) {
            if (!columnFilters.subscription.some(plan => (student.subscription?.type || '').includes(plan))) return false;
        }

        // Validity Filter (Days Left)
        if (columnFilters.days_left.length > 0) {
            let status = 'Valid';
            if (isStaff) {
                status = 'Valid';
            } else {
                if (daysLeft < 0) status = 'Expirat';
                else if (daysLeft <= 5) status = 'Expiră curând';
            }
            
            if (!columnFilters.days_left.includes(status)) return false;
        }

        // Status Filter
        if (columnFilters.status.length > 0) {
            let derivedStatus = 'Activ';
            if (isStaff) {
                derivedStatus = 'Activ';
            } else {
                if (daysLeft < 0) derivedStatus = 'Restant';
                else if (student.risk?.level === 'high') derivedStatus = 'Risc';
                else if (!student.subscription.active) derivedStatus = 'Inactiv';
            }

            if (!columnFilters.status.includes(derivedStatus)) return false;
        }

        return true;
      });

      if (sortConfig) {
          result.sort((a, b) => {
              let aVal: any = a[sortConfig.key as keyof StudentDetailedProfile] || '';
              let bVal: any = b[sortConfig.key as keyof StudentDetailedProfile] || '';
              if (sortConfig.key === 'days_left') { aVal = getAdjustedExpiryDate(a).getTime(); bVal = getAdjustedExpiryDate(b).getTime(); }
              if (sortConfig.key === 'subscription') { aVal = a.subscription?.type || ''; bVal = b.subscription?.type || ''; }
              return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
          });
      }
      return result;
  }, [baseStudentsForFilters, columnFilters, sortConfig]);

  const handleSort = (key: ColId) => setSortConfig({ key, direction: sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  
  const handleFixRoles = async () => {
      let fixedCount = 0;
      for (const student of students) {
          const correctGender = guessGenderByName(student.name);
          const correctRole = guessRoleByGender(correctGender);
          
          let needsUpdate = false;
          const updates: any = {};
          
          if (student.gender !== correctGender) {
              updates.gender = correctGender;
              needsUpdate = true;
          }
          
          // Check enrollments
          if (student.enrollments && student.enrollments.length > 0) {
              const enrollment = student.enrollments[0];
              if (enrollment.role !== correctRole) {
                  const newEnrollments = [...student.enrollments];
                  newEnrollments[0] = { ...newEnrollments[0], role: correctRole };
                  updates.enrollments = newEnrollments;
                  needsUpdate = true;
              }
          }
          
          if (needsUpdate) {
              await updateStudent(student.id, updates);
              fixedCount++;
          }
      }
      alert(`Verificare completă! Am corectat datele pentru ${fixedCount} membri.`);
  };

  // --- ROW CLICK HANDLER (MULTI-SELECT LOGIC) ---
  const handleRowClick = (e: React.MouseEvent, studentId: string) => {
      // Prevent selection if clicking an action button inside the row
      if ((e.target as HTMLElement).closest('.actions-group')) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isShift && lastSelectedId) {
          const currentIndex = filteredStudents.findIndex(s => s.id === studentId);
          const lastIndex = filteredStudents.findIndex(s => s.id === lastSelectedId);
          
          if (currentIndex !== -1 && lastIndex !== -1) {
              const start = Math.min(currentIndex, lastIndex);
              const end = Math.max(currentIndex, lastIndex);
              const range = filteredStudents.slice(start, end + 1);
              
              const newSet = new Set(isCtrl ? selectedIds : []);
              range.forEach(s => newSet.add(s.id));
              
              setSelectedIds(newSet);
              setDetailViewStudentId(null); // Keep list open for multi-select
              return;
          }
      }

      if (isCtrl) {
          const newSet = new Set(selectedIds);
          if (newSet.has(studentId)) newSet.delete(studentId);
          else {
              newSet.add(studentId);
              setLastSelectedId(studentId);
          }
          setSelectedIds(newSet);
          setDetailViewStudentId(null); // Keep list open
      } else {
          // Single Click -> Open Detail
          setSelectedIds(new Set([studentId]));
          setLastSelectedId(studentId);
          setDetailViewStudentId(studentId);
      }
  };

  const handleBulkDelete = async () => {
      if (confirm(`Sigur ștergi ${selectedIds.size} membri selectați?`)) {
          const idsToDelete = Array.from(selectedIds);
          // Process sequentially to avoid firing too many writes at once if huge list
          for (const id of idsToDelete) {
              await deleteStudent(id);
          }
          setSelectedIds(new Set());
      }
  };

  const handleRemoveAction = async (studentId: string, studentName: string) => {
      if (selectedGroupId) {
          // Context: Specific Group Selected -> Open Remove from Group Modal
          setStudentToRemoveFromGroup({ id: studentId, name: studentName });
      } else {
          // Context: All Students -> Delete Profile
          setStudentToDelete({id: studentId, name: studentName});
      }
  };

  const handleArchiveStudent = async (studentId: string, studentName: string) => {
      if (confirm(`Ești sigur că vrei să arhivezi membrul ${studentName}?`)) {
          await updateStudent(studentId, { status: 'inactive' });
      }
  };

  const handleRestoreStudent = async (studentId: string, studentName: string) => {
      if (confirm(`Reactivezi membrul ${studentName}?`)) {
          await updateStudent(studentId, { status: 'active' });
      }
  };

  const confirmRemoveFromGroup = async () => {
      if (studentToRemoveFromGroup && selectedGroupId) {
          try {
              await removeStudentFromGroup(studentToRemoveFromGroup.id, selectedGroupId);
              setStudentToRemoveFromGroup(null);
          } catch (error) {
              console.error("Failed to remove student from group", error);
              alert("Nu s-a putut elimina studentul din grupă.");
          }
      }
  };

  const handleAddEnrollment = async () => {
      if (!studentToAddEnrollment || !enrollmentGroupId) return;
      
      const group = groups.find(g => g.id === enrollmentGroupId);
      if (!group) return;
      
      if (studentToAddEnrollment.enrollments?.some(e => e.groupId === enrollmentGroupId)) {
          alert('Cursantul este deja înscris în această grupă.');
          return;
      }

      const newEnrollment = {
          groupId: group.id,
          groupName: group.name,
          style: group.style,
          level: group.level,
          role: studentToAddEnrollment.gender === 'M' ? 'Leader' : 'Follower',
          schedule: `${group.schedule.day} ${group.schedule.time}`,
          start_date: new Date().toISOString().split('T')[0]
      };

      const updatedEnrollments = [...(studentToAddEnrollment.enrollments || []), newEnrollment];
      
      const updates: any = { enrollments: updatedEnrollments };
      if (updatedEnrollments.length === 1) {
          updates.mainGroup = group.name;
      }

      await updateStudent(studentToAddEnrollment.id, updates);
      setIsAddEnrollmentModalOpen(false);
      setStudentToAddEnrollment(null);
      setEnrollmentGroupId('');
  };

  const renderCell = (student: StudentDetailedProfile, colId: ColId) => {
      if (!student.subscription) return null; // Safety check
      const isStaff = student.subscription.type === 'Staff';

      if (colId === 'name') {
          const role = student.enrollments?.[0]?.role || guessRoleByGender(student.gender);
          const borderColor = role === 'Leader' ? 'border-blue-400' : 'border-pink-400';
          return (
              <div className="flex items-center gap-4">
                  <img 
                      src={student.avatarUrl} 
                      className={`w-14 h-14 rounded-full border-[3px] ${borderColor} object-cover shadow-sm bg-gray-50 shrink-0`} 
                      alt={student.name}
                  />
                  <div className="min-w-0">
                      <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight dark:text-white truncate">
                              {student.name} {student.nickname && <span className="text-gray-400 font-medium text-[10px]">({student.nickname})</span>}
                          </h4>
                          <a href={`tel:${student.phone}`} onClick={(e) => e.stopPropagation()} title={student.phone} className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-1 rounded-full transition-colors shrink-0">
                              <Phone size={12} />
                          </a>
                      </div>
                  </div>
              </div>
          );
      }

      if (colId === 'subscription') return <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border ${getSubscriptionColor(student.subscription.type || '')}`}>{student.subscription.type}</span>;
      if (colId === 'days_left') {
          if (isStaff) {
              return (
                  <div className="w-full pr-6">
                    <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><Infinity size={12}/> Nelimitat</span>
                        <span className="text-[9px] text-gray-400">Staff Access</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gray-900 w-full" />
                    </div>
                  </div>
              );
          }
          const days = getDaysLeft(student);
          const isExpired = days < 0;
          const color = isExpired ? 'bg-red-500' : days < 5 ? 'bg-yellow-500' : 'bg-green-500';
          return (
            <div className="w-full pr-6">
                <div className="flex justify-between mb-1.5">
                    <span className={`text-xs font-bold ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                        {isExpired ? `${t('members.expired')} de ${Math.abs(days)} zile` : `${days} ${t('members.daysLeft')}`}
                    </span>
                    {student.subscription.lastPaymentDate && (
                        <span className="text-[9px] text-gray-400 flex items-center gap-1" title="Ultima plată">
                            <CreditCard size={10}/> {new Date(student.subscription.lastPaymentDate).toLocaleDateString('ro-RO', {day: '2-digit', month: '2-digit'})}
                        </span>
                    )}
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${isExpired ? 100 : Math.min(100, Math.max(0, (days / 30) * 100))}%` }} />
                </div>
            </div>
          );
      }
      if (colId === 'status') {
          if (isStaff) {
              return <span className="flex items-center gap-1.5 text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-gray-200"><CheckCircle size={10}/> Staff</span>;
          }
          if (student.status === 'inactive') {
              return <span className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-gray-200"><Archive size={10}/> Arhivat</span>;
          }

          const days = getDaysLeft(student);
          
          if (days < 0) {
              return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-red-100"><XCircle size={10}/> Restant</span>;
          }
          if (student.risk?.level === 'high') {
              return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-orange-100"><AlertTriangle size={10}/> Risc</span>;
          }
          if (!student.subscription.active) {
              return <span className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-gray-200"><XCircle size={10}/> Inactiv</span>;
          }
          return <span className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-100"><CheckCircle size={10}/> Activ</span>;
      }
      if (colId === 'groups') return (
          <div className="flex items-center gap-2 w-full">
              <div className="flex flex-wrap gap-1">
                  {student.enrollments?.map((enr, i) => (
                      <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded border truncate ${getLevelBadgeColor(enr.level)}`}>
                          {enr.groupName || enr.style}
                      </span>
                  ))}
              </div>
              <button 
                  onClick={(e) => { e.stopPropagation(); setStudentToAddEnrollment(student); setIsAddEnrollmentModalOpen(true); }} 
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all opacity-0 group-hover:opacity-100 shrink-0"
                  title="Adaugă în grupă"
              >
                  <Plus size={14}/>
              </button>
          </div>
      );
      
      if (colId === 'actions') return (
          <div className="flex justify-end gap-2 actions-group">
              <button 
                  onClick={(e) => { e.stopPropagation(); handleSyncPayments(student); }} 
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title={t('members.syncPayments')}
                  disabled={syncingStudentId === student.id}
              >
                  <RefreshCw size={18} className={syncingStudentId === student.id ? "animate-spin text-indigo-600" : ""} />
              </button>
              <button 
                  onClick={(e) => { e.stopPropagation(); setStudentToEdit(student); setIsAddModalOpen(true); }} 
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title={t('general.edit')}
              >
                  <Edit2 size={18}/>
              </button>
              
              {student.status === 'inactive' ? (
                  <button 
                      onClick={(e) => { e.stopPropagation(); handleRestoreStudent(student.id, student.name); }} 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Reactivează"
                  >
                      <RotateCcw size={18}/>
                  </button>
              ) : (
                  <button 
                      onClick={(e) => { e.stopPropagation(); handleArchiveStudent(student.id, student.name); }} 
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      title="Arhivează"
                  >
                      <Archive size={18}/>
                  </button>
              )}

              <button 
                  onClick={(e) => { e.stopPropagation(); handleRemoveAction(student.id, student.name); }} 
                  className={`p-2 rounded-full transition-colors ${selectedGroupId ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                  title={selectedGroupId ? "Elimină din grupă" : "Șterge membru"}
              >
                  <Trash2 size={18}/>
              </button>
              <button 
                  onClick={() => { setDetailViewStudentId(student.id); setSelectedIds(new Set([student.id])); }} 
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Detalii"
              >
                  <ChevronRight size={18}/>
              </button>
          </div>
      );
      return null;
  };

  const FilterPopover = ({ 
      colId, 
      options 
  }: { 
      colId: string;
      options: string[];
  }) => {
      const currentValues = columnFilters[colId as keyof typeof columnFilters] || [];
      
      const getOptionCount = (opt: string) => {
          return baseStudentsForFilters.filter(s => {
              if (colId === 'subscription') return (s.subscription?.type || '').includes(opt);
              if (colId === 'days_left') {
                  const isStaff = s.subscription?.type === 'Staff';
                  if (isStaff) return opt === 'Valid'; // Staff always valid

                  const days = getDaysLeft(s);
                  let status = 'Valid';
                  if (days < 0) status = 'Expirat';
                  else if (days <= 5) status = 'Expiră curând';
                  return status === opt;
              }
              if (colId === 'status') {
                  const isStaff = s.subscription?.type === 'Staff';
                  if (isStaff) return opt === 'Activ';

                  const days = getDaysLeft(s);
                  let derivedStatus = 'Activ';
                  if (days < 0) derivedStatus = 'Restant';
                  else if (s.risk?.level === 'high') derivedStatus = 'Risc';
                  else if (!s.subscription.active) derivedStatus = 'Inactiv';
                  return derivedStatus === opt;
              }
              return false;
          }).length;
      };

      const toggleOption = (opt: string) => {
          setColumnFilters(prev => {
              const current = prev[colId as keyof typeof columnFilters];
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
              <div className="space-y-1">
                  {options.map(opt => {
                      const isSelected = currentValues.includes(opt);
                      const count = getOptionCount(opt);
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

  // Derive the object for the detail view


  // Helper for counts
  const getStyleCount = (style: string) => students.filter(s => s.status === 'active' && s.enrollments?.some(e => e.style === style)).length;

  return (
    <>
      {/* Overlay to close dropdowns */}
      {activeFilterDropdown && <div className="fixed inset-0 z-0" onClick={() => setActiveFilterDropdown(null)}></div>}

      {detailViewStudentId ? (
        <StudentDetailView 
            studentId={detailViewStudentId} 
            onClose={() => { setDetailViewStudentId(null); onClearInitial(); }} 
            onSave={(s) => { updateStudent(s.id, s); setStudentToEdit(null); }} 
            onDelete={() => { if (detailViewStudentId) deleteStudent(detailViewStudentId); setDetailViewStudentId(null); }} 
            onAddTask={(studentName) => onAddTask(`Contact ${studentName}`, 'medium')} 
            onUpdateProfileImage={(b64) => { if (detailViewStudentId) updateStudent(detailViewStudentId, { avatarUrl: b64 }); }} 
            onNavigateToGroup={onNavigateToGroup}
        />
      ) : (
        <div className="h-full flex flex-col relative">
           
           {/* BULK ACTIONS BAR */}
           {selectedIds.size > 0 && !detailViewStudentId && (
               <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#111827] text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4 border border-gray-800">
                   <span className="text-sm font-bold text-white">{selectedIds.size} {t('members.selected')}</span>
                   <div className="h-5 w-px bg-gray-700"></div>
                   <button onClick={handleBulkDelete} className="text-sm font-bold text-[#EF4444] hover:text-[#DC2626] flex items-center gap-2 transition-colors">
                       <Trash2 size={18}/> {t('general.delete')}
                   </button>
                   <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white" title={t('members.clearSelection')}>
                       <X size={18}/>
                   </button>
               </div>
           )}

           <div className="flex justify-between items-end mb-6 gap-6 shrink-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  <div onClick={() => setActiveFilter('RESTANT')} className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeFilter === 'RESTANT' ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                      <p className={`text-[9px] font-bold uppercase ${activeFilter === 'RESTANT' ? 'text-red-600' : 'text-gray-400'}`}>{t('members.filterDebt')}</p>
                      <p className="text-lg font-black text-red-600">{students.filter(s => s.status === 'active' && s.subscription?.type !== 'Staff' && s.subscription?.expiryDate && getDaysLeft(s) < 0).length}</p>
                  </div>
                  
                  {['Salsa', 'Bachata', 'Kizomba'].map(style => (
                      <div 
                          key={style}
                          onClick={() => setActiveFilter(activeFilter === style ? 'TOTI' : style)}
                          className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 group ${
                              activeFilter === style 
                              ? style === 'Salsa' ? 'border-yellow-400 ring-1 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' :
                                style === 'Bachata' ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/10' :
                                'border-purple-500 ring-1 ring-purple-500 bg-purple-50 dark:bg-purple-900/10'
                              : 'border-gray-100 dark:border-gray-800'
                          }`}
                      >
                          <p className={`text-[9px] font-bold uppercase ${
                              activeFilter === style 
                              ? style === 'Salsa' ? 'text-yellow-600' :
                                style === 'Bachata' ? 'text-red-600' :
                                'text-purple-600'
                              : 'text-gray-400'
                          }`}>{style.toUpperCase()}</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white">{getStyleCount(style)}</p>
                      </div>
                  ))}

                  <div onClick={() => setActiveFilter('TOTI')} className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeFilter === 'TOTI' ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                      <p className={`text-[9px] font-bold uppercase ${activeFilter === 'TOTI' ? 'text-blue-600' : 'text-gray-400'}`}>{t('members.filterAll')}</p>
                      <p className="text-lg font-black text-gray-900 dark:text-white">{students.filter(s => s.status === 'active').length}</p>
                  </div>
                  
                  <div onClick={() => setActiveFilter('NOI')} className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeFilter === 'NOI' ? 'border-green-500 ring-1 ring-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                      <p className={`text-[9px] font-bold uppercase ${activeFilter === 'NOI' ? 'text-green-600' : 'text-gray-400'}`}>NOI</p>
                      <p className="text-lg font-black text-green-600">+{students.filter(s => s.status === 'active' && (s.joinDate || '').includes(new Date().toISOString().slice(0, 7))).length}</p>
                  </div>

                  <div onClick={() => setActiveFilter('ARCHIVED')} className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeFilter === 'ARCHIVED' ? 'border-gray-500 ring-1 ring-gray-500 bg-gray-50 dark:bg-gray-800' : 'border-gray-100 dark:border-gray-800'}`}>
                      <p className={`text-[9px] font-bold uppercase ${activeFilter === 'ARCHIVED' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>{t('members.filterInactive')}</p>
                      <p className="text-lg font-black text-gray-600 dark:text-gray-400">{students.filter(s => s.status === 'inactive').length}</p>
                  </div>

                  <div onClick={() => setActiveFilter(activeFilter === 'LEADER' ? 'TOTI' : 'LEADER')} className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeFilter === 'LEADER' ? 'border-blue-400 ring-1 ring-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                      <p className={`text-[9px] font-bold uppercase ${activeFilter === 'LEADER' ? 'text-blue-600' : 'text-gray-400'}`}>LEADERI</p>
                      <p className="text-lg font-black text-blue-600">{students.filter(s => s.status === 'active' && (s.enrollments?.[0]?.role || guessRoleByGender(s.gender)) === 'Leader').length}</p>
                  </div>

                  <div onClick={() => setActiveFilter(activeFilter === 'FOLLOWER' ? 'TOTI' : 'FOLLOWER')} className={`bg-white dark:bg-gray-900 p-2 w-24 rounded-xl border shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 ${activeFilter === 'FOLLOWER' ? 'border-pink-400 ring-1 ring-pink-400 bg-pink-50 dark:bg-pink-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                      <p className={`text-[9px] font-bold uppercase ${activeFilter === 'FOLLOWER' ? 'text-pink-600' : 'text-gray-400'}`}>FOLLOWERE</p>
                      <p className="text-lg font-black text-pink-600">{students.filter(s => s.status === 'active' && (s.enrollments?.[0]?.role || guessRoleByGender(s.gender)) === 'Follower').length}</p>
                  </div>
              </div>
              <div className="flex gap-3">
                 <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl"><button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><LayoutList size={14} /> Listă</button><button onClick={() => setViewMode('gallery')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${viewMode === 'gallery' ? 'bg-white shadow-sm' : 'text-gray-500'}`}><LayoutGrid size={14} /> Galerie</button></div>
                 <Button onClick={() => { setStudentToEdit(null); setIsAddModalOpen(true); }} className="!w-auto h-10 px-4 text-xs gap-2 bg-brand-yellow text-gray-900 hover:bg-yellow-500"><UserPlus size={14} /> {t('members.addMember')}</Button>
              </div>
           </div>

           {viewMode === 'list' ? (
               <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-4 shrink-0">
                      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder={t('members.searchPlaceholder')} className="w-full bg-gray-50 border-gray-200 rounded-xl py-2 pl-9 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                      <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 border-gray-200 rounded-xl px-3 text-xs font-bold"><option value="">Toate Grupele</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                  </div>
                  
                  {/* Unified Scroll Container */}
                  <div className="flex-1 overflow-auto no-scrollbar relative">
                      <div className="min-w-fit">
                          {/* Header */}
                          <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-0 z-20">
                              {columns.map(col => {
                                  const hasActiveFilter = col.filterOptions && columnFilters[col.id as keyof typeof columnFilters]?.length > 0;
                                  const isFlexible = col.id === 'groups' || col.id === 'name';
                                  
                                  return (
                                      <div 
                                          key={col.id} 
                                          className={`px-6 py-4 text-[10px] font-bold text-gray-400 uppercase relative group select-none flex items-center justify-between ${isFlexible ? 'flex-1' : ''}`}
                                          style={isFlexible ? { minWidth: col.width } : { width: col.width, minWidth: col.width }}
                                          draggable={false}
                                      >
                                          <div className="flex items-center gap-1 overflow-hidden flex-1">
                                              <div 
                                                  className={`cursor-pointer hover:text-gray-900 transition-colors flex items-center gap-1 ${hasActiveFilter ? 'text-blue-600' : ''}`}
                                                  onClick={() => handleSort(col.id)}
                                              >
                                                  {col.label} 
                                                  {sortConfig?.key === col.id && (
                                                      sortConfig.direction === 'asc' ? <ArrowUp size={12} className="inline"/> : <ArrowDown size={12} className="inline"/>
                                                  )}
                                              </div>
                                              
                                              {col.filterOptions && (
                                                  <button 
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          setActiveFilterDropdown(activeFilterDropdown === col.id ? null : col.id);
                                                      }}
                                                      className={`ml-1 p-1 rounded hover:bg-gray-200 transition-colors ${hasActiveFilter || activeFilterDropdown === col.id ? 'text-blue-600 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`}
                                                  >
                                                      <Filter size={12} fill={hasActiveFilter ? "currentColor" : "none"} />
                                                  </button>
                                              )}
                                          </div>

                                          {activeFilterDropdown === col.id && col.filterOptions && (
                                              <FilterPopover colId={col.id} options={col.filterOptions} />
                                          )}

                                          {/* Resize Handle */}
                                          <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-gray-300 z-20"
                                              onMouseDown={(e) => handleResizeStart(e, col.id, col.width)}
                                              onClick={(e) => e.stopPropagation()}
                                          />
                                      </div>
                                  );
                              })}
                          </div>

                          {/* Body */}
                          <div className="flex flex-col">
                              {filteredStudents.map(student => (
                                  <div 
                                      key={student.id} 
                                      className={`flex border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group ${selectedIds.has(student.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`} 
                                      onClick={(e) => handleRowClick(e, student.id)}
                                  >
                                      {columns.map(col => {
                                          const isFlexible = col.id === 'groups' || col.id === 'name';
                                          return (
                                              <div 
                                                  key={col.id} 
                                                  className={`px-6 py-4 flex items-center overflow-hidden ${isFlexible ? 'flex-1' : ''}`} 
                                                  style={isFlexible ? { minWidth: col.width } : { width: col.width, minWidth: col.width }}
                                              >
                                                  {renderCell(student, col.id)}
                                              </div>
                                          );
                                      })}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
               </div>
           ) : (
               <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                   <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border">
                      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder={t('members.searchPlaceholder')} className="w-full bg-gray-50 border-gray-200 rounded-xl py-2 pl-9 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                      <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 border-gray-200 rounded-xl px-3 text-xs font-bold"><option value="">Toate Grupele</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                       {filteredStudents.map(student => {
                           if (!student.subscription) return null;
                           const isStaff = student.subscription.type === 'Staff';
                           const daysLeft = getDaysLeft(student);
                           const isExpired = !isStaff && daysLeft < 0;
                           const isRisk = student.risk?.level === 'high';
                           const isSelected = selectedIds.has(student.id);
                           const isArchived = student.status === 'inactive';
                           
                           return (
                               <div key={student.id} onClick={(e) => handleRowClick(e, student.id)} className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border hover:shadow-lg transition-all cursor-pointer flex flex-col items-center group relative overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-gray-100'} ${isArchived ? 'opacity-70' : ''}`}>
                                   {isExpired && !isArchived && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>}
                                   {!isExpired && isRisk && !isArchived && <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>}
                                   {!isExpired && !isRisk && !isArchived && <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>}
                                   {isArchived && <div className="absolute top-0 left-0 right-0 h-1 bg-gray-400"></div>}
                                   
                                   {(() => {
                                       const role = student.enrollments?.[0]?.role || guessRoleByGender(student.gender);
                                       const borderColor = role === 'Leader' ? 'border-blue-400' : 'border-pink-400';
                                       return (
                                           <img src={student.avatarUrl} className={`w-20 h-20 rounded-full object-cover border-[3px] ${borderColor} shadow-sm mb-3 group-hover:scale-105 transition-transform`} />
                                       );
                                   })()}
                                   <div className="flex items-center justify-center gap-2 mb-3">
                                       <h4 className="font-bold text-gray-900 dark:text-white text-center text-sm line-clamp-1">{student.name}</h4>
                                       <a href={`tel:${student.phone}`} onClick={(e) => e.stopPropagation()} title={student.phone} className="text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 p-1 rounded-full transition-colors shrink-0">
                                           <Phone size={12} />
                                       </a>
                                       <button 
                                           onClick={(e) => { e.stopPropagation(); handleSyncPayments(student); }} 
                                           className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 p-1 rounded-full transition-colors shrink-0"
                                           title={t('members.syncPayments')}
                                           disabled={syncingStudentId === student.id}
                                       >
                                           <RefreshCw size={12} className={syncingStudentId === student.id ? "animate-spin" : ""} />
                                       </button>
                                   </div>
                                   
                                   <div className="flex gap-1 mb-3 justify-center w-full flex-wrap">
                                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getSubscriptionColor(student.subscription.type || '')}`}>{student.subscription.type}</span>
                                       {isArchived ? (
                                           <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">ARHIVAT</span>
                                       ) : isStaff ? (
                                           <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-gray-100 text-gray-600 border-gray-200">NELIMITAT</span>
                                       ) : isExpired ? (
                                           <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-red-50 text-red-600 border-red-100">EXP</span>
                                       ) : (
                                           <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-green-50 text-green-600 border-green-100">{daysLeft} ZILE</span>
                                       )}
                                   </div>
                                   
                                   {(() => {
                                       const styles = Array.from(new Set(student.enrollments.map(e => e.style).filter(Boolean)));
                                       if (styles.length === 0) return null;
                                       return (
                                           <div className="flex gap-1 mb-3 justify-center w-full flex-wrap">
                                               {styles.map(style => {
                                                   let colorClass = 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
                                                   if (style === 'Salsa') colorClass = 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30';
                                                   if (style === 'Bachata') colorClass = 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
                                                   if (style === 'Kizomba') colorClass = 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30';
                                                   return (
                                                       <span key={style} className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${colorClass}`}>
                                                           {style}
                                                       </span>
                                                   );
                                               })}
                                           </div>
                                       );
                                   })()}
                                   
                                   <div className="w-full flex items-center justify-center gap-1 border-t border-gray-50 pt-2 mt-auto">
                                       <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                                           {student.enrollments.length > 0 ? student.enrollments[0].groupName : t('members.noGroup')}
                                       </p>
                                       <button 
                                           onClick={(e) => { e.stopPropagation(); setStudentToAddEnrollment(student); setIsAddEnrollmentModalOpen(true); }} 
                                           className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                           title="Adaugă în grupă"
                                       >
                                           <Plus size={12}/>
                                       </button>
                                   </div>
                                   
                                   {isSelected && (
                                       <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md">
                                           <CheckSquare size={12} />
                                       </div>
                                   )}
                               </div>
                           );
                       })}
                   </div>
               </div>
           )}
        </div>
      )}
      
      {/* ADD STUDENT MODAL */}
      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={(s) => { addStudent(s); setIsAddModalOpen(false); }} initialData={studentToEdit}/>
      


      {/* DELETE CONFIRMATION MODAL (PERMANENT) */}
      <Modal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} title="Confirmare">
          <div className="p-4">
              <p>Sigur ștergi definitiv profilul lui <strong>{studentToDelete?.name}</strong>?</p>
              <div className="flex gap-2 mt-4 justify-end">
                  <Button variant="secondary" onClick={() => setStudentToDelete(null)}>Nu</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { if(studentToDelete) deleteStudent(studentToDelete.id); setStudentToDelete(null); }}>Da, Șterge</Button>
              </div>
          </div>
      </Modal>

      {/* REMOVE FROM GROUP MODAL (NEW) */}
      <Modal isOpen={!!studentToRemoveFromGroup} onClose={() => setStudentToRemoveFromGroup(null)} title="Elimină din Grupă">
          <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                  Sigur vrei să elimini studentul <strong>{studentToRemoveFromGroup?.name}</strong> din grupa <strong>{groups.find(g => g.id === selectedGroupId)?.name || 'Selectată'}</strong>?
              </p>
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl text-xs mb-4 border border-yellow-100 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0"/>
                  <span>Această acțiune va șterge înscrierea curentă din profilul studentului. Istoricul de prezență va rămâne neschimbat.</span>
              </div>
              <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setStudentToRemoveFromGroup(null)}>Anulează</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmRemoveFromGroup}>Da, Elimină</Button>
              </div>
          </div>
      </Modal>

      {/* ADD ENROLLMENT MODAL */}
      <Modal isOpen={isAddEnrollmentModalOpen} onClose={() => { setIsAddEnrollmentModalOpen(false); setStudentToAddEnrollment(null); setEnrollmentGroupId(''); }} title="Adaugă în Grupă">
          <div className="space-y-4">
              <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Selectează Grupa pentru {studentToAddEnrollment?.name}</label>
                  <select
                      value={enrollmentGroupId}
                      onChange={(e) => setEnrollmentGroupId(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-all dark:text-white"
                  >
                      <option value="">-- Alege o grupă --</option>
                      {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.style} - {g.level})</option>
                      ))}
                  </select>
              </div>
              <div className="flex gap-3 pt-4">
                  <Button variant="secondary" onClick={() => { setIsAddEnrollmentModalOpen(false); setStudentToAddEnrollment(null); setEnrollmentGroupId(''); }} className="flex-1">Anulează</Button>
                  <Button onClick={handleAddEnrollment} disabled={!enrollmentGroupId} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none">Adaugă</Button>
              </div>
          </div>
      </Modal>
    </>
  );
};
