
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, ShieldCheck, CalendarOff, RefreshCw, User, Mail, Phone, Instagram, Facebook, Linkedin, Users, Plus, Clock, Trash2, Check, MapPin, Layers } from 'lucide-react';
import { StudentDetailedProfile, DanceStyle, SkillLevel } from '../../../types';
import { Button, Input, Switch } from '../../../components/UIComponents';
import { useData } from '../../../contexts/DataContext';
import { normalizeRoPhone } from '../../../utils/phoneUtils';
import { guessGenderByName, guessRoleByGender } from '../../../utils/genderUtils';

interface EnrollmentItem {
    groupId: string;
    groupName: string;
    style: DanceStyle;
    level: SkillLevel;
    role: 'Leader' | 'Follower';
    schedule: string;
}

const SUBSCRIPTION_LIMITS: Record<string, number> = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 99, 'Staff': 99 };

// Helper to guess role - REMOVED in favor of centralized utility

interface StudentEditFormProps {
    student: StudentDetailedProfile;
    onSave: (updated: StudentDetailedProfile) => void;
    onCancel: () => void;
}

export const StudentEditForm: React.FC<StudentEditFormProps> = ({ student, onSave, onCancel }) => {
    const { groups } = useData();
    
    // Parse name
    const names = student.name.split(' ').filter(n => n.trim().length > 0);
    const [formData, setFormData] = useState({
        firstName: names[0] || '',
        middleName: student.middleName || (names.length >= 3 ? names.slice(1, names.length - 1).join(' ') : ''),
        lastName: names.length >= 2 ? names[names.length - 1] : '',
        nickname: student.nickname || '',
        email: student.email,
        phone: student.phone,
        subscriptionType: student.subscription.type,
        instagram: student.socialMedia?.instagram || '',
        facebook: student.socialMedia?.facebook || '',
        linkedin: student.socialMedia?.linkedin || '',
        danceRole: (student.gender === 'M' ? 'Leader' : 'Follower') as 'Leader' | 'Follower'
    });
    const [isRoleManuallySet, setIsRoleManuallySet] = useState(false);

    const [isLoyalty, setIsLoyalty] = useState(!!student.subscription.autoPayEnabled);
    const [paymentDate, setPaymentDate] = useState<string>(student.subscription.lastPaymentDate || new Date().toISOString().split('T')[0]);
    const [expiryDate, setExpiryDate] = useState<string>(student.subscription.expiryDate || '');

    const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Quick Picker State
    const [activeStyleTab, setActiveStyleTab] = useState<DanceStyle | 'All'>('All');
    const [pickerRole, setPickerRole] = useState<'Leader' | 'Follower'>('Follower');

    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Find the portal target in the parent view
        const target = document.getElementById('subscription-config-portal');
        if (target) setPortalTarget(target);
    }, []);

    useEffect(() => {
        if (student.enrollments) {
            setEnrollments(student.enrollments.map(enr => {
                const matchedGroup = groups.find(g => g.id === enr.groupId) || groups.find(g => g.name === enr.groupName);
                return {
                    groupId: enr.groupId || matchedGroup?.id || '',
                    groupName: enr.groupName || matchedGroup?.name || `${enr.style} ${enr.level}`,
                    style: enr.style,
                    level: enr.level,
                    role: (enr.role as 'Leader' | 'Follower') || (student.gender === 'M' ? 'Leader' : 'Follower'),
                    schedule: enr.schedule || (matchedGroup ? `${matchedGroup.schedule.day} ${matchedGroup.schedule.time}` : 'N/A')
                };
            }));
        }
        // Set initial role based on gender
        setPickerRole(student.gender === 'M' ? 'Leader' : 'Follower');
    }, [student, groups]);

    const limit = SUBSCRIPTION_LIMITS[formData.subscriptionType] || 1;
    const isLimitReached = enrollments.length >= limit;

    // Filter available groups for the picker
    const filteredAvailableGroups = useMemo(() => {
        return groups.filter(g => activeStyleTab === 'All' || g.style === activeStyleTab);
    }, [groups, activeStyleTab]);

    const handlePaymentDateChange = (date: string) => {
        setPaymentDate(date);
        if (date) {
            const d = new Date(date);
            d.setMonth(d.getMonth() + 1);
            setExpiryDate(d.toISOString().split('T')[0]);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
            const fullName = [
                field === 'firstName' ? value : formData.firstName,
                field === 'middleName' ? value : formData.middleName,
                field === 'lastName' ? value : formData.lastName
            ].filter(Boolean).join(' ');
            
            if (!isRoleManuallySet) {
                const gender = guessGenderByName(fullName);
                const role = guessRoleByGender(gender);
                setFormData(prev => ({ ...prev, danceRole: role }));
                setPickerRole(role);
            }
        }
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const toggleGroupEnrollment = (groupId: string) => {
        // Check if already enrolled
        const existingIndex = enrollments.findIndex(e => e.groupId === groupId);
        
        if (existingIndex >= 0) {
            // Remove
            setEnrollments(prev => prev.filter((_, i) => i !== existingIndex));
        } else {
            // Add
            if (isLimitReached) {
                alert(`Limita abonamentului ${formData.subscriptionType} este atinsă.`);
                return;
            }
            const selectedGroup = groups.find(g => g.id === groupId);
            if (!selectedGroup) return;

            setEnrollments(prev => [...prev, { 
                groupId: selectedGroup.id,
                groupName: selectedGroup.name,
                style: selectedGroup.style, 
                level: selectedGroup.level, 
                role: pickerRole,
                schedule: `${selectedGroup.schedule.day} ${selectedGroup.schedule.time}`
            }]);
        }
    };

    const handleRemoveEnrollment = (index: number) => {
        setEnrollments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Obligatoriu';
        if (!formData.lastName.trim()) newErrors.lastName = 'Obligatoriu';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const subDetails = { Bronze: 'bronze', Silver: 'silver', Gold: 'gold', Platinum: 'platinum', Staff: 'sub_staff' };
        
        onSave({
            ...student,
            name: [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' '),
            middleName: formData.middleName,
            nickname: formData.nickname,
            email: formData.email,
            phone: normalizeRoPhone(formData.phone),
            gender: formData.danceRole === 'Leader' ? 'M' : 'F',
            subscription: {
                ...student.subscription,
                type: formData.subscriptionType,
                planId: subDetails[formData.subscriptionType as keyof typeof subDetails] || 'bronze',
                expiryDate: expiryDate,
                lastPaymentDate: paymentDate,
                autoPayEnabled: isLoyalty
            },
            socialMedia: { 
                instagram: formData.instagram, 
                facebook: formData.facebook,
                linkedin: formData.linkedin 
            },
            enrollments: enrollments.map(e => ({ 
                style: e.style, 
                level: e.level, 
                groupId: e.groupId, 
                groupName: e.groupName,
                role: e.role,
                schedule: e.schedule
            })),
            mainGroup: enrollments.length > 0 ? enrollments[0].groupName : student.mainGroup
        });
    };

    return (
        <div className="space-y-8 pb-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Editare Profil</h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {['Leader', 'Follower'].map(role => (
                        <button 
                            key={role} 
                            onClick={() => {
                                setFormData(p => ({...p, danceRole: role as any}));
                                setPickerRole(role as any);
                                setIsRoleManuallySet(true);
                                // Update all existing enrollments to this role
                                setEnrollments(prev => prev.map(enr => ({ ...enr, role: role as any })));
                            }} 
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${formData.danceRole === role ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* 1. Personal Info */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Prenume" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} />
                    <Input label="Al doilea prenume" value={formData.middleName} onChange={(e) => handleChange('middleName', e.target.value)} />
                    <Input label="Nume" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Poreclă" value={formData.nickname} onChange={(e) => handleChange('nickname', e.target.value)} />
                    <Input label="Email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                    <Input 
                        label="Telefon" 
                        value={formData.phone} 
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleChange('phone', normalizeRoPhone(formData.phone))}
                    />
                </div>
                
                {/* Collapsible Social Media could go here to save space */}
                <div className="pt-2">
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2">Social Media (Opțional)</p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="relative">
                            <input 
                                type="text" value={formData.instagram} onChange={(e) => handleChange('instagram', e.target.value)} placeholder="Instagram" 
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:ring-1 focus:ring-pink-500 outline-none"
                            />
                            <Instagram size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pink-500" />
                        </div>
                        <div className="relative">
                            <input 
                                type="text" value={formData.facebook} onChange={(e) => handleChange('facebook', e.target.value)} placeholder="Facebook" 
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:ring-1 focus:ring-blue-600 outline-none"
                            />
                            <Facebook size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-600" />
                        </div>
                        <div className="relative">
                            <input 
                                type="text" value={formData.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} placeholder="LinkedIn" 
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:ring-1 focus:ring-blue-700 outline-none"
                            />
                            <Linkedin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-700" />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* 2. Subscription & Groups */}
            <div className="space-y-8">
                
                {/* PORTAL: Subscription Config (Moved to Sidebar if target exists) */}
                {portalTarget && createPortal(
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-[24px] border border-blue-100 dark:border-blue-900/30 h-fit">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <CreditCard size={16} className="text-blue-600" /> Configurare Abonament
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <select 
                                    value={formData.subscriptionType} 
                                    onChange={(e) => handleChange('subscriptionType', e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl border-2 border-white shadow-sm bg-white text-gray-900 font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-blue-500"
                                >
                                    {Object.keys(SUBSCRIPTION_LIMITS).map(k => <option key={k} value={k}>{k} ({SUBSCRIPTION_LIMITS[k]} ședințe/săpt)</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isLoyalty ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {isLoyalty ? <ShieldCheck size={18} /> : <CalendarOff size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white">{isLoyalty ? 'Preț Loialty' : 'Preț Flexible'}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{isLoyalty ? 'Recurent (Auto)' : 'O singură dată'}</p>
                                    </div>
                                </div>
                                <Switch checked={isLoyalty} onChange={setIsLoyalty} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Data Plată</label>
                                    <input type="date" value={paymentDate} onChange={(e) => handlePaymentDateChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Expiră (Editabil)</label>
                                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>,
                    portalTarget
                )}

                {/* Right: Group Selection (Inline & Fast) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users size={16} /> Înscrieri</h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {enrollments.length} / {limit === 99 ? '∞' : limit}
                        </span>
                    </div>

                    {/* 1. Active Enrollments List */}
                    <div className="flex flex-wrap gap-2">
                        {enrollments.length > 0 ? enrollments.map((enr, idx) => (
                            <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-2 bg-gray-900 text-white rounded-xl shadow-sm border border-gray-800 animate-in fade-in zoom-in duration-200">
                                <div className="text-xs font-bold leading-none">
                                    {enr.groupName}
                                    <span className="block text-[9px] text-gray-400 font-medium mt-0.5">{enr.schedule}</span>
                                </div>
                                <button 
                                    onClick={() => handleRemoveEnrollment(idx)}
                                    className="p-1 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 italic py-2">Nicio grupă selectată.</p>
                        )}
                    </div>

                    {/* 2. Quick Group Picker */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adaugă Rapid</p>
                        </div>

                        {/* Style Tabs */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-3">
                            <button 
                                onClick={() => setActiveStyleTab('All')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border ${activeStyleTab === 'All' ? 'bg-white border-gray-300 text-gray-900 shadow-sm' : 'border-transparent text-gray-500 hover:bg-white/50'}`}
                            >
                                Toate
                            </button>
                            {Object.values(DanceStyle).map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setActiveStyleTab(s)} 
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all ${activeStyleTab === s ? 'bg-white border-gray-300 text-gray-900 shadow-sm' : 'border-transparent text-gray-500 hover:bg-white/50'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Group Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                            {filteredAvailableGroups.map(g => {
                                const isSelected = enrollments.some(e => e.groupId === g.id);
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => !isSelected && toggleGroupEnrollment(g.id)}
                                        disabled={isSelected}
                                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 relative overflow-hidden group ${
                                            isSelected 
                                            ? 'bg-gray-100 border-gray-200 opacity-50 cursor-default' 
                                            : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <span className="text-xs font-bold text-gray-900 truncate pr-4">{g.name}</span>
                                            {isSelected && <Check size={12} className="text-green-600 absolute right-2 top-3"/>}
                                            {!isSelected && <Plus size={12} className="text-blue-500 absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity"/>}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-gray-500 font-medium">
                                            <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{g.style}</span>
                                            <span>{g.schedule.day} {g.schedule.time}</span>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredAvailableGroups.length === 0 && (
                                <p className="col-span-2 text-center text-xs text-gray-400 py-4">Nicio grupă disponibilă pentru filtrul curent.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Button variant="secondary" onClick={onCancel}>Anulează</Button>
                <Button onClick={handleSave} className="bg-brand-yellow hover:bg-yellow-500 text-gray-900">Salvează Modificările</Button>
            </div>
        </div>
    );
};
