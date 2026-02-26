
import React from 'react';
import { MapPin, QrCode, DollarSign, Clock, TrendingUp, History, CheckCircle2, Calendar } from 'lucide-react';
import { Card, Badge, Button } from '../../../components/UIComponents';
import { DanceClass, InstructorProfile } from '../../../types';
import { getStyleTheme } from '../../../utils/themeUtils';

interface InstructorScheduleViewProps {
    profile: InstructorProfile;
}

export const InstructorScheduleView: React.FC<InstructorScheduleViewProps> = ({ profile }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-gray-900">Orarul Săptămânal</h3><Badge color="bg-blue-50 text-blue-600">Săptămâna curentă</Badge></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {profile.schedule.map((slot, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all">
                    <div className="flex justify-between items-start mb-4"><span className="text-sm font-black text-gray-900 uppercase bg-gray-100 px-3 py-1 rounded-lg">{slot.day}</span><Badge color="bg-gray-900 text-white border-none">{slot.time}</Badge></div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">{slot.className}</h4>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">{slot.level}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg"><MapPin size={14}/><span>Mille 18, Sala A</span></div>
                </div>
            ))}
            {profile.schedule.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400"><Calendar size={48} className="mx-auto mb-4 opacity-20"/><p>Nu ai clase programate.</p></div>}
        </div>
    </div>
);

interface InstructorCheckInListProps {
    classes: DanceClass[];
    onStartCheckIn: (c: DanceClass) => void;
    onShowQr: (id: string) => void;
}

export const InstructorCheckInList: React.FC<InstructorCheckInListProps> = ({ classes, onStartCheckIn, onShowQr }) => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg"><div className="relative z-10"><h3 className="text-2xl font-black mb-2">Check-in Desk</h3><p className="text-gray-300 max-w-md text-sm">Selectează clasa de astăzi pentru a începe procesul de scanare și prezență.</p></div><QrCode size={120} className="absolute right-6 -bottom-6 opacity-10 rotate-12" /></div>
        <div className="space-y-4">
            <h4 className="font-bold text-gray-900 uppercase text-xs tracking-wider">Clasele de azi ({classes.length})</h4>
            {classes.map(cls => {
                const theme = getStyleTheme(cls.style, cls.level);
                return (
                    <div key={cls.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full">
                            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${theme.softBg} ${theme.softText}`}><span className="text-sm font-black">{cls.time}</span></div>
                            <div><h4 className="font-bold text-lg text-gray-900">{cls.title}</h4><p className="text-xs text-gray-500 flex items-center gap-2"><MapPin size={12}/> {cls.room}</p></div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto"><Button onClick={() => onShowQr(cls.id)} variant="secondary" className="md:w-12 px-0"><QrCode size={18} /></Button><Button onClick={() => onStartCheckIn(cls)} className="whitespace-nowrap px-6">Deschide Prezența</Button></div>
                    </div>
                );
            })}
            {classes.length === 0 && <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200"><p className="text-gray-400 font-medium text-sm">Nicio clasă programată pentru astăzi.</p></div>}
        </div>
    </div>
);

interface InstructorFinanceProps {
    stats: { estimatedPay: number; monthHours: number; hourlyRate: number };
}

export const InstructorFinanceView: React.FC<InstructorFinanceProps> = ({ stats }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4"><div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={20}/></div><span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">Luna Curentă</span></div>
                <p className="text-3xl font-black text-gray-900">{stats.estimatedPay} <span className="text-sm text-gray-400 font-medium">RON</span></p><p className="text-xs text-gray-500 mt-1">Estimat brut</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock size={20}/></div></div>
                <p className="text-3xl font-black text-gray-900">{stats.monthHours}</p><p className="text-xs text-gray-500 mt-1">Ore predate</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={20}/></div></div>
                <p className="text-3xl font-black text-gray-900">{stats.hourlyRate} <span className="text-sm text-gray-400 font-medium">RON</span></p><p className="text-xs text-gray-500 mt-1">Tarif orar</p>
            </div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-gray-900">Istoric Plăți</h3><Button variant="secondary" className="!w-auto h-8 text-xs px-3">Descarcă PDF</Button></div>
            <div className="divide-y divide-gray-50">
                {[{ month: 'Octombrie 2024', hours: 22, amount: 3300, status: 'paid' }, { month: 'Septembrie 2024', hours: 20, amount: 3000, status: 'paid' }].map((item, idx) => (
                    <div key={idx} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><History size={18}/></div><div><p className="font-bold text-gray-900 text-sm">{item.month}</p><p className="text-xs text-gray-500">{item.hours} ore facturate</p></div></div>
                        <div className="text-right"><p className="font-bold text-gray-900">{item.amount} RON</p><span className="text-[10px] font-bold text-green-600 uppercase flex items-center justify-end gap-1"><CheckCircle2 size={10}/> {item.status}</span></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
