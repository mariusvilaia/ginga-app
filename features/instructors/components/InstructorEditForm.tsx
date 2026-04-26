
import React, { useState } from 'react';
import { InstructorProfile, DanceStyle, SkillLevel } from '../../../types';
import { Button, Input } from '../../../components/UIComponents';
import { Mail, Phone, Instagram, Facebook, Briefcase, DollarSign, Clock, Star, TrendingUp, User } from 'lucide-react';

interface InstructorEditFormProps {
    instructor: InstructorProfile;
    onSave: (updated: InstructorProfile) => void;
    onCancel: () => void;
}

export const InstructorEditForm: React.FC<InstructorEditFormProps> = ({ instructor, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: instructor.name,
        email: instructor.email,
        phone: instructor.phone,
        bio: instructor.bio || '',
        specialization: instructor.specialization || '',
        status: instructor.status,
        hourlyRate: instructor.contract?.hourlyRate || 0,
        instagram: instructor.socialMedia?.instagram || '',
        facebook: instructor.socialMedia?.facebook || '',
        styles: instructor.styles || [],
        levels: instructor.levels || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const handleSave = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Obligatoriu';
        if (!formData.email.trim()) newErrors.email = 'Obligatoriu';
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        onSave({
            ...instructor,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            bio: formData.bio,
            specialization: formData.specialization,
            status: formData.status,
            socialMedia: {
                instagram: formData.instagram,
                facebook: formData.facebook
            },
            styles: formData.styles,
            levels: formData.levels,
            contract: {
                ...instructor.contract,
                hourlyRate: Number(formData.hourlyRate)
            }
        });
    };

    const toggleStyle = (style: DanceStyle) => {
        setFormData(prev => ({
            ...prev,
            styles: prev.styles.includes(style) 
                ? prev.styles.filter(s => s !== style) 
                : [...prev.styles, style]
        }));
    };

    const toggleLevel = (level: SkillLevel) => {
        setFormData(prev => ({
            ...prev,
            levels: prev.levels.includes(level) 
                ? prev.levels.filter(l => l !== level) 
                : [...prev.levels, level]
        }));
    };

    return (
        <div className="space-y-6 pb-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Editare Profil Instructor</h3>
            </div>
            
            {/* Basic Info */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nume Complet" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} error={errors.name} />
                    <Input label="Email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Telefon" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                    <Input label="Specializare" value={formData.specialization} onChange={(e) => handleChange('specialization', e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Bio / Descriere</label>
                    <textarea 
                        value={formData.bio} 
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 transition-all font-medium min-h-[100px]"
                        placeholder="Scurtă descriere a instructorului..."
                    />
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Financial & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-[24px] border border-blue-100 dark:border-blue-900/30">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <DollarSign size={16} className="text-blue-600" /> Detalii Contract
                    </h4>
                    <div className="space-y-4">
                        <Input 
                            label="Tarif Orar (RON)" 
                            type="number" 
                            value={formData.hourlyRate} 
                            onChange={(e) => handleChange('hourlyRate', e.target.value)} 
                        />
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Status</label>
                            <select 
                                value={formData.status} 
                                onChange={(e) => handleChange('status', e.target.value)} 
                                className="w-full px-4 py-3 rounded-xl border-2 border-white shadow-sm bg-white text-gray-900 font-bold dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-blue-500"
                            >
                                <option value="active">Activ</option>
                                <option value="break">Pauză</option>
                                <option value="inactive">Inactiv</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50/50 dark:bg-purple-900/10 p-5 rounded-[24px] border border-purple-100 dark:border-purple-900/30">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <Instagram size={16} className="text-purple-600" /> Social Media
                    </h4>
                    <div className="space-y-4">
                        <Input label="Instagram" value={formData.instagram} onChange={(e) => handleChange('instagram', e.target.value)} placeholder="@username" />
                        <Input label="Facebook" value={formData.facebook} onChange={(e) => handleChange('facebook', e.target.value)} placeholder="facebook.com/profile" />
                    </div>
                </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Styles & Levels */}
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-gray-400">Stiluri de Dans</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(DanceStyle).map(style => (
                            <button
                                key={style}
                                onClick={() => toggleStyle(style)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    formData.styles.includes(style)
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-gray-400">Niveluri Predate</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(SkillLevel).map(level => (
                            <button
                                key={level}
                                onClick={() => toggleLevel(level)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    formData.levels.includes(level)
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
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
