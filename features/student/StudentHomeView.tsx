
import React, { useState } from 'react';
import { QrCode, AlertTriangle, Clock, MapPin, Flame, Zap, Trophy } from 'lucide-react';
import { Button, Badge } from '../../components/UIComponents';
import { StudentProgressChart } from './StudentProgressChart';
import { AiCoachWidget } from './components/AiCoachWidget';
import { UserProfile, DanceClass } from '../../types';

interface StudentHomeViewProps {
    user: UserProfile;
    upcomingClass: DanceClass;
    alerts: { type: string; text: string }[];
    setActiveTab: (t: any) => void;
    onShowQr: () => void;
    getInstructorAvatar: (i: any) => string;
}

export const StudentHomeView: React.FC<StudentHomeViewProps> = ({ 
    user, upcomingClass, alerts, setActiveTab, onShowQr, getInstructorAvatar 
}) => {
    const [chartMetric, setChartMetric] = useState<'hours' | 'classes'>('hours');
    
    // Mock Chart Data - could be passed as prop if dynamic
    const CHART_DATA = {
        hours: [
            { label: 'Aug', value: 8 }, { label: 'Sep', value: 12 }, { label: 'Oct', value: 10 },
            { label: 'Nov', value: 18 }, { label: 'Dec', value: 24 }, { label: 'Ian', value: user.stats.hoursDanced || 14 }
        ],
        classes: [
            { label: 'Aug', value: 6 }, { label: 'Sep', value: 8 }, { label: 'Oct', value: 8 },
            { label: 'Nov', value: 12 }, { label: 'Dec', value: 16 }, { label: 'Ian', value: user.stats.totalClasses || 10 }
        ]
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Bine ai revenit,</p>
                      <h2 className="text-3xl font-black text-gray-900">{(user.name || '').split(' ')[0]} 👋</h2>
                  </div>
                  <div className="hidden md:block">
                      <Button onClick={onShowQr} className="!w-auto px-6 gap-2 bg-gray-900 hover:bg-black text-white">
                          <QrCode size={18}/> Check-in Rapid
                      </Button>
                  </div>
              </div>
              
              {alerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl flex items-center gap-3 ${alert.type === 'critical' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                      <AlertTriangle size={20} />
                      <span className="text-sm font-bold">{alert.text}</span>
                      <button className="ml-auto text-xs font-bold underline" onClick={() => setActiveTab('membership')}>Vezi Detalii</button>
                  </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN (Main) */}
              <div className="lg:col-span-2 space-y-8">
                  {/* Hero Class Card */}
                  <div className="relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-lg group cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setActiveTab('schedule')}>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      <div className="p-8 relative z-10">
                          <div className="flex justify-between items-start mb-6">
                              <Badge color="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1"><Clock size={12}/> URMEAZĂ</Badge>
                              <span className="text-sm font-bold text-gray-400">{new Date(upcomingClass.date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                          </div>
                          <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">{upcomingClass.title}</h3>
                          <div className="flex items-center gap-2 text-gray-500 font-medium mb-8">
                              <MapPin size={18} className="text-gray-400"/> 
                              <span>{upcomingClass.room}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span>{upcomingClass.time}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="flex -space-x-4">
                                      {upcomingClass.instructors.map((i: any, idx: number) => (
                                          <img key={idx} src={getInstructorAvatar(i)} className="w-14 h-14 rounded-full border-2 border-white bg-gray-100 shadow-sm object-cover" />
                                      ))}
                                  </div>
                                  <div className="text-xs">
                                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Instructori</p>
                                      <p className="text-sm font-black text-gray-900">{upcomingClass.instructors.map((i: any) => (i.name || '').split(' ')[0]).join(' & ')}</p>
                                  </div>
                              </div>
                              <div className="flex gap-3">
                                  <Button variant="secondary" className="!w-auto px-4 h-10 text-xs hidden sm:flex">Detalii</Button>
                                  <Button onClick={(e) => { e.stopPropagation(); onShowQr(); }} className="!w-auto px-6 h-10 text-xs bg-gray-900 text-white hover:bg-black gap-2 shadow-lg shadow-gray-200">
                                      <QrCode size={16}/> Check-in
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* AI Coach Widget Integration */}
                  <AiCoachWidget user={user} />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Flame size={20}/></div>
                          <div><p className="text-xl font-black text-gray-900">{user.stats.streakWeeks}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Streak Săpt.</p></div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Zap size={20}/></div>
                          <div><p className="text-xl font-black text-gray-900">{user.stats.hoursDanced}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Ore Dansate</p></div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center"><Trophy size={20}/></div>
                          <div className="w-full">
                              {user.enrollments && user.enrollments.length > 0 ? (
                                  <div className="flex flex-col gap-1 items-center">
                                      {user.enrollments.slice(0, 2).map((enr, idx) => (
                                          <div key={idx} className="flex items-center gap-1 justify-center">
                                              <span className="text-[10px] font-bold text-gray-400 uppercase">{(enr.style || '').substring(0,3)}:</span>
                                              <span className="text-xs font-black text-gray-900 truncate max-w-[60px]" title={enr.level}>{enr.level}</span>
                                          </div>
                                      ))}
                                      {user.enrollments.length > 2 && <span className="text-[9px] text-gray-400">+{user.enrollments.length - 2} altele</span>}
                                  </div>
                              ) : (
                                  <><p className="text-xl font-black text-gray-900">Nou</p><p className="text-[10px] font-bold text-gray-400 uppercase">Nivel Curent</p></>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Chart */}
                  <StudentProgressChart 
                      title="Activitatea Ta"
                      data={chartMetric === 'hours' ? CHART_DATA.hours : CHART_DATA.classes}
                      activeMetric={chartMetric}
                      onMetricChange={(m) => setChartMetric(m)}
                  />
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-8">
                  {/* Subscription Widget handled in parent or simply linked here */}
              </div>
          </div>
      </div>
    );
};
