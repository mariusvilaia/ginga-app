
import React, { useState, useMemo, useEffect, useRef } from 'react';
/* Added missing RefreshCw icon import */
import { ArrowLeft, Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Info, Save, ChevronLeft, ChevronRight, Camera, X, Check, RefreshCw } from 'lucide-react';
import { DanceClass, UserProfile, StudentDetailedProfile } from '../../types';
import { Button, Card, Badge } from '../../components/UIComponents';
import { useData } from '../../contexts/DataContext';
// @ts-ignore
import jsQR from 'jsqr';

interface InstructorCheckInPageProps {
  danceClass: DanceClass;
  onBack: () => void;
}

interface CheckInState {
  [studentId: string]: 'present' | 'absent' | 'none';
}

export const InstructorCheckInPage: React.FC<InstructorCheckInPageProps> = ({ danceClass, onBack }) => {
  const { students, groups, updateStudent, performQrCheckIn } = useData(); 
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkInData, setCheckInData] = useState<CheckInState>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const [isProcessingQr, setIsProcessingQr] = useState(false);
  const isProcessingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scannerInterval = useRef<number | null>(null);

  // 1. Identify the Group
  const targetGroup = useMemo(() => {
      return groups.find(g => 
          g.id === danceClass.id || 
          g.name === danceClass.title || 
          (g.style === danceClass.style && g.level === danceClass.level && g.schedule.time === danceClass.time)
      );
  }, [groups, danceClass]);

  // 2. Filter Students
  const enrolledStudents = useMemo(() => {
    return students.filter(s => {
      const isEnrolled = targetGroup 
          ? s.enrollments.some(e => e.groupId === targetGroup.id)
          : s.enrollments.some(e => e.style === danceClass.style && e.level === danceClass.level);

      const hasRecord = s.attendanceHistory?.some(r => 
          r.date === selectedDate && 
          (r.className === danceClass.title || (targetGroup && r.className === targetGroup.name))
      );

      return isEnrolled || hasRecord;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [danceClass, students, targetGroup, selectedDate]);

  // 3. Sync State
  useEffect(() => {
      const dbState: CheckInState = {};
      enrolledStudents.forEach(s => {
          const record = s.attendanceHistory?.find(r => 
              r.date === selectedDate && 
              (r.className === danceClass.title || (targetGroup && r.className === targetGroup.name))
          );
          dbState[s.id] = record ? (record.status as any) : 'none';
      });
      setCheckInData(dbState);
  }, [selectedDate, enrolledStudents, danceClass.title, targetGroup]);

  // --- QR SCANNER LOGIC ---
  const startScanner = async () => {
    setIsScannerOpen(true);
    setLastScannedResult(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play();
            // Start detection loop
            scannerInterval.current = window.setInterval(detectQr, 300);
        }
    } catch (err) {
        alert("Nu s-a putut accesa camera.");
        setIsScannerOpen(false);
    }
  };

  const stopScanner = () => {
      if (scannerInterval.current) clearInterval(scannerInterval.current);
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
      }
      setIsScannerOpen(false);
  };

  const detectQr = () => {
      if (isProcessingRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
              if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
              }
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              try {
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                      inversionAttempts: "dontInvert",
                  });
                  if (code && code.data) {
                      handleManualCode(code.data);
                  }
              } catch (qrErr) {}
          }
      }
  };

  const handleManualCode = async (id: string) => {
      if (isProcessingRef.current) return;
      setIsProcessingQr(true);
      isProcessingRef.current = true;
      
      const result = await performQrCheckIn(id, danceClass.id);
      setLastScannedResult(result);
      setIsProcessingQr(false);
      
      if (result.success) {
          // Play success sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          audio.play().catch(() => {});
      } else {
          // Play error sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
          audio.play().catch(() => {});
      }
      
      setTimeout(() => {
          isProcessingRef.current = false;
      }, 3000);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const handleToggle = (studentId: string, status: 'present' | 'absent') => {
    if (!isToday) return;
    setCheckInData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? 'none' : status
    }));
  };

  const getSubStatus = (student: StudentDetailedProfile) => {
    if (!student.subscription.active) return { label: 'Expirat', color: 'bg-red-50 text-red-600 border-red-100', selectable: false };
    if (student.subscription.sessionsLeft <= 1) return { label: 'Grație', color: 'bg-yellow-50 text-yellow-600 border-yellow-100', selectable: true };
    return { label: 'Activ', color: 'bg-green-50 text-green-600 border-green-100', selectable: true };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const promises = Object.entries(checkInData).map(async ([studentId, status]) => {
            const student = students.find(s => s.id === studentId);
            if (!student) return;

            let newHistory = [...(student.attendanceHistory || [])];
            const classNameToStore = targetGroup ? targetGroup.name : danceClass.title;

            const hadRecord = newHistory.some(r => 
                r.date === selectedDate && 
                (r.className === danceClass.title || (targetGroup && r.className === targetGroup.name))
            );
            
            if (hadRecord) {
                newHistory = newHistory.filter(r => !(
                    r.date === selectedDate && 
                    (r.className === danceClass.title || (targetGroup && r.className === targetGroup.name))
                ));
            }

            if (status !== 'none') {
                newHistory.push({ date: selectedDate, className: classNameToStore, status: status });
            }

            newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const newTotalClasses = newHistory.filter(r => r.status === 'present').length;

            await updateStudent(studentId, {
                attendanceHistory: newHistory,
                stats: { ...student.stats, totalClasses: newTotalClasses }
            });
        });

        await Promise.all(promises);
        alert('Prezența a fost salvată!');
        onBack();
    } catch (error) {
        alert("Eroare la salvare.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDateChange = (offset: number) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + offset);
      setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 font-sans antialiased">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-20 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900 truncate leading-tight">{danceClass.title}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={10} /> {danceClass.time}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin size={10} /> {danceClass.room}</span>
          </div>
        </div>
        <Button onClick={startScanner} className="!w-auto h-10 px-4 text-xs gap-2 bg-[#111827] text-white">
            <Camera size={16}/> Scan QR
        </Button>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <button onClick={() => handleDateChange(-1)} className="p-2 text-gray-400 hover:text-gray-900"><ChevronLeft size={20}/></button>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#E53935]" />
            <span className="text-sm font-black text-gray-900">{new Date(selectedDate).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <button onClick={() => handleDateChange(1)} className="p-2 text-gray-400 hover:text-gray-900"><ChevronRight size={20}/></button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cursanți ({enrolledStudents.length})</h3>
          </div>
          <div className="space-y-2">
            {enrolledStudents.map((student) => {
              const sub = getSubStatus(student);
              const status = checkInData[student.id] || 'none';
              return (
                <div key={student.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between ${!sub.selectable ? 'opacity-60' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img src={student.avatarUrl} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="min-w-0"><h4 className="text-sm font-bold text-gray-900 truncate">{student.name}</h4><Badge color={`${sub.color} !text-[8px] border mt-1`}>{sub.label}</Badge></div>
                  </div>
                  <div className={`flex bg-gray-100 p-1 rounded-xl ${!isToday ? 'pointer-events-none opacity-50' : ''}`}>
                    <button onClick={() => handleToggle(student.id, 'present')} className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-[#34A853] text-white shadow-sm' : 'text-gray-400'}`}><CheckCircle2 size={18} /></button>
                    <button onClick={() => handleToggle(student.id, 'absent')} className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-red-50 text-red-600 text-white shadow-sm' : 'text-gray-400'}`}><XCircle size={18} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {isToday && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-center z-40">
          <Button onClick={handleSave} isLoading={isSaving} className="max-w-md bg-[#34A853] hover:bg-green-700 gap-2"><Save size={18} /> Salvează</Button>
        </div>
      )}

      {/* SCANNER OVERLAY */}
      {isScannerOpen && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              <button onClick={stopScanner} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white"><X size={24}/></button>
              
              <div className="w-full max-w-sm aspect-square relative rounded-[40px] overflow-hidden border-4 border-white/20 shadow-2xl">
                   <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                   <canvas ref={canvasRef} className="hidden" />
                   <div className="absolute inset-0 border-[60px] border-black/40"></div>
                   <div className="absolute inset-[60px] border-2 border-white/40 rounded-3xl">
                       <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -translate-x-1 -translate-y-1 rounded-tl-xl"></div>
                       <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 translate-x-1 -translate-y-1 rounded-tr-xl"></div>
                       <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -translate-x-1 translate-y-1 rounded-bl-xl"></div>
                       <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 translate-x-1 translate-y-1 rounded-br-xl"></div>
                       <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/50 animate-bounce mt-10"></div>
                   </div>
                   {isProcessingQr && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"><RefreshCw size={48} className="text-white animate-spin"/></div>}
              </div>

              {/* DEMO TOOL: Selection of students to simulate scan */}
              <div className="mt-8 w-full max-w-sm space-y-4">
                  {lastScannedResult ? (
                      <div className={`p-6 rounded-3xl border-2 text-center animate-in zoom-in duration-300 ${lastScannedResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${lastScannedResult.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                              {lastScannedResult.success ? <Check size={32} strokeWidth={4}/> : <X size={32} strokeWidth={4}/>}
                          </div>
                          <h3 className="text-xl font-black text-gray-900">{lastScannedResult.name || 'Student Necunoscut'}</h3>
                          <p className={`text-sm font-bold mt-1 ${lastScannedResult.success ? 'text-green-600' : 'text-red-600'}`}>{lastScannedResult.message}</p>
                          <Button onClick={() => setLastScannedResult(null)} variant="secondary" className="mt-6 h-10">Următorul Scan</Button>
                      </div>
                  ) : (
                      <>
                        <p className="text-white/60 text-center text-sm font-bold mb-4 uppercase tracking-widest">Simulare Scanare (Click pe membru)</p>
                        <div className="grid grid-cols-2 gap-2">
                            {enrolledStudents.slice(0, 4).map(s => (
                                <button key={s.id} onClick={() => handleManualCode(s.id)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl text-white text-xs font-bold text-center border border-white/10">{s.name.split(' ')[0]}</button>
                            ))}
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
