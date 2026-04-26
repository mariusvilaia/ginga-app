
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Edit2, MessageCircle, Instagram, Facebook, Linkedin, Trash2, Camera, Upload, Crop, TrendingUp, RefreshCw, Calendar, XCircle, CheckCircle, AlertTriangle, Clock, Wallet, Activity, ShieldAlert, BarChart3, User, Archive, RotateCcw, Loader2 } from 'lucide-react';
import { StudentDetailedProfile, AdminNote } from '../../../types';
import { Button, Modal, Badge } from '../../../components/UIComponents';
import { getSubscriptionColor } from '../../../utils/themeUtils';
import { calculateSubscriptionExpiryDate } from '../../../utils/dateUtils';
import { syncStripePayments } from '../../../src/services/stripeService';
import { ImageCropper } from '../../../components/shared/ImageCropper';
import { StudentOverviewTab, StudentAttendanceTab, StudentPaymentsTab, StudentNotesTab } from './StudentDetailTabs';
import { StudentEditForm } from './StudentEditForm';
import { AddPaymentModal } from './AddPaymentModal';
import { useData } from '../../../contexts/DataContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface StudentDetailViewProps {
    studentId: string;
    onClose: () => void;
    onSave: (updatedStudent: StudentDetailedProfile) => void;
    onDelete: () => void;
    onAddTask: (studentName: string) => void;
    onUpdateProfileImage: (base64: string) => void;
    onNavigateToGroup?: (groupId: string) => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ studentId, onClose, onSave, onDelete, onAddTask, onUpdateProfileImage, onNavigateToGroup }) => {
    const { t } = useLanguage();
    const { students, classes, removeStudentFromGroup, transferStudent, vacationPeriods, updateStudent, groups } = useData();
    const student = students.find(s => s.id === studentId);

    if (!student) {
        return <div className="h-full flex items-center justify-center"><p>Student not found.</p></div>;
    } 
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payments' | 'notes'>('overview');
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<{ id: string, amount: number, date: string, description: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [groupToRemove, setGroupToRemove] = useState<{ id: string, name: string } | null>(null);
    const [groupToTransfer, setGroupToTransfer] = useState<{ id: string, name: string } | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>('');
    const [isAddEnrollmentModalOpen, setIsAddEnrollmentModalOpen] = useState(false);
    const [enrollmentGroupId, setEnrollmentGroupId] = useState<string>('');
    const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
    const [freezeStartDate, setFreezeStartDate] = useState('');
    const [freezeEndDate, setFreezeEndDate] = useState('');
    const [freezeReason, setFreezeReason] = useState('');

    const handleAddFreezePeriod = async () => {
        if (!freezeStartDate || !freezeEndDate) {
            alert('Vă rugăm să selectați data de început și data de sfârșit.');
            return;
        }
        if (new Date(freezeStartDate) > new Date(freezeEndDate)) {
            alert('Data de început trebuie să fie înainte de data de sfârșit.');
            return;
        }

        const newFreeze = {
            id: `freeze_${Date.now()}`,
            startDate: freezeStartDate,
            endDate: freezeEndDate,
            reason: freezeReason
        };

        const currentFreezePeriods = student.subscription.freezePeriods || [];
        const updatedFreezePeriods = [...currentFreezePeriods, newFreeze];

        // Calculate days to extend
        const start = new Date(freezeStartDate);
        const end = new Date(freezeEndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        // Extend expiry date
        const currentExpiry = new Date(student.subscription.expiryDate);
        currentExpiry.setDate(currentExpiry.getDate() + diffDays);
        const newExpiryDateStr = currentExpiry.toISOString().split('T')[0];

        await updateStudent(student.id, {
            subscription: {
                ...student.subscription,
                expiryDate: newExpiryDateStr,
                freezePeriods: updatedFreezePeriods
            }
        });

        setIsFreezeModalOpen(false);
        setFreezeStartDate('');
        setFreezeEndDate('');
        setFreezeReason('');
    };

    const handleRemoveFreezePeriod = async (freezeId: string) => {
        if (!window.confirm('Sigur doriți să ștergeți această perioadă de înghețare? Data de expirare va fi ajustată corespunzător.')) return;

        const freezeToRemove = student.subscription.freezePeriods?.find(f => f.id === freezeId);
        if (!freezeToRemove) return;

        const updatedFreezePeriods = student.subscription.freezePeriods?.filter(f => f.id !== freezeId) || [];

        // Calculate days to reduce
        const start = new Date(freezeToRemove.startDate);
        const end = new Date(freezeToRemove.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        // Reduce expiry date
        const currentExpiry = new Date(student.subscription.expiryDate);
        currentExpiry.setDate(currentExpiry.getDate() - diffDays);
        const newExpiryDateStr = currentExpiry.toISOString().split('T')[0];

        await updateStudent(student.id, {
            subscription: {
                ...student.subscription,
                expiryDate: newExpiryDateStr,
                freezePeriods: updatedFreezePeriods
            }
        });
    };

    const handleAddEnrollment = async () => {
        if (!enrollmentGroupId) return;
        
        const group = groups.find(g => g.id === enrollmentGroupId);
        if (!group) return;
        
        if (student.enrollments?.some(e => e.groupId === enrollmentGroupId)) {
            alert(t('members.alreadyEnrolled'));
            return;
        }

        const newEnrollment = {
            groupId: group.id,
            groupName: group.name,
            style: group.style,
            level: group.level,
            role: student.gender === 'M' ? 'Leader' : 'Follower',
            schedule: `${group.schedule.day} ${group.schedule.time}`,
            start_date: new Date().toISOString().split('T')[0]
        };

        const updatedEnrollments = [...(student.enrollments || []), newEnrollment];
        
        const updates: any = { enrollments: updatedEnrollments };
        if (updatedEnrollments.length === 1) {
            updates.mainGroup = group.name;
        }

        await updateStudent(student.id, updates);
        setIsAddEnrollmentModalOpen(false);
        setEnrollmentGroupId('');
    };

    // Paste Image Listener
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            setCropImageSrc(event.target?.result as string);
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // --- OPERATIONAL METRICS CALCULATION ---
    const metrics = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const isStaff = student.subscription.type === 'Staff';
        const isArchived = student.status === 'inactive';

        // 1. Attendance 30 days
        const recentAttendance = (student.attendanceHistory || []).filter(r => 
            r.status === 'present' && new Date(r.date) >= thirtyDaysAgo
        );
        const attendedCount = recentAttendance.length;
        
        let maxSessions = 8;
        const plan = (student.subscription.type || '').toLowerCase();
        let planValue = 0;

        if (plan.includes('bronze')) { maxSessions = 4; planValue = 189; }
        else if (plan.includes('silver')) { maxSessions = 8; planValue = 269; }
        else if (plan.includes('gold')) { maxSessions = 12; planValue = 349; }
        else if (plan.includes('platinum')) { maxSessions = 999; planValue = 449; }
        
        // Fallback if price derived is 0 (e.g. Staff or Custom)
        if (planValue === 0 && student.subscription.type !== 'Staff') planValue = 269; 

        const attendanceRate = maxSessions === 999 ? 100 : Math.min(100, Math.round((attendedCount / maxSessions) * 100));
        const attendanceDisplay = maxSessions === 999 ? `${attendedCount}` : `${attendedCount} / ${maxSessions}`;

        // 2. Days Since Last
        const sortedAttendance = [...(student.attendanceHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastPresent = sortedAttendance.find(r => r.status === 'present');
        
        const daysSinceLast = lastPresent 
            ? Math.ceil((today.getTime() - new Date(lastPresent.date).getTime()) / (1000 * 3600 * 24))
            : (student.joinDate ? Math.ceil((today.getTime() - new Date(student.joinDate).getTime()) / (1000 * 3600 * 24)) : 0);

        // 3. LTV
        const joinDateObj = new Date(student.joinDate || today.toISOString().split('T')[0]);
        const months = Math.max(1, Math.ceil((today.getTime() - joinDateObj.getTime()) / (1000 * 3600 * 24 * 30)));
        
        let ltv = (student.paymentHistory || []).reduce((sum, tx) => sum + tx.amount, 0);
        if (ltv === 0 && student.subscription.type !== 'Staff') {
            ltv = months * planValue; // Estimate
        }

        // 4. Churn Risk Logic
        let riskStatus: 'Stable' | 'Warning' | 'ChurnRisk' = 'Stable';
        let riskLabel = 'Stabil';
        let riskColor = 'text-green-600';
        let riskBg = 'bg-green-50';
        let riskIcon = <CheckCircle size={18} className="text-green-500" />;

        if (isArchived) {
             riskStatus = 'Stable';
             riskLabel = 'Arhivat';
             riskColor = 'text-gray-500';
             riskBg = 'bg-gray-100';
             riskIcon = <Archive size={18} className="text-gray-500" />;
        } else if (isStaff) {
             riskStatus = 'Stable';
             riskLabel = 'Staff';
        } else if (daysSinceLast > 21) {
            riskStatus = 'ChurnRisk';
            riskLabel = 'Risc Churn';
            riskColor = 'text-red-600';
            riskBg = 'bg-red-50';
            riskIcon = <ShieldAlert size={18} className="text-red-500" />;
        } else if (attendedCount < 3 && attendedCount >= 0) {
            riskStatus = 'Warning';
            riskLabel = 'Scade frecvența';
            riskColor = 'text-yellow-700';
            riskBg = 'bg-yellow-50';
            riskIcon = <AlertTriangle size={18} className="text-yellow-500" />;
        } else {
            riskStatus = 'Stable';
            riskLabel = 'Stabil';
            riskColor = 'text-green-600';
            riskBg = 'bg-green-50';
            riskIcon = <CheckCircle size={18} className="text-green-500" />;
        }

        // 5. Days Since Last Color
        let daysColor = 'text-green-600';
        if (daysSinceLast >= 8 && daysSinceLast <= 14) daysColor = 'text-yellow-600';
        if (daysSinceLast >= 15) daysColor = 'text-red-600';

        // 6. Robust Expiry Logic
        const effectiveExpiryDate = student.subscription.expiryDate ? new Date(student.subscription.expiryDate) : new Date();

        const daysUntilExpiry = Math.ceil((effectiveExpiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        const isExpired = !isStaff && daysUntilExpiry < 0;

        return {
            attendedCount,
            attendanceDisplay,
            attendanceRate,
            daysSinceLast,
            daysColor,
            ltv,
            months,
            riskStatus,
            riskLabel,
            riskColor,
            riskBg,
            riskIcon,
            planValue,
            daysUntilExpiry,
            isExpired,
            maxSessions,
            isStaff,
            expiryDateStr: effectiveExpiryDate.toISOString().split('T')[0]
        };
    }, [student, vacationPeriods, updateStudent]);

    const handleSyncPayments = async (silent = false) => {
        setIsSyncing(true);
        try {
            const { payments: syncedPayments, subscription: syncedSubscription } = await syncStripePayments({
                email: student.email,
                name: student.name,
                phone: student.phone,
                stripeCustomerId: student.stripeCustomerId,
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

            if (!syncedPayments || syncedPayments.length === 0) {
                if (hasSubscriptionChanges) {
                    onSave({
                        ...student,
                        subscription: updatedSubscription
                    });
                    if (!silent) alert(`Abonamentul a fost actualizat, dar nu s-au găsit plăți noi.`);
                } else {
                    if (!silent) alert('Nu s-au găsit plăți noi.');
                }
                setIsSyncing(false);
                return;
            }

            const stripePayments = syncedPayments;
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

            let updatedPaymentHistory: any[] = [...manualPaymentsToKeep, ...stripePayments];
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

            onSave({
                ...student,
                paymentHistory: updatedPaymentHistory,
                subscription: {
                    ...updatedSubscription,
                    active: true,
                    lastPaymentDate: newLastPaymentDate,
                    expiryDate: newExpiryDateStr,
                },
            });

            if (!silent) {
                if (addedCount > 0) {
                    alert(`Sincronizare finalizată! ${addedCount} plăți noi adăugate.`);
                } else if (hasSubscriptionChanges) {
                    alert(`Abonamentul a fost actualizat. Istoricul plăților este la zi.`);
                } else {
                    alert(`Sincronizare finalizată! Istoricul a fost actualizat și corectat.`);
                }
            }
        } catch (err: any) {
            console.error(`Eroare la sincronizarea plăților pentru ${student.name}:`, err);
            if (!silent) alert(`Eroare la sincronizarea plăților: ${err.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCropImageSrc(reader.result as string);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleAddNote = (text: string) => {
        const newNote: AdminNote = {
            id: `n_${Date.now()}`,
            text,
            date: new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            author: 'Staff Ginga'
        };
        onSave({ ...student, adminNotes: [newNote, ...(student.adminNotes || [])] });
    };

    const handleDeleteNote = (noteId: string) => {
        onSave({ ...student, adminNotes: (student.adminNotes || []).filter(n => n.id !== noteId) });
    };

    const handleManualCheckIn = (classId: string, date: string, status: 'present' | 'absent' | 'none' = 'present') => {
        const targetClass = classes.find(c => c.id === classId);
        if (!targetClass) return;

        if (status === 'none') {
             const updatedHistory = (student.attendanceHistory || []).filter(
                r => !(r.date === date && r.className === targetClass.title)
             );
             const newTotal = updatedHistory.filter(r => r.status === 'present').length;
             onSave({ ...student, attendanceHistory: updatedHistory, stats: { ...student.stats, totalClasses: newTotal }});
            return;
        }

        const newRecord = { date: date, className: targetClass.title, status: status };
        let updatedHistory = (student.attendanceHistory || []).filter(r => !(r.date === date && r.className === targetClass.title));
        updatedHistory = [newRecord, ...updatedHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const newTotal = updatedHistory.filter(r => r.status === 'present').length;

        onSave({ ...student, attendanceHistory: updatedHistory, stats: { ...student.stats, totalClasses: newTotal }});
    };

    const handleManualPayment = (payment: { amount: number; date: string; description: string }) => {
        let updatedHistory = [...(student.paymentHistory || [])];
        let newPaymentId = `pay_${Date.now()}`;

        if (editingPayment) {
            // Update existing payment
            updatedHistory = updatedHistory.map(p => 
                p.id === editingPayment.id 
                    ? { ...p, ...payment }
                    : p
            );
        } else {
            // Add new payment
            const newPayment = {
                id: newPaymentId,
                date: payment.date,
                amount: payment.amount,
                currency: 'RON',
                description: payment.description,
                status: 'success',
                invoiceUrl: '#'
            };
            updatedHistory = [newPayment, ...updatedHistory];
        }

        // Sort history by date descending
        updatedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Recalculate subscription expiry based on the LATEST payment
        const latestPayment = updatedHistory[0];
        let newExpiryDateStr = student.subscription.expiryDate;
        let newLastPaymentDate = student.subscription.lastPaymentDate;

        if (latestPayment) {
             const newExpiry = calculateSubscriptionExpiryDate(updatedHistory, student.subscription.expiryDate, vacationPeriods);
             newExpiryDateStr = newExpiry.toISOString().split('T')[0];
             newLastPaymentDate = latestPayment.date;
        }

        const updatedStudent = {
            ...student,
            paymentHistory: updatedHistory,
            subscription: {
                ...student.subscription,
                active: true,
                lastPaymentDate: newLastPaymentDate,
                expiryDate: newExpiryDateStr
            }
        };

        onSave(updatedStudent);
        setEditingPayment(null);
    };

    const handleRemoveEnrollment = (groupId: string, groupName: string) => {
        setGroupToRemove({ id: groupId, name: groupName });
    };

    const handleTransferEnrollment = (groupId: string, groupName: string) => {
        setGroupToTransfer({ id: groupId, name: groupName });
        setTargetGroupId('');
    };

    const confirmRemoveFromGroup = async () => {
        if (groupToRemove) {
            await removeStudentFromGroup(student.id, groupToRemove.id);
            setGroupToRemove(null);
        }
    };

    const confirmTransfer = async () => {
        if (groupToTransfer && targetGroupId) {
            await transferStudent(student.id, groupToTransfer.id, targetGroupId);
            setGroupToTransfer(null);
            setTargetGroupId('');
        }
    };

    const handleArchive = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Ești sigur că vrei să arhivezi acest membru? Va fi mutat în lista "Arhivă".')) {
            onSave({ ...student, status: 'inactive' });
            onClose(); // Close the panel to reflect change in the list
        }
    };

    const handleRestore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Ești sigur că vrei să reactivezi acest membru?')) {
            onSave({ ...student, status: 'active' });
            onClose(); // Close to refresh view
        }
    };

    const handleWhatsApp = () => {
        const cleanPhone = student.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone.length === 10 ? `40${cleanPhone}` : cleanPhone}`, '_blank');
    };

    const displayPayments = student.paymentHistory || [];

    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
        {cropImageSrc && <ImageCropper src={cropImageSrc} onCrop={(b64) => { onUpdateProfileImage(b64); setCropImageSrc(null); }} onCancel={() => setCropImageSrc(null)} />}

        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 w-fit transition-colors">
            <ArrowLeft size={18} /> <span className="font-medium text-sm hidden sm:inline">Înapoi la listă</span>
        </button>

        <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 flex-1 overflow-y-auto no-scrollbar pb-20 xl:pb-10">
           {/* LEFT COLUMN: Profile & Subscription */}
           {/* Responsive Layout: Row on Mobile, Column on Desktop */}
           <div className="w-full xl:w-[400px] flex-shrink-0">
              <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden sticky top-0 flex flex-col p-5 xl:p-8">
                    
                    {/* Header: Avatar + Info */}
                    <div className="flex flex-row xl:flex-col items-center xl:items-center gap-5 xl:gap-2 text-left xl:text-center mb-6">
                        <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()} title="Click sau Paste (Ctrl+V)">
                            {student.avatarUrl ? (
                                <img src={student.avatarUrl} className={`w-20 h-20 xl:w-48 xl:h-48 rounded-full border-[3px] xl:border-[6px] ${student.status === 'inactive' ? 'border-gray-200 grayscale' : 'border-white dark:border-gray-900'} shadow-sm object-cover bg-white`} alt={student.name} />
                            ) : (
                                <div className="w-20 h-20 xl:w-48 xl:h-48 rounded-full border-[3px] xl:border-[6px] border-white dark:border-gray-900 shadow-sm bg-gray-100 flex items-center justify-center">
                                    <User size={32} className="text-gray-300 xl:hidden" />
                                    <User size={64} className="text-gray-300 hidden xl:block" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-[3px] xl:border-[6px] border-transparent"><Camera size={24} className="text-white"/></div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect}/>
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Desktop Upload Buttons */}
                            <div className="hidden xl:flex justify-center gap-3 mb-6 mt-4">
                                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 uppercase"><Upload size={12}/> {student.avatarUrl ? 'Schimbă' : 'Încarcă'}</button>
                                {student.avatarUrl && (
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if(confirm('Ștergi poza?')) {
                                                onUpdateProfileImage('');
                                            }
                                        }} 
                                        className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase"
                                    >
                                        <Trash2 size={12}/> Șterge
                                    </button>
                                )}
                            </div>

                            <h1 className="text-xl xl:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-1 truncate">{student.name}</h1>
                            {student.nickname && <p className="text-sm xl:text-lg font-bold text-gray-400 mb-1">"{student.nickname}"</p>}
                            <p className="text-xs xl:text-sm text-gray-500 font-medium truncate">{student.email}</p>
                            <a href={`tel:${student.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs xl:text-sm font-bold text-brand-green hover:underline mt-1 inline-block">{student.phone}</a>
                            
                            {/* Mobile Change Photo Link */}
                            <button onClick={() => fileInputRef.current?.click()} className="xl:hidden text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1">
                                <Camera size={12}/> Schimbă Poza
                            </button>
                        </div>
                    </div>
                    
                    {/* ENHANCED SUBSCRIPTION WIDGET OR EDIT PORTAL */}
                    {!isEditing ? (
                        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6 text-left border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Plan Activ</p>
                                    <span className={`px-3 py-1 rounded text-[12px] font-black uppercase tracking-wider border ${getSubscriptionColor(student.subscription.type)}`}>
                                        {student.subscription.type.toUpperCase()}
                                    </span>
                                    <p className="text-[10px] font-medium text-gray-500 mt-2">Valoare: {metrics.planValue} RON/lună</p>
                                </div>
                                <Badge color={student.subscription.autoPayEnabled ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
                                    {student.subscription.autoPayEnabled ? "Loyalty" : "Flexible"}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Următoarea Plată</p>
                                    {metrics.isStaff ? (
                                        <div className="flex items-center gap-1 text-xs font-black text-gray-900 dark:text-white">
                                            N/A (Staff)
                                        </div>
                                    ) : metrics.isExpired ? (
                                        <div className="flex items-center gap-1 text-xs font-black text-red-500">
                                            <AlertTriangle size={12}/> EXPIRAT
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                                            <Calendar size={12} className="text-gray-400" />
                                            {metrics.expiryDateStr}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status Plată</p>
                                    {metrics.isStaff ? (
                                        <span className="text-xs font-bold text-green-600">Activ Permanent</span>
                                    ) : metrics.isExpired ? (
                                        <span className="text-xs font-black text-red-500">De {Math.abs(metrics.daysUntilExpiry)} zile</span>
                                    ) : (
                                        <span className="text-xs font-bold text-green-600">În {metrics.daysUntilExpiry} zile</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div id="subscription-config-portal" className="mb-6 w-full animate-in fade-in zoom-in duration-300">
                            {/* Portal Target for Subscription Form */}
                        </div>
                    )}

                    <div className="flex w-full gap-3 mt-auto">
                       {!isEditing ? (
                           <>
                               <Button onClick={() => setIsEditing(true)} className="!w-auto h-10 px-6 text-xs gap-2 bg-amber-400 text-amber-950 border-none hover:bg-amber-500 font-bold shadow-sm"><Edit2 size={14}/> {t('general.edit')}</Button>
                               <div className="flex gap-2">
                                   <button onClick={handleWhatsApp} className="w-11 h-11 flex items-center justify-center rounded-xl border border-green-200 bg-green-50 text-green-600 hover:bg-green-100" title="WhatsApp"><MessageCircle size={18} /></button>
                                   
                                   {student.status === 'inactive' ? (
                                       <button onClick={handleRestore} className="w-11 h-11 flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" title="Reactivează"><RotateCcw size={18} /></button>
                                   ) : (
                                       <button onClick={handleArchive} className="w-11 h-11 flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100" title="Arhivează"><Archive size={18} /></button>
                                   )}

                                   <button onClick={() => setShowDeleteConfirm(true)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50" title={t('general.delete')}><Trash2 size={18} /></button>
                               </div>
                           </>
                       ) : (
                           <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1 h-11 text-sm font-bold">{t('general.cancel')}</Button>
                       )}
                    </div>
              </div>
           </div>
           
           {/* RIGHT COLUMN: Operational Metrics & Tabs */}
           <div className="flex-1 flex flex-col min-w-0">
              {/* Sticky Tabs on Mobile */}
              {!isEditing && (
                  <div className="sticky top-0 z-10 bg-[#F9FAFB] pb-2 pt-1 -mx-4 px-4 xl:static xl:bg-transparent xl:mx-0 xl:p-0 xl:mb-6">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                          {[
                              { id: 'overview', label: t('members.tabOverview') || 'General' },
                              { id: 'attendance', label: t('members.tabAttendance') || 'Prezență' },
                              { id: 'payments', label: t('members.tabPayments') || 'Plăți' },
                              { id: 'notes', label: t('members.tabNotes') || 'Notițe' }
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
                  </div>
              )}

              {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                      
                      {/* NEW OPERATIONAL KPI GRID */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         {/* 1. Attendance 30 Days */}
                         <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 xl:p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('members.kpiAttendance') || 'Prezențe (30z)'}</p>
                             <div className="flex items-center gap-2">
                                 <p className="text-2xl xl:text-3xl font-black text-gray-900 dark:text-white">{metrics.attendanceDisplay}</p>
                                 <Badge color="bg-gray-100 text-gray-600 border-none">{metrics.attendanceRate}%</Badge>
                             </div>
                         </div>
                         
                         {/* 2. Days Since Last */}
                         <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 xl:p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('members.kpiLastAttendance') || 'Ultima prezență'}</p>
                             <div className="flex items-center gap-2">
                                 <p className={`text-2xl xl:text-3xl font-black ${metrics.daysColor}`}>{metrics.daysSinceLast}</p>
                                 <span className="text-xs font-bold text-gray-400">{t('members.days') || 'zile'}</span>
                             </div>
                         </div>

                         {/* 3. LTV */}
                         <div className="bg-white dark:bg-gray-900 rounded-[24px] p-5 xl:p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('members.kpiValue') || 'Valoare (LTV)'}</p>
                             <div>
                                 <p className="text-2xl xl:text-3xl font-black text-blue-600">{metrics.ltv} <span className="text-sm text-gray-400">RON</span></p>
                                 <p className="text-[10px] font-bold text-gray-400 mt-1">{t('members.memberSince') || 'Membru de'} {metrics.months} {t('members.months') || 'luni'}</p>
                             </div>
                         </div>

                         {/* 4. Churn Risk */}
                         <div className={`rounded-[24px] p-5 xl:p-6 border flex flex-col justify-between shadow-sm ${metrics.riskBg} border-${metrics.riskColor.split('-')[1]}-200`}>
                             <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${metrics.riskColor}`}>{t('members.kpiRetention') || 'Status Retenție'}</p>
                             <div className="flex items-center gap-2">
                                 <p className={`text-lg xl:text-xl font-black ${metrics.riskColor}`}>{metrics.riskLabel}</p>
                                 {metrics.riskIcon}
                             </div>
                         </div>
                      </div>

                      {isEditing ? (
                          <StudentEditForm student={student} onSave={(s) => { onSave(s); setIsEditing(false); }} onCancel={() => setIsEditing(false)} />
                      ) : (
                          <StudentOverviewTab 
                              student={student} 
                              onNavigateToGroup={onNavigateToGroup} 
                              onRemoveEnrollment={handleRemoveEnrollment}
                              onTransferEnrollment={handleTransferEnrollment}
                              onAddEnrollment={() => setIsAddEnrollmentModalOpen(true)}
                              onOpenFreezeModal={() => setIsFreezeModalOpen(true)}
                              onRemoveFreezePeriod={handleRemoveFreezePeriod}
                          />
                      )}
                  </div>
              )}
              
              {activeTab === 'attendance' && (
                  <StudentAttendanceTab 
                      history={student.attendanceHistory || []} 
                      allClasses={classes} 
                      onCheckIn={handleManualCheckIn} 
                      enrollments={student.enrollments}
                      paymentHistory={student.paymentHistory || []}
                      vacationPeriods={vacationPeriods}
                  />
              )}
              {activeTab === 'payments' && (
                  <StudentPaymentsTab 
                      payments={displayPayments} 
                      onAddPayment={() => { setEditingPayment(null); setIsPaymentModalOpen(true); }}
                      onEditPayment={(payment) => { setEditingPayment(payment); setIsPaymentModalOpen(true); }}
                      onSyncPayments={() => handleSyncPayments(false)}
                      isSyncing={isSyncing}
                  />
              )}
              {activeTab === 'notes' && <StudentNotesTab notes={student.adminNotes || []} onAdd={handleAddNote} onDelete={handleDeleteNote} />}
           </div>
        </div>

        <Modal isOpen={isFreezeModalOpen} onClose={() => setIsFreezeModalOpen(false)} title={t('members.freezeTitle') || "Îngheață Abonament"}>
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    {t('members.freezeDescription') || "Adăugarea unei perioade de înghețare va prelungi automat data de expirare a abonamentului cu numărul de zile selectat."}
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">{t('members.freezeFrom') || "De la"}</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2"
                            value={freezeStartDate}
                            onChange={e => setFreezeStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">{t('members.freezeTo') || "Până la"}</label>
                        <input 
                            type="date" 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2"
                            value={freezeEndDate}
                            onChange={e => setFreezeEndDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">{t('members.freezeReason') || "Motiv (Opțional)"}</label>
                    <input 
                        type="text" 
                        placeholder={t('members.freezeReasonPlaceholder') || "Ex: Concediu medical, Plecat din țară..."}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2"
                        value={freezeReason}
                        onChange={e => setFreezeReason(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={() => setIsFreezeModalOpen(false)}>{t('general.cancel')}</Button>
                    <Button variant="primary" onClick={handleAddFreezePeriod}>{t('general.save')}</Button>
                </div>
            </div>
        </Modal>

        <AddPaymentModal 
            isOpen={isPaymentModalOpen} 
            onClose={() => { setIsPaymentModalOpen(false); setEditingPayment(null); }} 
            onSave={handleManualPayment}
            studentName={student.name}
            initialData={editingPayment}
        />

        <Modal isOpen={isAddEnrollmentModalOpen} onClose={() => setIsAddEnrollmentModalOpen(false)} title="Adaugă în Grupă">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Selectează Grupa</label>
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
                    <Button variant="secondary" onClick={() => setIsAddEnrollmentModalOpen(false)} className="flex-1">Anulează</Button>
                    <Button onClick={handleAddEnrollment} disabled={!enrollmentGroupId} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none">Adaugă</Button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirmare Ștergere">
            <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg text-red-600"><Trash2 size={24} /></div>
                    <div><h4 className="font-bold text-red-900 text-sm">Acțiune Ireversibilă</h4><p className="text-xs text-red-700 mt-1">Ești pe cale să ștergi definitiv membrul.</p></div>
                </div>
                <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Anulează</Button><Button variant="danger" onClick={onDelete}>Șterge</Button></div>
            </div>
        </Modal>

        <Modal isOpen={!!groupToRemove} onClose={() => setGroupToRemove(null)} title="Elimină din Grupă">
            <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg text-amber-600"><AlertTriangle size={24} /></div>
                    <div>
                        <h4 className="font-bold text-amber-900 text-sm">Confirmare Eliminare</h4>
                        <p className="text-xs text-amber-700 mt-1">
                            Sigur vrei să elimini studentul din grupa <strong>{groupToRemove?.name}</strong>? 
                            Această acțiune va șterge înscrierea, dar istoricul de prezență va rămâne.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setGroupToRemove(null)}>Anulează</Button>
                    <Button variant="danger" onClick={confirmRemoveFromGroup}>Elimină</Button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={!!groupToTransfer} onClose={() => setGroupToTransfer(null)} title="Transferă Student">
            <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg text-blue-600"><RefreshCw size={24} /></div>
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">Transfer de la {groupToTransfer?.name}</h4>
                        <p className="text-xs text-blue-700 mt-1">
                            Alege noua grupă în care vrei să transferi studentul. Această acțiune va muta înscrierea curentă.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alege Grupa Destinație</label>
                    <select 
                        value={targetGroupId}
                        onChange={(e) => setTargetGroupId(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-blue-500 transition-all"
                    >
                        <option value="">Selectează o grupă...</option>
                        {groups
                            .filter(g => g.id !== groupToTransfer?.id)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.name} ({g.style} - {g.level})
                                </option>
                            ))
                        }
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setGroupToTransfer(null)}>Anulează</Button>
                    <Button 
                        onClick={confirmTransfer} 
                        disabled={!targetGroupId}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Confirmă Transferul
                    </Button>
                </div>
            </div>
        </Modal>
      </div>
    );
};
