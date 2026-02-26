
import React from 'react';
import { MapPin, Clock, User, CheckCircle2 } from 'lucide-react';
import { DanceClass } from '../../../../types';
import { Button, Modal, Badge } from '../../../../components/UIComponents';
import { normalizeLevel, formatClassTitle, getLevelStyle } from './scheduleHelpers';

interface ScheduleClassModalProps {
    cls: DanceClass | null;
    isOpen: boolean;
    onClose: () => void;
    isEnrolled: boolean;
    isFull: boolean;
    getInstructorAvatar: (i: any) => string;
}

export const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({ 
    cls, isOpen, onClose, isEnrolled, isFull, getInstructorAvatar 
}) => {
    if (!cls) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalii Curs">
            <div className="space-y-6 pb-4">
               <div className="flex flex-col items-center text-center pt-2">
                  <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{formatClassTitle(cls.title)}</h2>
                  <div className="flex gap-2">
                     <Badge color="bg-gray-900 text-white border-none">{cls.style}</Badge>
                     <Badge color={getLevelStyle(normalizeLevel(cls.level))}>{normalizeLevel(cls.level)}</Badge>
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                        <Clock size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Ora</p>
                        <p className="text-sm font-black text-gray-900">{cls.time} ({cls.duration})</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                        <MapPin size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Locație</p>
                        <p className="text-sm font-black text-gray-900">{cls.room}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm overflow-hidden">
                        {cls.instructors?.[0] ? (
                          <img src={getInstructorAvatar(cls.instructors[0])} className="w-full h-full object-cover" alt="Instructor" />
                        ) : (
                          <User size={20} />
                        )}
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Instructori</p>
                        <p className="text-sm font-black text-gray-900">{(cls.instructors || []).map((i: any) => (i.name || '').split(' ')[0]).join(' & ')}</p>
                     </div>
                  </div>
               </div>

               <div className="pt-2">
                  {isEnrolled ? (
                      <div className="w-full py-4 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center justify-center text-green-700">
                          <CheckCircle2 size={32} className="mb-2"/>
                          <span className="font-black text-lg">Ești înscris!</span>
                          <span className="text-xs font-medium opacity-80">Te așteptăm la curs.</span>
                      </div>
                  ) : isFull ? (
                      <div className="w-full">
                          <Button 
                              disabled
                              className="w-full bg-gray-100 text-gray-400 border-none h-14 text-sm font-bold uppercase tracking-wide rounded-xl cursor-not-allowed"
                          >
                              Grupă Full
                          </Button>
                          <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">Listă de așteptare disponibilă la recepție.</p>
                      </div>
                  ) : (
                      <Button 
                          onClick={() => {
                              alert('Te-ai înscris cu succes!');
                              onClose();
                          }}
                          className="w-full bg-gray-900 text-white hover:bg-black h-14 text-sm font-bold uppercase tracking-wide rounded-xl shadow-lg shadow-gray-200"
                      >
                          Înscrie-te la această grupă
                      </Button>
                  )}
               </div>
            </div>
        </Modal>
    );
};
