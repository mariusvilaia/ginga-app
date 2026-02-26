
import React from 'react';
import { MapPin } from 'lucide-react';
import { DanceClass } from '../../../../types';
import { normalizeLevel, formatClassTitle, getLevelStyle } from './scheduleHelpers';

interface ScheduleClassCardProps {
    cls: DanceClass;
    isEnrolled: boolean;
    isFull: boolean;
    onClick: (cls: DanceClass) => void;
    getInstructorAvatar: (i: any) => string;
}

export const ScheduleClassCard: React.FC<ScheduleClassCardProps> = ({ 
    cls, isEnrolled, isFull, onClick, getInstructorAvatar 
}) => {
    const normalizedLevel = normalizeLevel(cls.level);
    const levelStyle = getLevelStyle(normalizedLevel);
    const isMille = cls.room.includes('Mille');
    const locColor = isMille 
        ? 'bg-gray-100 text-gray-500 border-gray-200' 
        : 'bg-purple-50 text-purple-600 border-purple-100';

    return (
        <div 
            onClick={() => !isFull && onClick(cls)}
            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden group
                ${isEnrolled 
                  ? 'bg-white border-brand-green shadow-md cursor-pointer hover:scale-[1.02] ring-1 ring-brand-green/20' 
                  : isFull 
                      ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed grayscale'
                      : 'bg-white border-gray-100 text-gray-900 hover:shadow-md cursor-pointer hover:border-gray-200 hover:scale-[1.01]'
                }
            `}
        >
            {/* STATUS BADGES (Absolute) */}
            {isEnrolled && (
                <div className="absolute top-0 right-0 bg-brand-green text-white text-[9px] font-bold px-2 py-1 rounded-bl-xl z-10 uppercase tracking-wider">
                    Înscris
                </div>
            )}
            {isFull && (
                <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-bl-xl z-10 uppercase tracking-wider">
                    Full
                </div>
            )}

            {/* 1. TIME & LOCATION */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black tracking-tight text-gray-900">
                    {cls.time}
                </span>
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${locColor}`}>
                    <MapPin size={10} /> 
                    {isMille ? 'Mille 18' : 'Victoriei'}
                </div>
            </div>

            {/* 2. TITLE */}
            <h4 className="font-black text-base leading-tight line-clamp-2 text-gray-900 mb-2">
                {formatClassTitle(cls.title)}
            </h4>

            {/* 3. FOOTER (Level & Instructors - STACKED LAYOUT) */}
            <div className="mt-auto pt-3 flex flex-col gap-3 border-t border-gray-50/50">
                {/* Row 1: Level Badge */}
                <div className="flex justify-start">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm ${levelStyle}`}>
                        {normalizedLevel}
                    </span>
                </div>
                
                {/* Row 2: Instructors - Bigger Avatars & Names */}
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-4">
                        {(cls.instructors || []).slice(0,2).map((i, idx) => (
                            <img 
                              key={idx} 
                              src={getInstructorAvatar(i)} 
                              className="w-12 h-12 rounded-full border-2 object-cover border-white bg-gray-100 shadow-sm" 
                              alt={i.name}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Instructori</span>
                        <span className="text-sm font-black text-gray-900 leading-none">
                            {(cls.instructors || []).map((i: any) => (i.name || '').split(' ')[0]).join(' & ')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
