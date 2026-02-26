
import { SkillLevel } from '../../../../types';

export const normalizeLevel = (level: SkillLevel): string => {
    if (level === SkillLevel.IMPROVERS) return 'Intermediar';
    return level;
};

export const getCurrentWeekDate = (dayIndex: number): string => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon...
    // Calculate distance to Monday (1)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    
    // Target date based on Monday
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (dayIndex - 1));
    
    return targetDate.toISOString().split('T')[0];
};

export const getWeekRangeString = () => {
    const startStr = getCurrentWeekDate(1); // Monday
    const endStr = getCurrentWeekDate(4);   // Thursday
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    return `${start.toLocaleDateString('ro-RO', options)} – ${end.toLocaleDateString('ro-RO', options)} ${end.getFullYear()}`;
};

export const formatClassTitle = (title: string): string => {
    let cleaned = (title || '').replace(/\(([^)]*?)(Începători|Incepatori|Intermediari|Avansați|Advanced|Beginners|Improvers|Start)([^)]*?)\)/gi, '');

    cleaned = cleaned.replace(/\b(Începători|Începător|Incepatori|Incepator|Intermediari|Intermediar|Avansați|Avansati|Avansat|Improvers|Beginners|Beginner|Advanced|Adv|Inter-Adv|Inter-Advanced|Intermediate|Int|Gen|General|All Levels|Open Level|Start)\b/gi, '');
    
    cleaned = cleaned.replace(/(?<![a-zA-Z])\b[1-4]\b/g, '');

    return cleaned.replace(/\s+/g, ' ').replace(/\s-\s?$/, '').trim();
};

export const getLevelStyle = (levelName: string) => {
    const l = (levelName || '').toLowerCase();
    if (l.includes('start')) {
        return 'bg-[#F3F4F6] border-[#E5E7EB] text-[#374151] shadow-sm';
    }
    if (l.includes('începător') || l.includes('incepator') || l.includes('beginner')) {
        return 'bg-brand-green border-brand-green text-white shadow-sm';
    }
    if (l.includes('intermediar') || l.includes('improvers')) {
        return 'bg-brand-yellow border-brand-yellow text-gray-900 shadow-sm';
    }
    if (l.includes('avansat') || l.includes('advanced')) {
        return 'bg-ginga-600 border-ginga-600 text-white shadow-sm';
    }
    return 'bg-slate-800 border-slate-700 text-white shadow-sm';
};
