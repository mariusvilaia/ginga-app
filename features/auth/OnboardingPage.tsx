
import React, { useState } from 'react';
import { User, Users, Check, ArrowRight, Info, FastForward, ChevronLeft, Star, Activity, BarChart, Sparkles, CheckCircle2 } from 'lucide-react';
import { GingaLogo } from '../../components/shared/GingaLogo';
import { AuthButton, AuthInput, AuthAlert } from './AuthComponents';

interface OnboardingPageProps {
  onComplete: (profileData: any) => void;
  initialData?: { 
    name?: string; 
    dob?: string; 
    gender?: string; 
    styles?: string[];
    email?: string;
  };
}

const DANCE_STYLES = ['Salsa', 'Bachata', 'Kizomba', 'Lady Styling'];
const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Feminin' },
  { value: 'O', label: 'Altul' }
];

// Simplified labels for the pills to fit nicely
const EXPERIENCE_LEVELS = [
  { id: '0-3m', short: '0-3 luni', label: 'Începător (0-3 luni)' },
  { id: '3-6m', short: '3-6 luni', label: 'Inițiat (3-6 luni)' },
  { id: '6-12m', short: '6-12 luni', label: 'Intermediar (< 1 an)' },
  { id: '1y+', short: '1+ ani', label: 'Avansat (1+ ani)' },
  { id: '2y+', short: '2+ ani', label: 'Veterano (2+ ani)' },
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete, initialData }) => {
  const initialParts = initialData?.name?.split(' ') || ['', ''];
  
  const [step, setStep] = useState(1); // 1: Identity, 2: Styles, 3: Unified Experience
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: initialParts[0] || '',
    lastName: initialParts.slice(1).join(' ') || '',
    dob: initialData?.dob || '',
    gender: initialData?.gender || '',
    styles: initialData?.styles || [] as string[],
    experience: {} as Record<string, string>, // Map style -> level
  });

  // Validation Logic
  const isStep1Valid = formData.firstName.trim().length >= 2 && formData.lastName.trim().length >= 2 && formData.dob !== '' && formData.gender !== '';
  const isStep2Valid = formData.styles.length > 0;
  
  // Step 3 is valid if ALL selected styles have an experience level assigned
  const isStep3Valid = formData.styles.every(style => !!formData.experience[style]);

  const isCurrentStepValid = () => {
    if (step === 1) return isStep1Valid;
    if (step === 2) return isStep2Valid;
    if (step === 3) return isStep3Valid;
    return false;
  };

  const toggleStyle = (style: string) => {
    setFormData(prev => {
      const newStyles = prev.styles.includes(style) 
        ? prev.styles.filter(s => s !== style) 
        : [...prev.styles, style];
      
      // Cleanup experience if style is removed
      const newExperience = { ...prev.experience };
      if (!newStyles.includes(style)) {
        delete newExperience[style];
      }

      return { ...prev, styles: newStyles, experience: newExperience };
    });
  };

  const setExperience = (style: string, levelId: string) => {
      setFormData(prev => ({
          ...prev,
          experience: {
              ...prev.experience,
              [style]: levelId
          }
      }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = () => {
    onComplete({
      firstName: 'Demo',
      lastName: 'User',
      dob: '1995-01-01',
      gender: 'O',
      styles: ['Bachata'],
      experience: { 'Bachata': '0-3m' },
      name: 'Demo User',
      role: 'Ambele'
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setSaveError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const implicitRole = formData.gender === 'M' ? 'Leader' : formData.gender === 'F' ? 'Follower' : 'Ambele';

      onComplete({
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        role: implicitRole,
        level: formData.experience[formData.styles[0]] // Fallback main level
      });
    } catch (err: any) {
      setSaveError(err.message || "A apărut o eroare.");
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Hai să ne cunoaștem";
      case 2: return "Ce te pasionează?";
      case 3: return "Nivelul tău";
      default: return "";
    }
  };

  const getStepDescription = () => {
    switch(step) {
      case 1: return "Câteva detalii pentru a-ți crea profilul.";
      case 2: return "Selectează stilurile care te atrag.";
      case 3: return "Selectează rapid experiența pentru fiecare stil ales.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F9FC] flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="mb-6 transition-transform hover:scale-105 duration-300">
        <GingaLogo size="sm" />
      </div>

      <div className="w-full max-w-[600px] bg-white rounded-[24px] border border-[#E6EBF1] shadow-[0_50px_100px_rgba(50,50,93,0.1),0_15px_35px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col transition-all duration-300">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100">
          <div 
            className="h-full bg-[#E53935] transition-all duration-500 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-10 relative">
          
          {/* Header Area */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-2">
              {step > 1 ? (
                <button onClick={handleBack} className="p-1 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <ChevronLeft size={24} />
                </button>
              ) : (
                <div /> // Spacer
              )}
              <button onClick={handleSkip} className="p-1 text-gray-300 hover:text-gray-500 transition-colors" title="Demo Skip">
                <FastForward size={20} />
              </button>
            </div>
            
            <h1 className="text-2xl md:text-[28px] font-bold text-[#1A1F36] leading-tight mb-2 transition-all">
              {getStepTitle()}
            </h1>
            <p className="text-[#4F566B] text-[15px] md:text-[16px] leading-relaxed transition-all">
              {getStepDescription()}
            </p>
          </div>

          {saveError && <AuthAlert message={saveError} />}

          <div className="min-h-[300px]">
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AuthInput 
                    label="Prenume" 
                    placeholder="Ex: Andrei"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <AuthInput 
                    label="Nume" 
                    placeholder="Ex: Popescu"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Data Nașterii</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E6EBF1] bg-[#F7FAFC] transition-all outline-none font-medium focus:border-[#1A1F36] focus:bg-white text-[#1A1F36]"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Gen</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#E6EBF1] bg-[#F7FAFC] transition-all outline-none font-medium focus:border-[#1A1F36] focus:bg-white appearance-none cursor-pointer text-[#1A1F36]"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="" disabled>Selectează...</option>
                      {GENDER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: STYLES */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                {DANCE_STYLES.map(style => {
                  const isActive = formData.styles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                        ${isActive 
                          ? 'border-[#E53935] bg-red-50/30' 
                          : 'border-[#E6EBF1] bg-white hover:border-[#CAD1D9] hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-[#E53935] text-white' : 'bg-gray-100 text-gray-400'}`}>
                           <Star size={18} fill={isActive ? "currentColor" : "none"} />
                        </div>
                        <span className={`text-lg font-bold ${isActive ? 'text-[#E53935]' : 'text-[#4F566B]'}`}>{style}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'border-[#E53935] bg-[#E53935]' : 'border-gray-300'}`}>
                          {isActive && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 3: UNIFIED EXPERIENCE (NEW UX) */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                 {formData.styles.map((style) => {
                   const selectedLevel = formData.experience[style];
                   const isCompleted = !!selectedLevel;

                   return (
                     <div key={style} className={`p-5 rounded-2xl border-2 transition-all ${isCompleted ? 'border-[#E53935]/20 bg-red-50/10' : 'border-gray-100 bg-white'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
                                {style.charAt(0)}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{style}</h3>
                            {isCompleted && <CheckCircle2 size={18} className="text-[#34A853] ml-auto" />}
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                            {EXPERIENCE_LEVELS.map(level => {
                                const isSelected = selectedLevel === level.id;
                                return (
                                    <button
                                        key={level.id}
                                        onClick={() => setExperience(style, level.id)}
                                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold whitespace-nowrap
                                            ${isSelected 
                                                ? 'bg-[#E53935] text-white border-[#E53935] shadow-md shadow-red-200' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                                            }
                                        `}
                                    >
                                        {level.short}
                                    </button>
                                )
                            })}
                        </div>
                     </div>
                   )
                 })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-[#E6EBF1] flex items-center justify-between">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                Pasul {step} din 3
             </div>
             
             <AuthButton 
                onClick={handleNext}
                isLoading={isLoading} 
                disabled={!isCurrentStepValid() || isLoading}
                className={`!w-auto px-8 transition-all active:scale-[0.98] ${!isCurrentStepValid() ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-0.5'}`}
              >
                <span>{step === 3 ? 'Finalizează' : 'Continuă'}</span>
                <ArrowRight size={20} className={`${isLoading ? 'hidden' : 'inline'}`} />
              </AuthButton>
          </div>

        </div>
      </div>
    </div>
  );
};
