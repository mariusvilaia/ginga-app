
import { DanceStyle, SkillLevel } from '../../types';

export const getStyleTheme = (style: DanceStyle, level: SkillLevel) => {
  // 1. Specific Styles (Overrides Level Colors)
  if (style === DanceStyle.TRUPE) {
    return { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-900', ring: 'ring-gray-900', softBg: 'bg-gray-100 dark:bg-gray-800', softText: 'text-gray-900 dark:text-white' };
  }
  if (style === DanceStyle.LADY_STYLING) {
    return { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-200', ring: 'ring-pink-500', softBg: 'bg-pink-50 dark:bg-pink-900/20', softText: 'text-pink-600 dark:text-pink-400' };
  }
  if (style === DanceStyle.MEN_STYLING) {
    return { bg: 'bg-sky-400', text: 'text-white', border: 'border-sky-200', ring: 'ring-sky-400', softBg: 'bg-sky-50 dark:bg-sky-900/20', softText: 'text-sky-600 dark:text-sky-400' };
  }

  // 2. Levels (Salsa, Bachata, Kizomba)
  switch (level) {
    case SkillLevel.BEGINNER: 
      return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-200', ring: 'ring-green-500', softBg: 'bg-green-50 dark:bg-green-900/20', softText: 'text-green-600 dark:text-green-400' };
    case SkillLevel.IMPROVERS: 
      return { bg: 'bg-lime-500', text: 'text-white', border: 'border-lime-200', ring: 'ring-lime-500', softBg: 'bg-lime-50 dark:bg-lime-900/20', softText: 'text-lime-700 dark:text-lime-400' };
    case SkillLevel.INTERMEDIATE: 
      return { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-200', ring: 'ring-yellow-400', softBg: 'bg-yellow-50 dark:bg-yellow-900/20', softText: 'text-yellow-800 dark:text-yellow-400' };
    case SkillLevel.ADVANCED: 
      return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-200', ring: 'ring-red-600', softBg: 'bg-red-50 dark:bg-red-900/20', softText: 'text-red-600 dark:text-red-400' };
    default: 
      return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-200', ring: 'ring-gray-300', softBg: 'bg-gray-100 dark:bg-gray-800', softText: 'text-gray-600 dark:text-gray-400' };
  }
};

export const getSubscriptionColor = (type: string) => {
  if (type.includes('Bronze')) return 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/20';
  if (type.includes('Silver')) return 'bg-slate-200 text-slate-700 border-slate-300';
  if (type.includes('Gold')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (type.includes('Platinum')) return 'bg-slate-800 text-white border-slate-700';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};
