
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, Star, TrendingUp, TrendingDown,
  Clock, AlertTriangle, MessageSquare, Camera, Phone, Crop, Upload, Trash2, CheckCircle2, UserPlus, AlertOctagon, LayoutGrid, List as ListIcon, Filter, Users, Activity, Zap, User,
  Calendar, Wallet, StickyNote, Edit2, Mail, DollarSign, Info, ArrowUpRight, ArrowDownRight, MoreHorizontal, Lightbulb, Trophy, Medal, Target, BarChart3
} from 'lucide-react';
import { InstructorProfile } from '../../types';
import { Button, Badge, Modal } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';
import { ImageCropper } from '../../components/shared/ImageCropper';
import { normalizeText, smartSearch } from '../../utils/searchUtils';
import { InstructorEditForm } from './components/InstructorEditForm';
import { InstructorAttendanceTab } from './components/InstructorAttendanceTab';
import { InstructorManagerGeneralTab } from './components/InstructorManagerGeneralTab';

interface InstructorsViewProps {
    initialInstructorId: string | null;
    onClearInitial: () => void;
}

export const InstructorsView: React.FC<InstructorsViewProps> = ({ initialInstructorId, onClearInitial }) => {
    const { instructors, updateInstructor, deleteInstructor, groups, instructorAttendance, classes, vacationPeriods, updateInstructorAttendance } = useData();
    const [activeTab, setActiveTab] = useState<'General' | 'Prezență' | 'Financiar' | 'Feedback'>('General');
    const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(initialInstructorId);
    const [isEditingInstructor, setIsEditingInstructor] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [instructorToDelete, setInstructorToDelete] = useState<{id: string, name: string} | null>(null);
    const [activeFilter, setActiveFilter] = useState('Toți');
    const [sortBy, setSortBy] = useState<'activeStudents' | 'monthlyRevenue' | 'retention' | 'rating' | 'growth' | 'score'>('score');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [viewTab, setViewTab] = useState<'management' | 'echipa'>('management');

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
            else if (activeFilter === 'Risc Ridicat') matchesFilter = (i.riskScore || 0) > 20 || i.name?.includes('Adelin');
            else if (activeFilter === 'Activ') matchesFilter = i.status === 'active';
            else if (activeFilter === 'Top performeri') matchesFilter = (i.managerMetrics?.instructorScore || 0) >= 90;
            else if (activeFilter === 'În creștere') matchesFilter = (i.managerMetrics?.activeStudentsDelta || 0) > 0;
            else if (activeFilter === 'În scădere') matchesFilter = (i.managerMetrics?.activeStudentsDelta || 0) < 0;
            else matchesFilter = (i.styles || []).some(s => s === activeFilter);
        }

        return matchesSearch && matchesFilter;
    });

    const sortedInstructors = [...filteredInstructors].sort((a, b) => {
        if (sortBy === 'activeStudents') return (b.managerMetrics?.activeStudents || 0) - (a.managerMetrics?.activeStudents || 0);
        if (sortBy === 'monthlyRevenue') return (b.managerMetrics?.revenueMonth || 0) - (a.managerMetrics?.revenueMonth || 0);
        if (sortBy === 'retention') return (b.kpi?.retentionRate || 0) - (a.kpi?.retentionRate || 0);
        if (sortBy === 'rating') return (b.kpi?.averageRating || 0) - (a.kpi?.averageRating || 0);
        if (sortBy === 'growth') return (b.managerMetrics?.activeStudentsDelta || 0) - (a.managerMetrics?.activeStudentsDelta || 0);
        if (sortBy === 'score') return (b.managerMetrics?.instructorScore || 0) - (a.managerMetrics?.instructorScore || 0);
        return 0;
    });

    // Stats Calculation
    const totalInstructors = instructors.length;
    const activeCount = instructors.filter(i => i.status === 'active').length;
    const totalStudents = instructors.reduce((acc, i) => acc + (i.managerMetrics?.activeStudents || 15), 0); // Mock fallback
    const avgRetention = (instructors.reduce((acc, i) => acc + (i.kpi?.retentionRate || 85), 0) / (totalInstructors || 1)).toFixed(0);
    const avgRating = (instructors.reduce((acc, i) => acc + (i.kpi?.averageRating || 4.8), 0) / (totalInstructors || 1)).toFixed(1);
    const newStudentsThisMonth = instructors.reduce((acc, i) => acc + (i.kpi?.newStudentsThisMonth || 5), 0);
    const totalRevenue = instructors.reduce((acc, i) => acc + (i.managerMetrics?.revenueMonth || 4500), 0);

    // Demo: Find high risk instructor for banner (Adelin or anyone with high risk)
    const highRiskInstructor = instructors.find(i => i.name?.includes('Adelin')) || instructors.find(i => i.riskScore > 50);

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

                {/* EDIT MODAL */}
                <Modal isOpen={isEditingInstructor} onClose={() => setIsEditingInstructor(false)} title="Editează Instructor">
                    {selectedInstructor && (
                        <InstructorEditForm 
                            instructor={selectedInstructor} 
                            onSave={async (updated) => {
                                await updateInstructor(updated.id, updated);
                                setIsEditingInstructor(false);
                            }} 
                            onCancel={() => setIsEditingInstructor(false)} 
                        />
                    )}
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
                                        src={selectedInstructor.avatarUrl || ''} 
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
                            {selectedInstructor.specialization && (
                                <p className="text-sm font-bold text-blue-600 mb-2">{selectedInstructor.specialization}</p>
                            )}
                            {selectedInstructor.bio && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 px-4">{selectedInstructor.bio}</p>
                            )}
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                {(selectedInstructor.styles || []).map(s => <span key={s} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase">{s}</span>)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left border-t border-gray-100 dark:border-gray-800 pt-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Telefon</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedInstructor.phone}</p>
                                        <div className="flex gap-1">
                                            <a href={`tel:${selectedInstructor.phone}`} className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><Phone size={14} /></a>
                                            <button onClick={() => handleWhatsApp(selectedInstructor.phone)} className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:text-green-600"><MessageSquare size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Email</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{selectedInstructor.email}</p>
                                        <a href={`mailto:${selectedInstructor.email}`} className="p-1.5 bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><Mail size={14} /></a>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-left border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                                <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p><p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{selectedInstructor.status}</p></div>
                                <div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tarif Orar</p><p className="text-sm font-bold text-blue-600">{selectedInstructor.contract?.hourlyRate} RON</p></div>
                            </div>

                            <div className="mt-8 flex gap-2">
                                <Button onClick={() => setIsEditingInstructor(true)} variant="secondary" className="flex-1 gap-2">
                                    <Edit2 size={16} /> Editează Profil
                                </Button>
                                <button onClick={() => setInstructorToDelete({id: selectedInstructor.id, name: selectedInstructor.name})} className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* RIGHT COLUMN */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                        {/* Tabs */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                            {['General', 'Prezență', 'Financiar', 'Feedback'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                                        activeTab === tab 
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-10 animate-in fade-in duration-300">
                            {activeTab === 'General' && (
                                <InstructorManagerGeneralTab 
                                    instructor={selectedInstructor} 
                                    onAction={(action, data) => console.log('Manager Action:', action, data)}
                                />
                            )}
                            {activeTab === 'Prezență' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-bold text-gray-900 dark:text-white">Filtrare Grupe</h3>
                                            <select className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-blue-500">
                                                <option>Toate Grupele</option>
                                                {(instructorGroups || []).map(g => <option key={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                        <Badge color="bg-blue-100 text-blue-700">Total: {(instructorAttendance || []).length} ședințe</Badge>
                                    </div>
                                    <InstructorAttendanceTab 
                                        instructor={selectedInstructor}
                                        attendance={instructorAttendance || []}
                                        allClasses={classes}
                                        vacationPeriods={vacationPeriods}
                                        onUpdateStatus={updateInstructorAttendance}
                                    />
                                </div>
                            )}
                            {activeTab === 'Financiar' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <h3 className="font-bold text-gray-900 dark:text-white">Analiză Financiară</h3>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><ChevronLeft size={16}/></button>
                                            <span className="text-xs font-bold px-4">Martie 2026</span>
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><ChevronRight size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                <DollarSign size={18} className="text-emerald-500"/> Venituri vs Costuri per Grupă
                                            </h3>
                                            <div className="space-y-4">
                                                {(instructorGroups || []).map((group, idx) => {
                                                    const revenue = group.stats.enrolledCount * 250;
                                                    const cost = selectedInstructor.contract?.hourlyRate * 8; // approx 8h/month
                                                    const profit = revenue - cost;
                                                    return (
                                                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{group.name}</h4>
                                                                <Badge color={profit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                                    Profit: {profit} RON
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Venit</p>
                                                                    <p className="text-sm font-black text-emerald-600">{revenue} RON</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Cost</p>
                                                                    <p className="text-sm font-black text-orange-600">{cost} RON</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Margine</p>
                                                                    <p className="text-sm font-black text-blue-600">{Math.round((profit/revenue)*100)}%</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Venit / elev</p>
                                                                    <p className="text-sm font-black text-gray-900 dark:text-white">{Math.round(revenue / group.stats.enrolledCount)} RON</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                <Info size={18} className="text-blue-500"/> Sumar Contract
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Tarif Orar</span>
                                                    <span className="text-sm font-black text-blue-900 dark:text-white">{selectedInstructor.contract?.hourlyRate} RON/h</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                    <span className="text-xs font-bold text-gray-500">Ore Lucrate</span>
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">{selectedInstructor.contract?.hoursThisMonth}h</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                    <span className="text-xs font-bold text-gray-500">Bonus Performanță</span>
                                                    <span className="text-sm font-black text-green-600">+250 RON</span>
                                                </div>
                                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">Total de Plată</span>
                                                    <span className="text-lg font-black text-blue-600">{selectedInstructor.contract?.totalToPay} RON</span>
                                                </div>
                                                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">Generează Factură</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'Feedback' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rating Mediu</p>
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <span className="text-5xl font-black text-gray-900 dark:text-white">{selectedInstructor.kpi?.averageRating}</span>
                                                <Star size={32} className="text-yellow-400 fill-yellow-400" />
                                            </div>
                                            <div className="flex items-center justify-center gap-1 mb-4">
                                                <TrendingUp size={12} className="text-green-500" />
                                                <span className="text-[10px] font-bold text-green-600">Scor feedback ultimele 30 zile: 4.9 (+0.3)</span>
                                            </div>
                                            <div className="space-y-2">
                                                {[5, 4, 3, 2, 1].map(star => (
                                                    <div key={star} className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 w-4">{star}★</span>
                                                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: star === 5 ? '85%' : star === 4 ? '10%' : '5%' }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 w-8">{star === 5 ? '85%' : star === 4 ? '10%' : '5%'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                                <MessageSquare size={18} className="text-blue-500"/> Teme Recurente (AI Insights)
                                            </h3>
                                            <div className="space-y-6 mb-8">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Teme Pozitive</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Energie Ridicată', 'Explicații Clare', 'Punctualitate', 'Tehnică Bună', 'Muzicalitate', 'Răbdare'].map(tag => (
                                                            <Badge key={tag} color="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-bold">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Teme Negative</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Coregrafie Grea', 'Muzică Prea Tare'].map(tag => (
                                                            <Badge key={tag} color="bg-red-50 text-red-700 border border-red-100 px-4 py-2 rounded-xl text-xs font-bold">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-6">Feedback Recent</h3>
                                            <div className="space-y-4">
                                                {(selectedInstructor.recentFeedback || []).map((f, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">E</div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Elev Anonim</p>
                                                                    <p className="text-[10px] text-gray-400">{f.date || 'Acum 2 zile'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className={s <= 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />)}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">"{f.text}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="space-y-8 pb-20">
            
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

            {/* Tab Navigation & Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl w-fit border border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => setViewTab('management')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            viewTab === 'management' 
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        <BarChart3 size={16}/> Management
                    </button>
                    <button 
                        onClick={() => setViewTab('echipa')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            viewTab === 'echipa' 
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                        <Users size={16}/> Echipă
                    </button>
                </div>
                <Button className="!w-auto h-10 px-4 text-xs bg-yellow-400 text-black hover:bg-yellow-500 font-bold gap-2 shadow-lg shadow-yellow-100 border-none">
                    <UserPlus size={16}/> Adaugă Instructor
                </Button>
            </div>

                {viewTab === 'management' && (
                    <>
                        {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Instructori activi</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">{activeCount}</h4>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-medium text-green-600 flex items-center gap-0.5"><ArrowUpRight size={10}/> +1</span>
                                <span className="text-[8px] text-gray-400">↑ 5% (3 luni)</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Elevi total</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">{totalStudents}</h4>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-medium text-green-600 flex items-center gap-0.5"><ArrowUpRight size={10}/> +12%</span>
                                <span className="text-[8px] text-gray-400">↑ 18% (3 luni)</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Retenție medie</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">{avgRetention}%</h4>
                            <span className="text-[10px] font-medium text-red-600 flex items-center gap-0.5"><ArrowDownRight size={10}/> -2%</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Rating mediu</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">{avgRating}</h4>
                            <span className="text-[10px] font-medium text-green-600 flex items-center gap-0.5"><ArrowUpRight size={10}/> +0.1</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Elevi noi (lună)</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">{newStudentsThisMonth}</h4>
                            <span className="text-[10px] font-medium text-green-600 flex items-center gap-0.5"><ArrowUpRight size={10}/> +5</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Venit generat</p>
                        <div className="flex items-end justify-between">
                            <h4 className="text-2xl font-semibold text-blue-600">{totalRevenue.toLocaleString()}</h4>
                            <span className="text-[10px] font-medium text-green-600 flex items-center gap-0.5"><ArrowUpRight size={10}/> +8%</span>
                        </div>
                    </div>
                </div>

                {/* Insights Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[24px] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb size={18} className="text-blue-600"/>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-widest">Insights echipă</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { text: "Grupa de Bachata a lui Robert crește rapid (+20 elevi).", type: "growth", label: "Creștere", color: "text-green-600 bg-green-50" },
                                { text: "Grupa Start a lui Adelin pierde elevi (-4).", type: "decline", label: "Problemă", color: "text-red-600 bg-red-50" },
                                { text: "Retenția medie la Bachata este mai mare decât la Salsa.", type: "comparison", label: "Observație", color: "text-blue-600 bg-blue-50" },
                                { text: "Agata are cel mai mare rating din echipă (5.0).", type: "performance", label: "Performanță", color: "text-yellow-600 bg-yellow-50" }
                            ].map((insight, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20 shadow-sm flex items-start gap-3">
                                    <div className={`p-1.5 rounded-lg ${
                                        insight.type === 'growth' ? 'bg-green-50 text-green-600' :
                                        insight.type === 'decline' ? 'bg-red-50 text-red-600' :
                                        insight.type === 'comparison' ? 'bg-blue-50 text-blue-600' :
                                        'bg-yellow-50 text-yellow-600'
                                    }`}>
                                        {insight.type === 'growth' ? <TrendingUp size={14}/> :
                                         insight.type === 'decline' ? <TrendingDown size={14}/> :
                                         insight.type === 'comparison' ? <Activity size={14}/> :
                                         <Star size={14}/>}
                                    </div>
                                    <div>
                                        <span className={`text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded ${insight.color} mb-1 inline-block`}>{insight.label}</span>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{insight.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Instructors Section */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px] p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={18} className="text-yellow-500"/>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-widest">Top luna aceasta</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { name: "Robert", detail: "+20 elevi", icon: "🥇", color: "text-yellow-600" },
                                { name: "Adrian", detail: "+15 elevi", icon: "🥈", color: "text-gray-500" },
                                { name: "Agata", detail: "Rating 5.0", icon: "🥉", color: "text-orange-600" }
                            ].map((top, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{top.icon}</span>
                                        <div>
                                            <p className="text-xs font-medium text-gray-900 dark:text-white">{top.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase">{top.detail}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Performance Heatmap */}
                <div className="bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={18} className="text-gray-400"/>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-widest">Performanță Instructori</h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Excelent (90+)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Bun (75-89)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Mediu (60-74)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Risc (&lt;60)</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {instructors.map(inst => {
                            const score = inst.managerMetrics?.instructorScore || 75;
                            const color = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-blue-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                            return (
                                <div key={inst.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group/heat cursor-help relative">
                                    <img src={inst.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt=""/>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{inst.name.split(' ')[0]}</span>
                                    <div className={`w-2 h-2 rounded-full ${color}`}></div>
                                    
                                    {/* Tooltip-like detail */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover/heat:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                        <p className="font-black mb-1">{inst.name}</p>
                                        <p className="flex justify-between">Scor: <span className="font-black">{score}</span></p>
                                        <p className="flex justify-between">Elevi: <span className="font-black">{inst.managerMetrics?.activeStudents || 0}</span></p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
            )}

            {viewTab === 'echipa' && (
                <>
                    {/* 2. Controls & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-2 pl-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm shrink-0">
                <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                    {['Toți', 'Top performeri', 'În creștere', 'În scădere', 'Risc ridicat', 'Salsa', 'Bachata', 'Kizomba'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                activeFilter === filter 
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {filter === 'Top performeri' && <Star size={12} className="inline mr-1 text-yellow-500 fill-yellow-500"/>}
                            {filter === 'Risc ridicat' && <AlertTriangle size={12} className="inline mr-1 text-red-500"/>}
                            {filter === 'În creștere' && <TrendingUp size={12} className="inline mr-1 text-green-500"/>}
                            {filter === 'În scădere' && <TrendingDown size={12} className="inline mr-1 text-red-500"/>}
                            {filter}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-800 pl-4">
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select 
                            className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2 pl-9 pr-8 text-xs font-bold outline-none focus:ring-2 focus:ring-gray-200 transition-all appearance-none cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="score">Sortează după: Scor</option>
                            <option value="activeStudents">Elevi activi</option>
                            <option value="monthlyRevenue">Venit lunar</option>
                            <option value="retention">Retenție</option>
                            <option value="rating">Rating</option>
                            <option value="growth">Creștere elevi</option>
                        </select>
                    </div>
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
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2 shadow-sm shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white dark:bg-red-900/50 rounded-full flex items-center justify-center shadow-md text-red-600 dark:text-red-400 shrink-0 border border-red-100">
                            <AlertOctagon size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded">Gravitate: Ridicată</span>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Atenție Necesară: {highRiskInstructor.name}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                                <span className="font-bold text-red-700">Motiv:</span> Feedback negativ repetat (3 clase) & Retenție în scădere drastică (-15%).
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={() => setSelectedInstructorId(highRiskInstructor.id)}
                            className="!w-auto bg-yellow-400 text-black hover:bg-yellow-500 h-10 text-xs px-6 font-bold shadow-lg shadow-yellow-100 border-none"
                        >
                            Vezi Detalii & Acțiuni
                        </Button>
                    </div>
                </div>
            )}

            {/* 4. Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8">
                {sortedInstructors.map(instructor => {
                    const score = instructor.managerMetrics?.instructorScore || 75;
                    const scoreColor = score >= 90 ? 'text-green-600 bg-green-50' : score >= 75 ? 'text-blue-600 bg-blue-50' : score >= 60 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
                    const scoreBorder = score >= 90 ? 'border-green-100' : score >= 75 ? 'border-blue-100' : score >= 60 ? 'border-yellow-100' : 'border-red-100';
                    const growth = instructor.managerMetrics?.activeStudentsDelta || 0;
                    
                    // Specific Risk Reason logic
                    let riskReason = instructor.riskReason;
                    if (!riskReason) {
                        if ((instructor.kpi?.retentionRate || 0) < 70) riskReason = "Retenție scăzută";
                        else if (growth < -5) riskReason = "Scădere elevi";
                        else if ((instructor.kpi?.averageRating || 0) < 4.0) riskReason = "Feedback negativ";
                    }

                    return (
                        <div 
                            key={instructor.id} 
                            className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all cursor-default flex flex-col group relative overflow-hidden min-h-[500px]"
                        >
                            {/* Performance Badge */}
                            {score >= 90 && (
                                <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter shadow-sm z-10">🔥 Top Performer</div>
                            )}
                            {growth >= 10 && score < 90 && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter shadow-sm z-10">📈 Creștere Rapidă</div>
                            )}

                            {/* Header: Avatar + Info */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-5">
                                    <div className="relative group/avatar cursor-pointer" onClick={() => setSelectedInstructorId(instructor.id)}>
                                        <img 
                                            src={instructor.avatarUrl || ''} 
                                            className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 dark:border-gray-800 shadow-md bg-gray-100 group-hover/avatar:scale-105 transition-transform" 
                                            alt={instructor.name} 
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border-2 border-gray-50">
                                            {/* Indicator dot removed */}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex flex-col gap-1 mb-2">
                                            <h3 
                                                className="text-xl font-black text-gray-900 dark:text-white leading-tight cursor-pointer hover:text-blue-600 transition-colors"
                                                onClick={() => setSelectedInstructorId(instructor.id)}
                                            >
                                                {instructor.name}
                                            </h3>
                                            <div className="flex flex-wrap gap-1">
                                                {(instructor.styles || []).slice(0, 2).map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[9px] font-black uppercase rounded">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {riskReason && (
                                            <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase border border-red-100">
                                                <AlertTriangle size={10}/> {riskReason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${scoreBorder} ${scoreColor} shadow-sm self-start`}>
                                    <span className="text-[8px] font-semibold uppercase tracking-tighter opacity-70">Scor</span>
                                    <span className="text-xs font-semibold">{score}</span>
                                </div>
                            </div>

                            {/* Performance Section */}
                            <div className="grid grid-cols-3 gap-3 mb-8">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-center border border-gray-100/50 dark:border-gray-700/50">
                                    <p className="text-[9px] font-medium text-gray-400 uppercase mb-1">Elevi activi</p>
                                    <p className="text-base font-semibold text-gray-900 dark:text-white">{instructor.managerMetrics?.activeStudents || 15}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-center border border-gray-100/50 dark:border-gray-700/50">
                                    <p className="text-[9px] font-medium text-gray-400 uppercase mb-1">Venit lunar</p>
                                    <p className="text-base font-semibold text-blue-600">{instructor.managerMetrics?.revenueMonth?.toLocaleString() || '4.500'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-center border border-gray-100/50 dark:border-gray-700/50">
                                    <p className="text-[9px] font-medium text-gray-400 uppercase mb-1">Profit net</p>
                                    <p className="text-base font-semibold text-green-600">{instructor.managerMetrics?.profitMonth?.toLocaleString() || '2.800'}</p>
                                </div>
                            </div>

                            {/* Quality & Evolution Section */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Retenție</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{instructor.kpi?.retentionRate}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Rating</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{instructor.kpi?.averageRating}</span>
                                            <Star size={12} className="text-yellow-400 fill-yellow-400"/>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Ocupare</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{instructor.managerMetrics?.occupancyPct || 75}%</span>
                                    </div>
                                </div>
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-[32px] flex flex-col items-center justify-center border border-blue-100/50 dark:border-blue-900/20 shadow-inner">
                                    <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1 tracking-widest">Elevi noi</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-semibold text-blue-700">{instructor.kpi?.newStudentsThisMonth}</span>
                                        {growth >= 0 ? <TrendingUp size={18} className="text-green-500"/> : <TrendingDown size={18} className="text-red-500"/>}
                                    </div>
                                    <p className={`text-[11px] font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                                        {growth > 0 ? `+${growth}` : growth} {growth >= 0 ? '↑' : '↓'}
                                    </p>
                                </div>
                            </div>

                            {/* Schedule Summary */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400"/>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Program</p>
                                    </div>
                                    <p className="text-[10px] font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{instructor.schedule?.length || 0} clase / săptămână</p>
                                </div>
                                <details className="group/schedule">
                                    <summary className="list-none cursor-pointer text-[10px] font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 transition-colors">
                                        Vezi orar complet <ChevronRight size={12} className="group-open/schedule:rotate-90 transition-transform"/>
                                    </summary>
                                    <div className="space-y-2 mt-3 animate-in slide-in-from-top-2 duration-300">
                                        {instructor.schedule?.map((slot, i) => (
                                            <div key={i} className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100/50 dark:border-gray-700/50">
                                                <span className="font-semibold text-gray-900 dark:text-white w-10">{slot.day.substring(0, 3)}</span>
                                                <span className="text-gray-500 font-medium">{slot.time}</span>
                                                <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[100px]">{slot.className}</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            </div>

                            {/* Actions Footer */}
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-gray-50 dark:border-gray-800">
                                <Button 
                                    onClick={() => setSelectedInstructorId(instructor.id)}
                                    variant="ghost"
                                    className="h-11 text-[11px] font-semibold uppercase tracking-widest rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    Control Panel
                                </Button>
                                <Button 
                                    variant="ghost"
                                    className="h-11 text-[11px] font-semibold uppercase tracking-widest rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    Feedback
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    )}
</div>
    );
};
