
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronLeft, Star, TrendingUp,
  Clock, AlertTriangle, MessageSquare, Camera, Phone, Crop, Upload, Trash2, CheckCircle2, UserPlus, AlertOctagon, LayoutGrid, List as ListIcon, Filter, Users, Activity, Zap, User
} from 'lucide-react';
import { InstructorProfile } from '../../types';
import { Button, Badge, Modal } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { normalizeText, smartSearch } from '../../utils/searchUtils';

interface InstructorsViewProps {
    initialInstructorId: string | null;
    onClearInitial: () => void;
}

export const InstructorsView: React.FC<InstructorsViewProps> = ({ initialInstructorId, onClearInitial }) => {
    const { instructors, updateInstructor, deleteInstructor, groups } = useData();
    const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(initialInstructorId);
    const [searchTerm, setSearchTerm] = useState('');
    const [instructorToDelete, setInstructorToDelete] = useState<{id: string, name: string} | null>(null);
    const [activeFilter, setActiveFilter] = useState('Toți');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Image Upload State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialInstructorId) setSelectedInstructorId(initialInstructorId);
    }, [initialInstructorId]);

    // Paste Image Listener
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!selectedInstructorId) return;

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
    }, [selectedInstructorId]);

    const handleBack = () => {
        setSelectedInstructorId(null);
        onClearInitial();
    };

    const handleDeleteInstructor = async () => {
        if (instructorToDelete) {
            await deleteInstructor(instructorToDelete.id);
            setInstructorToDelete(null);
            if (selectedInstructorId === instructorToDelete.id) {
                handleBack();
            }
        }
    };

    const selectedInstructor = instructors.find(i => i.id === selectedInstructorId);

    // Compute groups for the selected instructor dynamically
    const instructorGroups = selectedInstructor 
        ? groups.filter(g => g.instructors.some(i => i.id === selectedInstructor.id || (i.name && selectedInstructor.name && i.name.includes(selectedInstructor.name))))
        : [];

    // Filter Logic
    const filteredInstructors = instructors.filter(i => {
        const matchesSearch = smartSearch(searchTerm, i.name) || smartSearch(searchTerm, i.email);
        
        let matchesFilter = true;
        if (activeFilter !== 'Toți') {
            if (activeFilter === 'Rating 4.5+') matchesFilter = (i.kpi?.averageRating || 0) >= 4.5;
            else if (activeFilter === 'Risc Ridicat') matchesFilter = (i.riskScore || 0) > 20 || i.name.includes('Adelin');
            else if (activeFilter === 'Activ') matchesFilter = i.status === 'active';
            else matchesFilter = (i.styles || []).some(s => s === activeFilter);
        }

        return matchesSearch && matchesFilter;
    });

    // Stats Calculation
    const totalInstructors = instructors.length;
    const activeCount = instructors.filter(i => i.status === 'active').length;
    const avgRating = (instructors.reduce((acc, i) => acc + (i.kpi?.averageRating || 0), 0) / (totalInstructors || 1)).toFixed(1);

    // Demo: Find high risk instructor for banner (Adelin or anyone with high risk)
    const highRiskInstructor = instructors.find(i => i.name.includes('Adelin')) || instructors.find(i => i.riskScore > 50);

    // --- Image Handling Handlers ---
    const triggerFileInput = () => {
        fileInputRef.current?.click();
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

    const handleReCrop = () => {
        // Use original uploaded if available, otherwise current avatar
        if (originalImageSrc) {
            setCropImageSrc(originalImageSrc);
        } else if (selectedInstructor?.avatarUrl) {
            setCropImageSrc(selectedInstructor.avatarUrl);
        }
    };

    const handleDeleteImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedInstructorId && window.confirm('Sigur vrei să ștergi poza de profil?')) {
            // Set to empty string or a default placeholder URL if you prefer
            await updateInstructor(selectedInstructorId, { avatarUrl: '' });
            setOriginalImageSrc(null);
            setCropImageSrc(null);
        }
    };

    const handleCropComplete = async (base64Image: string) => {
        if (selectedInstructorId) {
            await updateInstructor(selectedInstructorId, { avatarUrl: base64Image });
        }
        setCropImageSrc(null);
    };

    const handleWhatsApp = (phone: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const finalPhone = cleanPhone.length === 10 ? `40${cleanPhone}` : cleanPhone;
        window.open(`https://wa.me/${finalPhone}`, '_blank');
    };

    const getRiskBadge = (score: number) => {
        if (score < 5) return <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-green-100"><CheckCircle2 size={12}/> Fără Risc</span>;
        if (score < 20) return <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-yellow-100"><AlertTriangle size={12}/> Risc Mediu</span>;
        return <span className="flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-red-100"><AlertTriangle size={12}/> Risc Ridicat</span>;
    };

    if (selectedInstructor) {
        // DETAIL VIEW
        return (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                {/* CROPPER MODAL */}
                {cropImageSrc && (
                    <ImageCropper src={cropImageSrc} onCrop={handleCropComplete} onCancel={() => setCropImageSrc(null)} />
                )}

                {/* DELETE MODAL */}
                <Modal isOpen={!!instructorToDelete} onClose={() => setInstructorToDelete(null)} title="Șterge Instructor">
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <div className="p-2 bg-white rounded-lg text-red-600"><Trash2 size={24} /></div>
                            <div>
                                <h4 className="font-bold text-red-900 text-sm">Acțiune Ireversibilă</h4>
                                <p className="text-xs text-red-700 mt-1">Ești pe cale să ștergi definitiv instructorul <strong>{instructorToDelete?.name}</strong>.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" onClick={() => setInstructorToDelete(null)}>Anulează</Button>
                            <Button variant="danger" onClick={handleDeleteInstructor}>Șterge Definitiv</Button>
                        </div>
                    </div>
                </Modal>

                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 w-fit transition-colors">
                    <ChevronLeft size={18} /> <span className="font-medium text-sm">Înapoi la listă</span>
                </button>

                <div className="flex flex-col xl:flex-row gap-8 h-full overflow-hidden">
                    {/* LEFT COLUMN: Profile Card */}
                    <div className="w-full xl:w-96 flex-shrink-0 overflow-y-auto no-scrollbar pb-10">
                        <div className="bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 text-center sticky top-0 shadow-sm">
                            
                            {/* Avatar Section */}
                            <div className="relative inline-block group cursor-pointer" onClick={triggerFileInput} title="Click sau Paste (Ctrl+V) pentru poză">
                                {selectedInstructor.avatarUrl ? (
                                    <img 
                                        src={selectedInstructor.avatarUrl} 
                                        className="w-40 h-40 rounded-full mx-auto border-[6px] border-gray-50 dark:border-gray-800 object-cover bg-gray-100 shadow-sm" 
                                        alt={selectedInstructor.name} 
                                    />
                                ) : (
                                    <div className="w-40 h-40 rounded-full mx-auto border-[6px] border-gray-50 dark:border-gray-800 shadow-sm bg-gray-100 flex items-center justify-center">
                                        <User size={64} className="text-gray-300" />
                                    </div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-black/40 p-2 rounded-full backdrop-blur-sm"><Camera size={24} className="text-white" /></div></div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect}/>
                            </div>

                            {/* Avatar Actions */}
                            <div className="flex justify-center gap-3 mt-4 mb-6">
                                <button onClick={triggerFileInput} className="text-[10px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <Upload size={12}/> {selectedInstructor.avatarUrl ? 'Schimbă' : 'Încarcă'}
                                </button>
                                {(selectedInstructor.avatarUrl || originalImageSrc) && (
                                    <>
                                        <button onClick={handleReCrop} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                            <Crop size={12} /> Ajustează
                                        </button>
                                        <button onClick={handleDeleteImage} className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                            <Trash2 size={12} /> Șterge
                                        </button>
                                    </>
                                )}
                            </div>

                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{selectedInstructor.name}</h2>
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {(selectedInstructor.styles || []).map(s => <span key={s} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase">{s}</span>)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-left border-t border-gray-100 dark:border-gray-800 pt-6">
                                <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Telefon</p><div className="flex items-center gap-2"><p className="text-sm font-bold text-gray-900 dark:text-white">{selectedInstructor.phone}</p><div className="flex gap-1"><a href={`tel:${selectedInstructor.phone}`} className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><Phone size={14} /></a><button onClick={() => handleWhatsApp(selectedInstructor.phone)} className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:text-green-600"><MessageSquare size={14} /></button></div></div></div>
                                <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p><p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{selectedInstructor.status}</p></div>
                            </div>
                            <div className="mt-8 flex gap-2"><Button variant="secondary" className="flex-1">Vezi Contract</Button><button onClick={() => setInstructorToDelete({id: selectedInstructor.id, name: selectedInstructor.name})} className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={20} /></button></div>
                        </div>
                    </div>
                    {/* RIGHT COLUMN */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Rating', value: selectedInstructor.kpi?.averageRating, icon: <Star size={16} className="text-yellow-400 fill-yellow-400"/> },
                                { label: 'Retenție', value: selectedInstructor.kpi?.retentionRate + '%', icon: <TrendingUp size={16} className="text-green-500"/> },
                                { label: 'Punctualitate', value: selectedInstructor.kpi?.punctuality + '%', icon: null },
                                { label: 'Elevi Noi', value: `+${selectedInstructor.kpi?.newStudentsThisMonth}`, icon: null, color: 'text-blue-600' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                    <div className="flex items-center gap-2"><span className={`text-2xl font-black ${stat.color || 'text-gray-900 dark:text-white'}`}>{stat.value}</span>{stat.icon}</div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"><h3 className="font-bold text-gray-900 dark:text-white mb-4">Grupe Active</h3><div className="space-y-3">{instructorGroups.map((group, idx) => (<div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"><div><h4 className="font-bold text-gray-900 dark:text-white text-sm">{group.name}</h4><div className="flex items-center gap-3 text-xs text-gray-500 mt-1"><span className="flex items-center gap-1"> {group.stats.enrolledCount} Studenți</span><span className={`font-bold ${group.stats.energyLevel === 'High' ? 'text-green-600' : 'text-orange-500'}`}>{group.stats.energyLevel} Energy</span></div></div><Badge color={group.stats.trend === 'growing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{group.stats.trend}</Badge></div>))}</div></div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="h-full flex flex-col space-y-6">
            
            {/* DELETE MODAL */}
            <Modal isOpen={!!instructorToDelete} onClose={() => setInstructorToDelete(null)} title="Șterge Instructor">
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg text-red-600"><Trash2 size={24} /></div>
                        <div><h4 className="font-bold text-red-900 text-sm">Acțiune Ireversibilă</h4><p className="text-xs text-red-700 mt-1">Ești pe cale să ștergi definitiv instructorul <strong>{instructorToDelete?.name}</strong>.</p></div>
                    </div>
                    <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={() => setInstructorToDelete(null)}>Anulează</Button><Button variant="danger" onClick={handleDeleteInstructor}>Șterge Definitiv</Button></div>
                </div>
            </Modal>

            {/* 1. Header & Quick Stats */}
            <div className="flex flex-col gap-6 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Instructori</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestionează echipa, performanța și orarul.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button className="!w-auto h-10 px-4 text-xs bg-gray-900 text-white hover:bg-black gap-2 shadow-lg shadow-gray-200">
                            <UserPlus size={16}/> Adaugă Instructor
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20}/></div>
                        <div><p className="text-2xl font-black text-gray-900 dark:text-white">{totalInstructors}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Total</p></div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Activity size={20}/></div>
                        <div><p className="text-2xl font-black text-gray-900 dark:text-white">{activeCount}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Activi</p></div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl"><Star size={20}/></div>
                        <div><p className="text-2xl font-black text-gray-900 dark:text-white">{avgRating}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Rating Mediu</p></div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Zap size={20}/></div>
                        <div><p className="text-2xl font-black text-gray-900 dark:text-white">High</p><p className="text-[10px] font-bold text-gray-400 uppercase">Energy Level</p></div>
                    </div>
                </div>
            </div>

            {/* 2. Controls & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-2 pl-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
                <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                    {['Toți', 'Salsa', 'Bachata', 'Kizomba', 'Rating 4.5+', 'Risc Ridicat', 'Activ'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                activeFilter === filter 
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {filter === 'Rating 4.5+' && <Star size={12} className="inline mr-1 text-yellow-500 fill-yellow-500"/>}
                            {filter === 'Risc Ridicat' && <AlertTriangle size={12} className="inline mr-1 text-red-500"/>}
                            {filter}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-800 pl-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Caută..." 
                            className="w-40 lg:w-56 bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
                         <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
                         <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}><ListIcon size={16} /></button>
                    </div>
                </div>
            </div>

            {/* 3. Alert Banner */}
            {highRiskInstructor && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-red-900/50 rounded-full flex items-center justify-center shadow-sm text-red-600 dark:text-red-400 shrink-0">
                            <AlertOctagon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Atenție Necesară: {highRiskInstructor.name}</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">Feedback negativ repetat în ultimele 2 săptămâni.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setSelectedInstructorId(highRiskInstructor.id)}
                        className="!w-auto bg-white text-red-600 border border-red-200 hover:bg-red-50 h-9 text-xs px-4"
                    >
                        Verifică Situația
                    </Button>
                </div>
            )}

            {/* 4. Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto no-scrollbar pb-10 flex-1">
                {filteredInstructors.map(instructor => (
                    <div 
                        key={instructor.id} 
                        className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-default flex flex-col h-full group"
                    >
                        {/* Header: Avatar + Info */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="relative group/avatar cursor-pointer" onClick={() => setSelectedInstructorId(instructor.id)}>
                                    <img 
                                        src={instructor.avatarUrl} 
                                        className="w-16 h-16 rounded-full object-cover border-4 border-gray-50 dark:border-gray-800 shadow-sm bg-gray-100 group-hover/avatar:scale-105 transition-transform" 
                                        alt={instructor.name} 
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                                        <div className={`w-3 h-3 rounded-full ${instructor.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 
                                        className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => setSelectedInstructorId(instructor.id)}
                                    >
                                        {instructor.name.split(' ')[0]}
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {(instructor.styles || []).slice(0, 2).map(s => (
                                            <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded-md">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {getRiskBadge(instructor.riskScore)}
                            </div>
                        </div>

                        {/* KPI Grid - Clean Look */}
                        <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-6 border border-gray-100 dark:border-gray-800">
                            {[
                                { label: 'Retenție', value: `${instructor.kpi?.retentionRate}%`, icon: <TrendingUp size={12} className="text-green-500"/> },
                                { label: 'Rating', value: instructor.kpi?.averageRating, icon: <Star size={12} className="text-yellow-400 fill-yellow-400"/> },
                                { label: 'Cursanți Noi', value: `+${instructor.kpi?.newStudentsThisMonth}`, color: 'text-green-600' },
                                { label: 'Punctualitate', value: `${instructor.kpi?.punctuality}%` }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-900 p-3 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-lg font-black ${stat.color || 'text-gray-900 dark:text-white'}`}>{stat.value}</span>
                                        {stat.icon}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Schedule Preview */}
                        <div className="mb-6 flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Program Săptămânal</p>
                            <div className="space-y-2">
                                {instructor.schedule && instructor.schedule.length > 0 ? (
                                    instructor.schedule.slice(0, 3).map((slot, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <span className="font-bold text-gray-900 dark:text-white w-12">{slot.day.substring(0, 3)}</span>
                                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-bold">{slot.time}</span>
                                            <span className="text-gray-500 text-right flex-1 truncate ml-2">{slot.className}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded-lg text-center">Nu are clase programate.</p>
                                )}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                            <button 
                                onClick={() => setSelectedInstructorId(instructor.id)}
                                className="py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                                Profil
                            </button>
                            <button className="py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Feedback
                            </button>
                            <button className="py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                Istoric
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
