
import React, { useState } from 'react';
import { MonthOverview } from './MonthOverview';
import { WeekOverview } from './WeekOverview';
import { InstructorDetail } from './InstructorDetail';
import { StatusModal } from './StatusModal';
import { AddUnavailabilityModal } from './AddUnavailabilityModal';
import { InstructorAttendanceRecord, InstructorUnavailability } from '../../types';
import { Button } from '../../components/UIComponents';
import { CalendarX, Calendar, LayoutGrid, Rows } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export const InstructorAttendanceView: React.FC = () => {
    const { instructorAttendance, unavailabilities, saveInstructorAttendanceBatch, addInstructorUnavailability } = useData();
    const [view, setView] = useState<'overview' | 'detail'>('overview');
    const [timeFrame, setTimeFrame] = useState<'month' | 'week'>('month'); 
    
    const [currentDate, setCurrentDate] = useState<Date>(new Date()); 
    const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
    
    // Modal State
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isUnavailabilityModalOpen, setIsUnavailabilityModalOpen] = useState(false);

    const [editingRecords, setEditingRecords] = useState<InstructorAttendanceRecord[]>([]);
    const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');

    const handlePrev = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (timeFrame === 'month') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setDate(prev.getDate() - 7);
            }
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (timeFrame === 'month') {
                newDate.setMonth(prev.getMonth() + 1);
            } else {
                newDate.setDate(prev.getDate() + 7);
            }
            return newDate;
        });
    };

    const jumpToToday = () => {
        setCurrentDate(new Date());
    }

    const handleDayClick = (records: InstructorAttendanceRecord[], dateLabel: string) => {
        setEditingRecords(records);
        setSelectedDateLabel(dateLabel);
        setIsStatusModalOpen(true);
    };

    const handleSingleRecordClick = (rec: InstructorAttendanceRecord) => {
        setEditingRecords([rec]);
        setSelectedDateLabel(rec.date);
        setIsStatusModalOpen(true);
    }

    const handleInstructorClick = (id: string) => {
        setSelectedInstructorId(id);
        setView('detail');
    };

    const handleSaveRecords = async (updatedRecs: InstructorAttendanceRecord[]) => {
        await saveInstructorAttendanceBatch(updatedRecs);
    };

    const handleSaveUnavailability = async (data: Omit<InstructorUnavailability, 'id'>) => {
        await addInstructorUnavailability(data);
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            {view === 'overview' && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
                        <button 
                            onClick={() => setTimeFrame('month')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                timeFrame === 'month' 
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <LayoutGrid size={14} /> Luna
                        </button>
                        <button 
                            onClick={() => setTimeFrame('week')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                timeFrame === 'week' 
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Rows size={14} /> Săptămâna
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="secondary" className="!w-auto h-9 text-xs gap-2" onClick={jumpToToday}>
                            <Calendar size={14}/> Azi
                        </Button>
                        <Button variant="secondary" className="!w-auto h-9 text-xs gap-2" onClick={() => setIsUnavailabilityModalOpen(true)}>
                            <CalendarX size={14}/> Anunță Indisponibilitate
                        </Button>
                    </div>
                </div>
            )}

            {view === 'overview' ? (
                timeFrame === 'month' ? (
                    <MonthOverview 
                        currentDate={currentDate}
                        onPrevMonth={handlePrev}
                        onNextMonth={handleNext}
                        onDayClick={handleDayClick}
                        onInstructorClick={handleInstructorClick}
                    />
                ) : (
                    <WeekOverview 
                        currentDate={currentDate}
                        onPrevWeek={handlePrev}
                        onNextWeek={handleNext}
                        onDayClick={handleDayClick}
                        onInstructorClick={handleInstructorClick}
                    />
                )
            ) : (
                <InstructorDetail 
                    instructorId={selectedInstructorId!}
                    onBack={() => setView('overview')}
                    onRecordClick={handleSingleRecordClick}
                />
            )}

            <StatusModal 
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                records={editingRecords}
                dateLabel={selectedDateLabel}
                onSave={handleSaveRecords}
            />

            <AddUnavailabilityModal 
                isOpen={isUnavailabilityModalOpen}
                onClose={() => setIsUnavailabilityModalOpen(false)}
                onSave={handleSaveUnavailability}
            />
        </div>
    );
};
