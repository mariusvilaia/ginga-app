
import { DanceStyle, SkillLevel } from '../types';

export const getStyleTheme = (style: DanceStyle, level: SkillLevel) => {
  // 1. Specific Styles (Overrides Level Colors for Special Classes)
  if (style === DanceStyle.TRUPE) {
    return { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-900', ring: 'ring-gray-900', softBg: 'bg-gray-100 dark:bg-gray-800', softText: 'text-gray-900 dark:text-white' };
  }
  if (style === DanceStyle.LADY_STYLING) {
    return { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-500', ring: 'ring-pink-500', softBg: 'bg-pink-50 dark:bg-pink-900/20', softText: 'text-pink-600 dark:text-pink-400' };
  }
  
  // 2. Levels (Ginga Color Coding Scheme)
  const l = (level || '').toLowerCase();

  // START / ABSOLUTE BEGINNER -> Off-White / Neutral Gray
  if (level === SkillLevel.START || l.includes('start')) {
      return { 
        bg: 'bg-[#F3F4F6]', // Gray 100
        text: 'text-[#374151]', // Gray 700
        border: 'border-[#E5E7EB]', // Gray 200
        ring: 'ring-[#D1D5DB]', 
        softBg: 'bg-[#F9FAFB] dark:bg-gray-800', 
        softText: 'text-[#4B5563] dark:text-gray-300' 
      };
  }

  // BEGINNER (Începători) -> Ginga Green
  if (level === SkillLevel.BEGINNER || l.includes('începător') || l.includes('incepator') || l.includes('beginner')) {
      return { 
        bg: 'bg-[#34A853]', 
        text: 'text-white', 
        border: 'border-[#34A853]', 
        ring: 'ring-[#34A853]', 
        softBg: 'bg-[#34A853]/10 dark:bg-[#34A853]/20', 
        softText: 'text-[#166534] dark:text-[#34A853]' // Darker green for text
      };
  }

  // INTERMEDIATE (Intermediari & Improvers) -> Ginga Yellow
  if (level === SkillLevel.INTERMEDIATE || level === SkillLevel.IMPROVERS || l.includes('intermediar') || l.includes('improvers')) {
      return { 
        bg: 'bg-[#F4B400]', 
        text: 'text-black', 
        border: 'border-[#F4B400]', 
        ring: 'ring-[#F4B400]', 
        softBg: 'bg-[#F4B400]/10 dark:bg-[#F4B400]/20', 
        softText: 'text-[#B45309] dark:text-[#FCD34D]' // Dark amber for text readability
      };
  }

  // ADVANCED (Avansați) -> Ginga Red
  if (level === SkillLevel.ADVANCED || l.includes('avansat') || l.includes('advanced')) {
      return { 
        bg: 'bg-[#E53935]', 
        text: 'text-white', 
        border: 'border-[#E53935]', 
        ring: 'ring-[#E53935]', 
        softBg: 'bg-[#E53935]/10 dark:bg-[#E53935]/20', 
        softText: 'text-[#991B1B] dark:text-[#E53935]' // Dark red for text
      };
  }

  // Default Fallback
  return { 
    bg: 'bg-gray-500', 
    text: 'text-white', 
    border: 'border-gray-500', 
    ring: 'ring-gray-300', 
    softBg: 'bg-gray-100 dark:bg-gray-800', 
    softText: 'text-gray-600 dark:text-gray-400' 
  };
};

export const getSubscriptionColor = (type: string) => {
  const t = (type || '').trim();
  if (t.includes('Bronze')) return 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/20';
  if (t.includes('Silver')) return 'bg-slate-200 text-slate-700 border-slate-300';
  if (t.includes('Gold')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (t.includes('Platinum')) return 'bg-slate-800 text-white border-slate-700';
  if (t.includes('Staff')) return 'bg-gray-900 text-white border-gray-700';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

export const getLevelBadgeColor = (levelOrName: string) => {
  // Consolidating to "Walk-in" style: Border + Soft BG + Dark Text
  if (!levelOrName) return 'bg-gray-50 text-gray-600 border-gray-200 border';
  const l = levelOrName.toLowerCase();

  // 1. Start -> Off-White / Neutral Gray
  if (levelOrName === SkillLevel.START || l.includes('start')) {
      return 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] border dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
  
  // 2. Începători -> Green (Soft)
  if (l.includes('începător') || l.includes('incepator') || l.includes('beginner')) {
      return 'bg-[#34A853]/10 text-[#166534] border-[#34A853]/20 border';
  }
  
  // 3. Intermediari/Improvers -> Yellow (Soft)
  if (l.includes('intermediar') || l.includes('intermediate') || l.includes('improvers')) {
      return 'bg-[#F4B400]/10 text-[#B45309] border-[#F4B400]/20 border dark:text-[#FCD34D]';
  }
  
  // 4. Avansați -> Red (Soft)
  if (l.includes('avansat') || l.includes('advanced')) {
      return 'bg-[#E53935]/10 text-[#991B1B] border-[#E53935]/20 border';
  }
  
  // Fallback
  return 'bg-gray-50 text-gray-600 border-gray-200 border dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
};

export const getAttendanceStyle = (status: string, isFuture: boolean = false) => {
  if (isFuture) {
    switch (status) {
      case 'titular': return 'bg-transparent border-2 border-green-500';
      case 'substitute': return 'bg-transparent border-2 border-amber-400'; 
      case 'absent': return 'bg-transparent border-2 border-red-500'; 
      case 'cancelled': return 'bg-transparent border-2 border-gray-400 border-dashed';
      default: return 'bg-transparent border-2 border-gray-300'; 
    }
  }
  switch (status) {
    case 'titular': return 'bg-green-500 border border-green-600';
    case 'substitute': return 'bg-amber-400 border border-amber-500'; 
    case 'absent': return 'bg-red-500 border border-red-600';
    case 'cancelled': return 'bg-gray-100 border border-gray-400 border-dashed';
    case 'unset': return 'bg-white border border-gray-300';
    default: return 'bg-transparent';
  }
};

export const getGroupHeaderColor = (style: DanceStyle | string) => {
    switch (style) {
        case DanceStyle.SALSA: return 'bg-[#FFD700]'; // Gold/Yellow
        case DanceStyle.BACHATA: return 'bg-[#E53935]'; // Red
        case DanceStyle.KIZOMBA: return 'bg-purple-600'; // Purple
        case DanceStyle.LADY_STYLING: return 'bg-pink-500';
        case DanceStyle.MEN_STYLING: return 'bg-sky-500';
        default: return 'bg-gray-800'; // Default Neutral
    }
};

export const getGroupIconClass = (level: string) => {
  return getLevelBadgeColor(level);
};
