
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, User, Users, Plus, Trash2, CreditCard, ShieldCheck, CalendarOff, RefreshCw, Camera, Upload, Crop, Clock, Search, UserCheck } from 'lucide-react';
import { Modal, Button, Input, Switch } from '../../components/UIComponents';
import { StudentDetailedProfile, DanceStyle, SkillLevel } from '../../types';
import { useData } from '../../contexts/DataContext';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { normalizeText, smartSearch } from '../../utils/searchUtils';
import { normalizeRoPhone } from '../../utils/phoneUtils';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: StudentDetailedProfile) => void;
    initialData?: StudentDetailedProfile | null;
    initialGroupId?: string; // Prop for pre-filling enrollment
    existingStudents?: StudentDetailedProfile[]; // Prop for searching existing students
    onAddExisting?: (studentId: string) => void; // Callback when adding an existing student
}

const SUBSCRIPTION_LIMITS: Record<string, number> = {
    'Bronze': 1,
    'Silver': 2,
    'Gold': 3,
    'Platinum': 99,
    'Staff': 99
};

interface EnrollmentItem {
    groupId: string;
    groupName: string;
    style: DanceStyle;
    level: SkillLevel;
    role: 'Leader' | 'Follower';
    schedule: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData, 
    initialGroupId,
    existingStudents = [],
    onAddExisting
}) => {
    const { groups } = useData(); 

    // Mode Toggle (Only visible if initialGroupId is present)
    const [mode, setMode] = useState<'create' | 'existing'>('create');

    // --- EXISTING STUDENT SEARCH STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);

    // Basic Info
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        nickname: '',
        email: '',
        phone: '',
        subscriptionType: 'Silver',
        avatarUrl: ''
    });

    // Errors State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Image Handling State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null); // Store original for re-cropping
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Payment Config State
    const [isLoyalty, setIsLoyalty] = useState(true); 
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]); 
    const [expiryDate, setExpiryDate] = useState<string>(''); // Editable State
    
    // Enrollment State
    const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
    
    // Temporary Selection State
    const [tempStyle, setTempStyle] = useState<DanceStyle>(DanceStyle.BACHATA);
    const [tempGroupId, setTempGroupId] = useState<string>('');
    const [tempRole, setTempRole] = useState<'Leader' | 'Follower'>('Follower');

    const limit = SUBSCRIPTION_LIMITS[formData.subscriptionType] || 1;
    const isLimitReached = enrollments.length >= limit;

    const availableGroups = useMemo(() => {
        return groups.filter(g => g.style === tempStyle);
    }, [tempStyle, groups]);

    // Handle Payment Change (Auto-suggest Expiry)
    const handlePaymentChange = (date: string) => {
        setPaymentDate(date);
        if (date && formData.subscriptionType !== 'Staff') {
            const d = new Date(date);
            d.setMonth(d.getMonth() + 1);
            // Handle edge cases like Jan 31 -> Feb 28/29
            if (d.getDate() !== new Date(date).getDate()) {
                d.setDate(0); 
            }
            setExpiryDate(d.toISOString().split('T')[0]);
        }
    };

    // --- POPULATE ON EDIT OR INITIAL GROUP ---
    useEffect(() => {
        if (isOpen) {
            setMode('create'); // Reset mode on open
            setSearchTerm('');
            setSelectedExistingId(null);

            if (initialData) {
                // Edit Mode
                const names = (initialData.name || '').split(' ').filter(n => n.trim().length > 0);
                let firstName = '';
                let middleName = '';
                let lastName = '';

                if (names.length === 1) {
                    firstName = names[0];
                } else if (names.length === 2) {
                    firstName = names[0];
                    lastName = names[1];
                } else if (names.length >= 3) {
                    firstName = names[0];
                    lastName = names[names.length - 1];
                    middleName = names.slice(1, names.length - 1).join(' ');
                }

                setFormData({
                    firstName,
                    middleName,
                    lastName,
                    nickname: initialData.nickname || '',
                    email: initialData.email,
                    phone: initialData.phone,
                    subscriptionType: initialData.subscription.type,
                    avatarUrl: initialData.avatarUrl || ''
                });
                
                const pDate = initialData.subscription.lastPaymentDate || new Date().toISOString().split('T')[0];
                setPaymentDate(pDate);
                setExpiryDate(initialData.subscription.expiryDate || '');
                
                setIsLoyalty(!!initialData.subscription.autoPayEnabled);
                setOriginalImageSrc(null); // Reset original on new open
                setErrors({}); // Clear errors
                
                // Restore Enrollments
                if (initialData.enrollments) {
                    const restoredEnrollments: EnrollmentItem[] = initialData.enrollments.map(enr => {
                        const matchedGroup = groups.find(g => g.id === enr.groupId) || groups.find(g => g.name === enr.groupName);
                        return {
                            groupId: enr.groupId || matchedGroup?.id || '',
                            groupName: enr.groupName || matchedGroup?.name || `${enr.style} ${enr.level}`,
                            style: enr.style,
                            level: enr.level,
                            role: (enr.role as 'Leader' | 'Follower') || (initialData.gender === 'M' ? 'Leader' : 'Follower'),
                            schedule: enr.schedule || (matchedGroup ? `${matchedGroup.schedule.day} ${matchedGroup.schedule.time}` : 'N/A')
                        };
                    });
                    setEnrollments(restoredEnrollments);
                } else {
                    setEnrollments([]);
                }

            } else {
                // Create Mode
                setFormData({ firstName: '', middleName: '', lastName: '', nickname: '', email: '', phone: '', subscriptionType: 'Silver', avatarUrl: '' });
                
                // Pre-fill enrollment if initialGroupId is provided
                if (initialGroupId) {
                    const initGroup = groups.find(g => g.id === initialGroupId);
                    if (initGroup) {
                        setEnrollments([{
                            groupId: initGroup.id,
                            groupName: initGroup.name,
                            style: initGroup.style,
                            level: initGroup.level,
                            role: 'Follower', // Default guess
                            schedule: `${initGroup.schedule.day} ${initGroup.schedule.time}`
                        }]);
                        setTempStyle(initGroup.style); // Switch tab to correct style
                    } else {
                        setEnrollments([]);
                    }
                } else {
                    setEnrollments([]);
                }

                const today = new Date().toISOString().split('T')[0];
                handlePaymentChange(today); // Initialize Payment & Expiry
                setIsLoyalty(true);
                setOriginalImageSrc(null);
                setErrors({}); // Clear errors
            }
        }
    }, [isOpen, initialData, groups, initialGroupId]);

    // --- PASTE LISTENER FOR IMAGE ---
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen || mode === 'existing') return;
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const result = event.target?.result as string;
                            setOriginalImageSrc(result);
                            setCropImageSrc(result);
                        };
                        reader.readAsDataURL(blob);
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, mode]);

    // --- SEARCH FILTER ---
    const filteredExistingStudents = useMemo(() => {
        if (!searchTerm) return [];
        const lower = normalizeText(searchTerm);
        return existingStudents.filter(s => 
            smartSearch(searchTerm, s.name) ||
            normalizeText(s.email).includes(lower) ||
            s.phone.includes(lower)
        ).slice(0, 5); // Limit results
    }, [searchTerm, existingStudents]);

    const handleSelectExisting = (studentId: string) => {
        if (onAddExisting) {
            onAddExisting(studentId);
            onClose();
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        if (field === 'subscriptionType') {
            if (value === 'Staff') {
                setExpiryDate('2099-12-31');
            } else {
                // Reset to standard month if switching away from staff
                const d = new Date(paymentDate);
                d.setMonth(d.getMonth() + 1);
                if (d.getDate() !== new Date(paymentDate).getDate()) { d.setDate(0); }
                setExpiryDate(d.toISOString().split('T')[0]);
            }
        }

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setOriginalImageSrc(result);
                setCropImageSrc(result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropComplete = (base64Image: string) => {
        setFormData(prev => ({ ...prev, avatarUrl: base64Image }));
        setCropImageSrc(null);
    };

    const handleReCrop = () => {
        if (originalImageSrc) {
            setCropImageSrc(originalImageSrc);
        } else if (formData.avatarUrl) {
            setCropImageSrc(formData.avatarUrl);
        }
    };

    const handleDeleteImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, avatarUrl: '' }));
        setOriginalImageSrc(null);
        setCropImageSrc(null);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleAddEnrollment = () => {
        if (isLimitReached || !tempGroupId) return;
        const selectedGroup = groups.find(g => g.id === tempGroupId);
        if (!selectedGroup) return;

        if (enrollments.some(e => e.groupId === tempGroupId)) {
            alert('Studentul este deja înscris la această grupă.');
            return;
        }

        setEnrollments(prev => [...prev, { 
            groupId: selectedGroup.id,
            groupName: selectedGroup.name,
            style: selectedGroup.style, 
            level: selectedGroup.level, 
            role: tempRole,
            schedule: `${selectedGroup.schedule.day} ${selectedGroup.schedule.time}`
        }]);
        setTempGroupId('');
    };

    const handleRemoveEnrollment = (index: number) => {
        setEnrollments(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Prenumele este obligatoriu';
        if (!formData.lastName.trim()) newErrors.lastName = 'Numele este obligatoriu';
        if (!formData.email.trim()) {
            newErrors.email = 'Email-ul este obligatoriu';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email invalid';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Telefonul este obligatoriu';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const fullName = [formData.firstName, formData.middleName, formData.lastName]
            .filter(part => part.trim() !== '')
            .join(' ')
            .trim();

        const finalAvatar = formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`;
        const subDetails = {
            Bronze: { planId: 'bronze' },
            Silver: { planId: 'silver' },
            Gold: { planId: 'gold' },
            Platinum: { planId: 'platinum' },
            Staff: { planId: 'sub_staff' }
        }[formData.subscriptionType] || { planId: 'bronze' };

        const finalEnrollments = enrollments.map(e => ({ 
            style: e.style, 
            level: e.level,
            groupId: e.groupId,
            groupName: e.groupName,
            role: e.role,
            schedule: e.schedule
        }));

        const finalPhone = normalizeRoPhone(formData.phone);

        if (initialData) {
            const updatedStudent: StudentDetailedProfile = {
                ...initialData,
                name: fullName,
                nickname: formData.nickname,
                email: formData.email,
                phone: finalPhone,
                avatarUrl: finalAvatar,
                subscription: {
                    ...initialData.subscription,
                    type: formData.subscriptionType,
                    planId: subDetails.planId,
                    expiryDate: expiryDate,
                    lastPaymentDate: paymentDate,
                    autoPayEnabled: isLoyalty
                },
                enrollments: finalEnrollments,
                mainGroup: finalEnrollments.length > 0 ? finalEnrollments[0].groupName! : initialData.mainGroup
            };
            onSave(updatedStudent);
        } else {
            const newId = `s_new_${Date.now()}`;
            const primaryEnrollment = enrollments[0];
            const inferredGender = primaryEnrollment?.role === 'Leader' ? 'M' : 'F';
            const mainGroupStr = primaryEnrollment ? primaryEnrollment.groupName : 'Nedefinit';

            const newStudent: StudentDetailedProfile = {
                id: newId,
                name: fullName,
                nickname: formData.nickname,
                email: formData.email,
                phone: finalPhone,
                avatarUrl: finalAvatar,
                age: 25,
                gender: inferredGender,
                role: 'student',
                enrollments: finalEnrollments, 
                favoriteStyle: primaryEnrollment?.style || DanceStyle.BACHATA,
                goal: 'Distracție',
                joinDate: new Date().toISOString().split('T')[0],
                mainGroup: mainGroupStr,
                status: 'active',
                subscription: {
                    type: formData.subscriptionType,
                    planId: subDetails.planId,
                    sessionsTotal: 999,
                    sessionsLeft: 999,
                    expiryDate: expiryDate,
                    lastPaymentDate: paymentDate,
                    socialPartiesUsed: 0,
                    active: true,
                    autoPayEnabled: isLoyalty
                },
                stats: { streakWeeks: 0, totalClasses: 0, hoursDanced: 0, points: 0 },
                achievements: [],
                personalVideos: [],
                attendedClasses: [],
                preferences: { notificationsEnabled: true, reminderMinutes: 60 },
                kpi: { lastAttendanceDays: 0, consecutiveAbsences: 0, paymentStatus: 'paid', retentionRate: 100, engagementScore: 100, hasFeedback: false },
                risk: { level: 'low' },
                feedbackHistory: [],
                attendanceHistory: [],
                paymentHistory: []
            };
            onSave(newStudent);
        }
        
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editează Membru" : "Adaugă în Grupă"}>
            <div className="space-y-6">
                
                {/* MODE TOGGLE (Only if creating new within a group context) */}
                {!initialData && initialGroupId && (
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
                        <button 
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'create' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Plus size={14} className="inline mr-1"/> Membru Nou
                        </button>
                        <button 
                            onClick={() => setMode('existing')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'existing' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Search size={14} className="inline mr-1"/> Membru Existent
                        </button>
                    </div>
                )}

                {/* --- MODE: SELECT EXISTING --- */}
                {mode === 'existing' ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Caută după nume, telefon sau email..." 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2">
                            {filteredExistingStudents.length > 0 ? (
                                filteredExistingStudents.map(student => {
                                    const isAlreadyInGroup = student.enrollments.some(e => e.groupId === initialGroupId);
                                    return (
                                        <div key={student.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAlreadyInGroup ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
                                            <div className="flex items-center gap-3">
                                                <img src={student.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover" alt={student.name} />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-500">{student.phone}</span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${student.subscription.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {student.subscription.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isAlreadyInGroup ? (
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><UserCheck size={12}/> Deja Înscris</span>
                                            ) : (
                                                <Button 
                                                    onClick={() => handleSelectExisting(student.id)} 
                                                    className="!w-auto h-8 px-3 text-[10px]"
                                                >
                                                    Adaugă
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                            ) : searchTerm ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="text-xs">Niciun rezultat găsit.</p>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Search size={32} className="mx-auto mb-2 opacity-20"/>
                                    <p className="text-xs">Începe să scrii pentru a căuta.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* --- MODE: CREATE NEW (Standard Form) --- */
                    <>
                        {/* 0. Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div 
                                className="relative group cursor-pointer"
                                onClick={triggerFileInput}
                                title="Click sau Paste (Ctrl+V) pentru poză"
                            >
                                <div className="w-40 h-40 rounded-full border-4 border-gray-100 bg-gray-50 overflow-hidden shadow-sm flex items-center justify-center">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={64} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={32} className="text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect}/>
                            </div>
                            
                            <div className="flex gap-3 mt-2">
                                <button onClick={triggerFileInput} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                    <Upload size={12} /> {initialData ? 'Schimbă' : 'Încarcă'}
                                </button>
                                {(originalImageSrc || formData.avatarUrl) && (
                                    <>
                                        <button onClick={handleReCrop} className="text-xs font-bold text-gray-600 flex items-center gap-1 hover:text-gray-900 transition-colors">
                                            <Crop size={12} /> Ajustează
                                        </button>
                                        <button onClick={handleDeleteImage} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-700 transition-colors">
                                            <Trash2 size={12} /> Șterge
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 1. Subscription Selection */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <CreditCard size={16} className="text-blue-600" /> Configurare Abonament
                            </h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Tip Abonament</label>
                                    <select 
                                        value={formData.subscriptionType}
                                        onChange={(e) => handleChange('subscriptionType', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-white shadow-sm bg-white text-gray-900 focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-white mb-4"
                                    >
                                        <option value="Bronze">Bronze (1 oră / săptămână)</option>
                                        <option value="Silver">Silver (2 ore / săptămână)</option>
                                        <option value="Gold">Gold (3 ore / săptămână)</option>
                                        <option value="Platinum">Platinum (Nelimitat)</option>
                                        <option value="Staff">Staff (Gratuit - Nelimitat)</option>
                                    </select>

                                    {/* LOYALTY vs FLEXIBLE TOGGLE */}
                                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isLoyalty ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {isLoyalty ? <ShieldCheck size={18} /> : <CalendarOff size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900 dark:text-white">{isLoyalty ? 'Preț Loialty' : 'Preț Flexible'}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">
                                                    {isLoyalty 
                                                        ? 'Recurent (Auto-debit)' 
                                                        : 'O singură dată (Mai scump)'}
                                                </p>
                                            </div>
                                        </div>
                                        <Switch checked={isLoyalty} onChange={setIsLoyalty} />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Data Plată</label>
                                            <input 
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => handlePaymentChange(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                                                Data Expirare (Editabil)
                                            </label>
                                            <input 
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Personal Info */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Prenume (Ex: Andrei)" 
                                    value={formData.firstName} 
                                    onChange={(e) => handleChange('firstName', e.target.value)} 
                                    placeholder="Prenume"
                                    error={errors.firstName}
                                />
                                <Input 
                                    label="Nume (Ex: Popescu)" 
                                    value={formData.lastName} 
                                    onChange={(e) => handleChange('lastName', e.target.value)} 
                                    placeholder="Nume de familie"
                                    error={errors.lastName}
                                />
                            </div>
                            {/* NEW ROW WITH MIDDLE NAME & NICKNAME */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Al doilea prenume (Opțional)"
                                    value={formData.middleName}
                                    onChange={(e) => handleChange('middleName', e.target.value)} 
                                    placeholder="Ex: Maria"
                                />
                                <Input 
                                    label="Poreclă (Opțional)" 
                                    value={formData.nickname} 
                                    onChange={(e) => handleChange('nickname', e.target.value)} 
                                    placeholder="Ex: J-Lo"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input 
                                    label="Email" 
                                    type="email"
                                    value={formData.email} 
                                    onChange={(e) => handleChange('email', e.target.value)} 
                                    placeholder="email@exemplu.com"
                                    error={errors.email}
                                />
                                <Input 
                                    label="Telefon" 
                                    value={formData.phone} 
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    onBlur={() => handleChange('phone', normalizeRoPhone(formData.phone))}
                                    placeholder="+40 7xx xxx xxx"
                                    error={errors.phone}
                                />
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        {/* 3. Group Selection */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users size={16} /> Grupe</h4>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{enrollments.length} / {limit === 99 ? '∞' : limit}</span>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Pasul 1: Stilul</label>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {Object.values(DanceStyle).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { setTempStyle(s); setTempGroupId(''); }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                                                    tempStyle === s 
                                                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' 
                                                    : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Pasul 2: Alege Grupa</label>
                                        <select 
                                            value={tempGroupId}
                                            onChange={(e) => setTempGroupId(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-xs font-bold outline-none focus:border-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Selectează Grupa...</option>
                                            {availableGroups.map(g => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name} ({g.schedule.day}, {g.schedule.time})
                                                </option>
                                            ))}
                                            {availableGroups.length === 0 && <option disabled>Nu există grupe</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Rol</label>
                                        <select 
                                            value={tempRole}
                                            onChange={(e) => setTempRole(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-xs font-bold outline-none focus:border-blue-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="Leader">Leader</option>
                                            <option value="Follower">Follower</option>
                                        </select>
                                    </div>
                                </div>

                                <Button 
                                    variant="secondary" 
                                    onClick={handleAddEnrollment} 
                                    disabled={isLimitReached || !tempGroupId}
                                    className={`w-full h-9 text-xs border-dashed ${isLimitReached || !tempGroupId ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:text-blue-600'}`}
                                >
                                    <Plus size={14} className="mr-1"/> Adaugă Înscriere
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {enrollments.map((enr, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 text-white border border-gray-800 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-xs text-white border border-gray-700">
                                                {enr.style.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white leading-tight">{enr.groupName}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                                    <span className="flex items-center gap-0.5"><Clock size={10}/> {enr.schedule}</span>
                                                    <span>•</span>
                                                    <span>{enr.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveEnrollment(idx)}
                                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {enrollments.length === 0 && (
                                    <p className="text-center text-xs text-gray-400 py-2 italic">
                                        {initialData ? 'Nicio modificare la grupe (se păstrează cele vechi).' : 'Nicio grupă adăugată.'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-gray-50 dark:border-gray-800">
                            <Button variant="secondary" onClick={onClose}>Anulează</Button>
                            <Button onClick={handleSubmit}>
                                {initialData ? 'Salvează Modificările' : 'Salvează Membru'}
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {cropImageSrc && (
                <ImageCropper 
                    src={cropImageSrc} 
                    onCrop={handleCropComplete} 
                    onCancel={() => setCropImageSrc(null)} 
                />
            )}
        </Modal>
    );
};