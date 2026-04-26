
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QrCode, Check, Clock, MapPin, User, ShieldAlert, Sparkles, Monitor, Loader2, X } from 'lucide-react';
import { useData } from '../../../contexts/DataContext';
import { StudentDetailedProfile } from '../../../types';
// @ts-ignore
import jsQR from 'jsqr';
import { Button } from '../../../components/UIComponents';

interface AttendanceKioskProps {
    onClose: () => void;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'denied' | 'error';

export const AttendanceKiosk: React.FC<AttendanceKioskProps> = ({ onClose }) => {
    const { students, classes, groups, performQrCheckIn } = useData();
    const [status, setStatus] = useState<ScanStatus>('idle');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [lastScanResult, setLastScanResult] = useState<{ 
        name: string; 
        avatarUrl: string;
        message: string; 
        subType: string; 
        sessionsLeft: number 
    } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Camera & Scanning Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scanRequestRef = useRef<number | null>(null);
    const isProcessingRef = useRef(false);

    // Auto-detect current/next class
    const activeClass = useMemo(() => {
        const now = new Date();
        const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
        const dayName = dayNames[now.getDay()];
        const todayStr = now.toISOString().split('T')[0];

        // 1. Get all active groups for today from the master schedule
        const groupsToday = groups.filter(g => g.schedule.day === dayName && g.status === 'active');
        
        // 2. Map groups to virtual class objects
        const classesFromGroups: any[] = groupsToday.map(g => ({
            id: g.id,
            title: g.name,
            instructors: g.instructors,
            time: g.schedule.time,
            duration: g.schedule.duration,
            room: g.schedule.room,
            level: g.level,
            style: g.style,
            date: todayStr,
            occupancy: { current: g.stats.enrolledCount, max: g.stats.maxCapacity }
        }));

        // 3. Merge with specific class instances for today
        const specificClasses = classes.filter(c => c.date === todayStr);
        const allToday = [...classesFromGroups];
        specificClasses.forEach(sc => {
            const index = allToday.findIndex(fc => fc.time === sc.time && fc.room === sc.room);
            if (index !== -1) {
                allToday[index] = { ...allToday[index], ...sc };
            } else {
                allToday.push(sc);
            }
        });

        const hour = now.getHours();
        const min = now.getMinutes();
        const nowMin = hour * 60 + min;
        
        const sorted = allToday.sort((a, b) => a.time.localeCompare(b.time));

        return sorted.find(c => {
            const [cHour, cMin] = c.time.split(':').map(Number);
            const classStartMin = cHour * 60 + cMin;
            // Match if within 60 mins of start time
            return Math.abs(classStartMin - nowMin) <= 60;
        }) || sorted[0];
    }, [classes, groups]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const init = async () => {
            const success = await startCamera();
            if (success) {
                scanRequestRef.current = requestAnimationFrame(tick);
            }
        };
        
        init();

        return () => {
            clearInterval(timer);
            stopCamera();
        };
    }, []);

    const startCamera = async (): Promise<boolean> => {
        setCameraError(null);
        setIsCameraReady(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user', 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 } 
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true");
                videoRef.current.muted = true;
                
                try {
                    await videoRef.current.play();
                    setIsCameraReady(true);
                    return true;
                } catch (playErr) {
                    console.error("Video play failed:", playErr);
                    setCameraError("Eroare la pornirea stream-ului video. Verifică permisiunile browserului.");
                    return false;
                }
            }
            return false;
        } catch (err: any) {
            console.error("Camera access denied:", err);
            let msg = "Nu am putut accesa camera.";
            if (err.name === 'NotAllowedError') msg = "Accesul la cameră a fost refuzat. Te rugăm să activezi camera din setările browserului.";
            if (err.name === 'NotFoundError') msg = "Nu am găsit nicio cameră disponibilă pe acest dispozitiv.";
            setCameraError(msg);
            return false;
        }
    };

    const stopCamera = () => {
        if (scanRequestRef.current) cancelAnimationFrame(scanRequestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const tick = () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && !isProcessingRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            
            if (canvas) {
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
                            handleCodeScanned(code.data);
                        }
                    } catch (qrErr) {}
                }
            }
        }
        scanRequestRef.current = requestAnimationFrame(tick);
    };

    const handleCodeScanned = async (id: string) => {
        if (isProcessingRef.current || status !== 'idle') return;

        const student = students.find(s => s.id === id);
        if (!student || !activeClass) return;

        isProcessingRef.current = true;
        setStatus('scanning');
        
        await new Promise(r => setTimeout(r, 400));

        const result = await performQrCheckIn(student.id, activeClass.id);
        
        if (result.success) {
            setStatus('success');
            playSound('success');
            setLastScanResult({
                name: student.name,
                avatarUrl: student.avatarUrl || '',
                message: result.message,
                subType: student.subscription.type,
                sessionsLeft: student.subscription.sessionsLeft
            });
        } else {
            setStatus('denied');
            if (result.message?.includes('Expirat')) {
                playSound('expired');
            } else {
                playSound('error');
            }

            setLastScanResult({
                name: student.name,
                avatarUrl: student.avatarUrl || '',
                message: result.message,
                subType: student.subscription.type,
                sessionsLeft: 0
            });
        }

        setTimeout(() => {
            setStatus('idle');
            setLastScanResult(null);
            isProcessingRef.current = false;
        }, 4500);
    };

    const playSound = (type: 'success' | 'error' | 'expired') => {
        let url = '';
        switch(type) {
            case 'success': 
                url = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; 
                break;
            case 'expired':
                url = 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3';
                break;
            case 'error':
            default:
                url = 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3';
                break;
        }
        const audio = new Audio(url);
        audio.play().catch(() => {});
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#111827] flex flex-col text-white animate-in fade-in duration-500 overflow-hidden font-sans">
            {/* 1. Header (Branded) */}
            <header className="p-6 md:p-10 flex justify-between items-center shrink-0 z-20">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="font-logo text-3xl md:text-5xl text-white tracking-tight flex items-center gap-2">
                            ginga<span className="text-ginga-600">.</span>desk
                        </h1>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 flex items-center gap-2`}>
                            <span className={`w-2 h-2 rounded-full ${isCameraReady ? 'bg-brand-green animate-pulse' : 'bg-ginga-600'}`}></span>
                            {isCameraReady ? 'Camera Live' : 'No Signal'}
                        </div>
                    </div>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">Management Sistem Prezență</p>
                </div>
                
                <div className="flex flex-col items-end">
                    <p className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums">
                        {currentTime.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">
                        {currentTime.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </header>

            {/* 2. Main Center Area */}
            <main className="flex-1 relative flex flex-col items-center justify-center p-8 overflow-hidden">
                
                {/* Background Camera Feed (Polished Overlay) */}
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                    <video 
                        ref={videoRef} 
                        className={`w-full h-full object-cover transition-opacity duration-1000 ${isCameraReady ? 'opacity-30 grayscale contrast-125' : 'opacity-0'}`} 
                        autoPlay 
                        muted 
                        playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Gradient Overlays for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-[#111827]/80"></div>
                    <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#111827]/60"></div>
                    
                    {!isCameraReady && !cameraError && (
                        <div className="absolute flex flex-col items-center gap-4">
                            <Loader2 size={48} className="animate-spin text-ginga-600" />
                            <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em]">Inițializare Hardware...</p>
                        </div>
                    )}
                </div>

                {cameraError ? (
                    <div className="z-10 text-center max-w-md p-10 bg-ginga-600/10 backdrop-blur-2xl rounded-[40px] border-2 border-ginga-600/20 animate-in zoom-in">
                        <ShieldAlert size={64} className="mx-auto text-ginga-600 mb-6" />
                        <h2 className="text-2xl font-black mb-4">Eroare Hardware</h2>
                        <p className="text-sm text-white/60 mb-8 leading-relaxed font-medium">{cameraError}</p>
                        <Button onClick={startCamera} className="bg-white text-ginga-600 font-black rounded-2xl h-14">Reîncearcă Activarea</Button>
                    </div>
                ) : status === 'idle' ? (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 z-10 w-full max-w-xl">
                        <div className="relative mb-12">
                             {/* Branded Glow */}
                            <div className="absolute inset-0 bg-ginga-600/20 rounded-[4rem] blur-[100px] animate-pulse"></div>
                            
                            {/* Scanning Guide Frame */}
                            <div className="relative w-72 h-72 md:w-[450px] md:h-[450px] border-4 border-white/10 rounded-[4rem] flex items-center justify-center backdrop-blur-[1px] shadow-2xl">
                                <div className="absolute inset-0 border-2 border-dashed border-white/5 rounded-[4rem] animate-[spin_30s_linear_infinite]"></div>
                                
                                {/* Corner Accents - Ginga Red */}
                                <div className="absolute -top-2 -left-2 w-16 h-16 border-t-[6px] border-l-[6px] border-ginga-600 rounded-tl-[3rem]"></div>
                                <div className="absolute -top-2 -right-2 w-16 h-16 border-t-[6px] border-r-[6px] border-ginga-600 rounded-tr-[3rem]"></div>
                                <div className="absolute -bottom-2 -left-2 w-16 h-16 border-b-[6px] border-l-[6px] border-ginga-600 rounded-bl-[3rem]"></div>
                                <div className="absolute -bottom-2 -right-2 w-16 h-16 border-b-[6px] border-r-[6px] border-ginga-600 rounded-br-[3rem]"></div>
                                
                                {/* Animated Scan Line - Ginga Red */}
                                <div className="absolute top-1/4 left-12 right-12 h-1 bg-ginga-600/60 blur-sm animate-[bounce_4s_infinite] shadow-[0_0_15px_rgba(225,29,72,0.5)]"></div>
                                
                                <div className="text-center space-y-4 opacity-40">
                                    <QrCode size={100} className="mx-auto text-white" strokeWidth={1} />
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">Scanare Activă</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black text-white/95 tracking-tight">Vă rugăm să scanați codul</h2>
                            <p className="text-white/40 font-bold text-sm md:text-base">Poți găsi codul în aplicație, la secțiunea <span className="text-white bg-white/10 px-3 py-1 rounded-lg inline-flex items-center gap-2 ml-1"><QrCode size={16}/> Check-in</span></p>
                        </div>
                    </div>
                ) : status === 'scanning' ? (
                    <div className="flex flex-col items-center gap-8 animate-pulse z-10">
                        <div className="w-40 h-40 rounded-full border-[10px] border-ginga-600 border-t-transparent animate-spin"></div>
                        <p className="text-4xl font-black uppercase tracking-[0.2em] text-ginga-600">Verificare...</p>
                    </div>
                ) : status === 'success' && lastScanResult ? (
                    <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500 w-full max-w-4xl bg-brand-green/90 backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border-4 border-white/20 shadow-[0_50px_100px_rgba(52,168,83,0.3)] z-10 relative overflow-hidden">
                        {/* Branded Success Pattern */}
                        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Sparkles size={160} /></div>

                        <div className="relative mb-10">
                            <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                            <img src={lastScanResult.avatarUrl} className="w-56 h-56 rounded-full border-8 border-white object-cover shadow-2xl relative" alt={lastScanResult.name} />
                            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-brand-green">
                                <Check size={40} className="text-brand-green" strokeWidth={5} />
                            </div>
                        </div>

                        <h2 className="text-6xl md:text-8xl font-black mb-4 text-white tracking-tighter">Salut, {lastScanResult.name.split(' ')[0]}!</h2>
                        <p className="text-2xl text-white/90 font-black mb-12 uppercase tracking-tight">{lastScanResult.message}</p>
                        
                        <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
                            <div className="bg-black/15 p-8 rounded-[2.5rem] border border-white/10 text-left">
                                <p className="text-[11px] font-bold text-white/50 uppercase mb-2 tracking-widest">Abonament</p>
                                <p className="text-3xl font-black text-white">{lastScanResult.subType}</p>
                            </div>
                            <div className="bg-black/15 p-8 rounded-[2.5rem] border border-white/10 text-left">
                                <p className="text-[11px] font-bold text-white/50 uppercase mb-2 tracking-widest">Acces Studio</p>
                                <p className="text-3xl font-black text-white">PERMIS ✅</p>
                            </div>
                        </div>

                        <div className="mt-16 flex items-center gap-3 text-white/40">
                            <Sparkles size={20} className="text-white/60"/>
                            <span className="text-sm font-black uppercase tracking-[0.3em]">Enjoy the class!</span>
                        </div>
                    </div>
                ) : status === 'denied' && lastScanResult ? (
                    <div className="flex flex-col items-center text-center animate-in shake duration-500 w-full max-w-4xl bg-ginga-600/90 backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border-4 border-white/20 shadow-[0_50px_100px_rgba(225,29,72,0.3)] z-10 relative overflow-hidden">
                        <div className="relative mb-10">
                            <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl"></div>
                            <img src={lastScanResult.avatarUrl} className="w-56 h-56 rounded-full border-8 border-white object-cover shadow-2xl opacity-50 grayscale relative" alt={lastScanResult.name} />
                            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-ginga-600">
                                <X size={40} className="text-ginga-600" strokeWidth={5} />
                            </div>
                        </div>

                        <h2 className="text-6xl md:text-8xl font-black mb-4 text-white tracking-tighter">{lastScanResult.name.split(' ')[0]}</h2>
                        <p className="text-3xl text-white font-black mb-12 uppercase tracking-tight">{lastScanResult.message}</p>
                        
                        <div className="bg-black/15 p-10 rounded-[3rem] border border-white/10 w-full max-w-3xl flex items-center gap-8">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                <ShieldAlert size={40} className="text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-black text-white leading-tight">Te rugăm să contactezi recepția</p>
                                <p className="text-lg text-white/70 font-bold mt-2">Abonamentul tău necesită reînnoire sau validare manuală.</p>
                            </div>
                        </div>
                    </div>
                ) : null}

            </main>

            {/* 3. Footer (Current Class Info) */}
            {activeClass && status === 'idle' && !cameraError && (
                <footer className="p-10 md:p-14 shrink-0 bg-white/5 backdrop-blur-xl border-t border-white/10 z-20 animate-in slide-in-from-bottom-10 duration-700">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-ginga-600 flex items-center justify-center shadow-2xl shadow-ginga-600/30">
                                <Clock size={48} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Sesiune în curs</p>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tight">{activeClass.title}</h3>
                                <div className="flex items-center gap-6 text-white/60 font-bold mt-3 text-lg">
                                    <span className="flex items-center gap-2 text-brand-yellow"><MapPin size={24}/> {activeClass.room}</span>
                                    <span className="w-2 h-2 rounded-full bg-white/20"></span>
                                    <span className="flex items-center gap-2"><User size={24}/> {activeClass.instructors.map(i => i.name.split(' ')[0]).join(' & ')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-8">
                            <div className="text-right">
                                <p className="text-5xl font-black tracking-tighter tabular-nums">{activeClass.occupancy?.current} <span className="text-white/20 text-2xl">/ {activeClass.occupancy?.max}</span></p>
                                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Prezențe</p>
                            </div>
                            <div className="h-16 w-px bg-white/10"></div>
                            <div className="text-right">
                                <p className="text-5xl font-black text-brand-green tracking-tighter tabular-nums">{activeClass.time}</p>
                                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Ora Start</p>
                            </div>
                        </div>
                    </div>
                </footer>
            )}

            {/* EXIT Button (Top Right for Staff) */}
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-4 text-white/5 hover:text-white/20 transition-all z-[150] rounded-full hover:bg-white/5"
                title="Exit Desk Kiosk"
            >
                <Monitor size={28} />
            </button>

            {/* SIMULATION TOOLS (Hidden mostly, bottom right) */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[200]">
                <div className="flex flex-wrap justify-end gap-2 opacity-5 hover:opacity-100 transition-opacity">
                    {students.slice(0, 3).map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => handleCodeScanned(s.id)}
                            disabled={status !== 'idle'}
                            className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all"
                        >
                            TEST {s.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .shake { animation: shake 0.4s ease-in-out; }
                .bg-radial-gradient {
                    background: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-to));
                }
            `}</style>
        </div>
    );
};
