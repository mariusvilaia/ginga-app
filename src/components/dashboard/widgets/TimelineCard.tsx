
import React from 'react';

interface TimelineCardProps {
  time: string;
  title: string;
  instructor: string;
  room: string;
  status?: 'live' | 'upcoming' | 'finished';
  attendees: number;
  unpaid: number;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ 
  time, 
  title, 
  instructor, 
  room, 
  status='upcoming', 
  attendees, 
  unpaid 
}) => (
  <div className="flex gap-4 relative pl-4 pb-8 border-l-2 border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
     <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${status === 'live' ? 'bg-green-500 animate-pulse' : status === 'finished' ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500'}`}></div>
     <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{time}</p>
        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm min-w-[200px] hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start mb-2">
             <h4 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h4>
             {status === 'live' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{instructor} • {room}</p>
           <div className="flex justify-between items-center text-xs border-t border-gray-50 dark:border-gray-800 pt-2">
              <span className="font-bold text-gray-700 dark:text-gray-300">{attendees} Prezenți</span>
              {unpaid > 0 ? <span className="text-red-500 font-bold">{unpaid} Neplătiți</span> : <span className="text-green-600 font-bold">OK</span>}
           </div>
        </div>
     </div>
  </div>
);
