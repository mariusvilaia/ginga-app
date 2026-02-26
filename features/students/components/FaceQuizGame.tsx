
import React, { useState, useMemo, useEffect } from 'react';
import { Trophy, Sparkles, Users, Volume2, VolumeX, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { StudentDetailedProfile, UserProfile } from '../../../types';
import { Button } from '../../../components/UIComponents';
import { useData } from '../../../contexts/DataContext';

interface FaceQuizGameProps {
    students: StudentDetailedProfile[];
    allGroups: any[];
    currentUser: UserProfile;
}

interface GameState {
    status: 'playing' | 'result' | 'finished';
    targetStudent: StudentDetailedProfile | null;
    options: StudentDetailedProfile[];
    selectedStudentId: string | null;
    score: { correct: number; total: number; streak: number };
}

export const FaceQuizGame: React.FC<FaceQuizGameProps> = ({ students, allGroups, currentUser }) => {
    const { updateStudent, updateInstructor } = useData();
    
    // 1. Filter Students based on Role
    const accessibleStudents = useMemo(() => {
        if (currentUser.role === 'admin') return students;
        
        const instructorGroupIds = allGroups
            .filter(g => g.instructors.some((i: any) => i.id === currentUser.id || i.name === currentUser.name))
            .map(g => g.id);

        return students.filter(s => 
            s.enrollments.some(e => instructorGroupIds.includes(e.groupId)) ||
            instructorGroupIds.some(gid => {
                const grp = allGroups.find(g => g.id === gid);
                return grp && s.mainGroup === grp.name;
            })
        );
    }, [students, allGroups, currentUser]);

    // 2. Game State
    const [gameState, setGameState] = useState<GameState>({
        status: 'playing',
        targetStudent: null,
        options: [],
        selectedStudentId: null,
        score: { correct: 0, total: 0, streak: 0 }
    });

    const [isMuted, setIsMuted] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [newHighscore, setNewHighscore] = useState(false);

    // Audio Helper
    const playSound = (type: 'success' | 'error') => {
        if (isMuted) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            if (type === 'success') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); 
                oscillator.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.3);
            } else {
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, ctx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(ctx.currentTime + 0.2);
            }
        } catch (e) { console.error(e); }
    };

    // 3. Start New Round
    const startRound = () => {
        setPointsEarned(0);
        setNewHighscore(false);
        
        if (accessibleStudents.length < 4) {
            setGameState(prev => ({ ...prev, status: 'finished' }));
            return;
        }

        const randomIndex = Math.floor(Math.random() * accessibleStudents.length);
        const target = accessibleStudents[randomIndex];

        // Distractors logic: Prioritize same gender to make it harder
        const sameGenderPool = accessibleStudents.filter(s => s.id !== target.id && s.gender === target.gender);
        
        let distractors: StudentDetailedProfile[] = [];
        if (sameGenderPool.length >= 3) {
            distractors = sameGenderPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        } else {
            const others = accessibleStudents.filter(s => s.id !== target.id && s.gender !== target.gender);
            distractors = [...sameGenderPool, ...others].sort(() => 0.5 - Math.random()).slice(0, 3);
        }

        const options = [target, ...distractors].sort(() => 0.5 - Math.random());

        setGameState(prev => ({
            ...prev,
            status: 'playing',
            targetStudent: target,
            options: options,
            selectedStudentId: null
        }));
    };

    // Init
    useEffect(() => {
        if (!gameState.targetStudent && accessibleStudents.length > 0) {
            startRound();
        }
    }, [accessibleStudents]);

    // 4. Handle Selection
    const handleSelect = async (studentId: string) => {
        if (gameState.status !== 'playing') return;

        const isCorrect = studentId === gameState.targetStudent?.id;
        playSound(isCorrect ? 'success' : 'error');

        const newStreak = isCorrect ? gameState.score.streak + 1 : 0;
        let pointsToAdd = 0;
        if (isCorrect) {
            pointsToAdd = 50 + (newStreak > 1 ? newStreak * 10 : 0);
            setPointsEarned(pointsToAdd);
        }

        setGameState(prev => ({
            ...prev,
            status: 'result',
            selectedStudentId: studentId,
            score: {
                correct: prev.score.correct + (isCorrect ? 1 : 0),
                total: prev.score.total + 1,
                streak: newStreak
            }
        }));

        if (isCorrect && currentUser) {
            const currentPoints = currentUser.stats.points || 0;
            const currentHighStreak = currentUser.stats.quizHighScore || 0;
            if (newStreak > currentHighStreak) setNewHighscore(true);

            const newStats = { 
                ...currentUser.stats, 
                points: currentPoints + pointsToAdd,
                quizHighScore: Math.max(currentHighStreak, newStreak)
            };
            const updates = { stats: newStats };
            
            try {
                if (currentUser.role === 'student') await updateStudent(currentUser.id, updates);
                else await updateInstructor(currentUser.id, updates);
            } catch (e) { console.error(e); }
        }
    };

    if (accessibleStudents.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <Users size={48} className="mb-4 opacity-20"/>
                <p>Nu sunt destui membri pentru a juca.</p>
            </div>
        );
    }

    const { targetStudent, options, status, score, selectedStudentId } = gameState;
    const isResult = status === 'result';
    const isCorrect = isResult && selectedStudentId === targetStudent?.id;

    return (
        <div className="flex flex-col items-center justify-center min-h-[600px] w-full py-8 relative">
            
            {/* Title Section */}
            <div className="text-center mb-16 z-10 animate-in fade-in slide-in-from-top-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">CINE ESTE?</p>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                    {targetStudent?.name}
                </h2>
            </div>

            {/* Game Board Container */}
            <div className="relative w-full max-w-md">
                
                {/* Score Pill - Floating overlapping the top border */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 bg-white dark:bg-gray-900 px-8 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 transition-all hover:scale-105">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Scor</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{score.correct}/{score.total}</span>
                    </div>
                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">Streak <Sparkles size={12} className={score.streak > 2 ? "text-orange-400 fill-orange-400" : "text-gray-300"}/></span>
                        <span className={`text-xl font-black leading-none ${score.streak > 2 ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>{score.streak}</span>
                    </div>
                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
                    <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                    </button>
                </div>

                {/* Dashed Area */}
                <div className="bg-white dark:bg-gray-900 rounded-[48px] border-2 border-dashed border-indigo-100 dark:border-indigo-900/50 p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative pt-16">
                    
                    {/* Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {options.map((student) => {
                            const isSelected = selectedStudentId === student.id;
                            const isTarget = student.id === targetStudent?.id;
                            
                            let ringClass = 'ring-0';
                            let opacityClass = 'opacity-100';
                            let scaleClass = 'scale-100';

                            if (isResult) {
                                if (isTarget) {
                                    // Correct answer
                                    ringClass = 'ring-4 ring-green-500 ring-offset-4 ring-offset-white dark:ring-offset-gray-900 shadow-2xl shadow-green-500/20';
                                    scaleClass = 'scale-105 z-10';
                                } else if (isSelected && !isTarget) {
                                    // Selected wrong answer
                                    ringClass = 'ring-4 ring-red-500 ring-offset-4 ring-offset-white dark:ring-offset-gray-900 shadow-xl shadow-red-500/20';
                                    opacityClass = 'opacity-80 grayscale';
                                } else {
                                    // Others
                                    opacityClass = 'opacity-30 grayscale blur-[2px]';
                                    scaleClass = 'scale-95';
                                }
                            }

                            return (
                                <button
                                    key={student.id}
                                    onClick={() => handleSelect(student.id)}
                                    disabled={isResult}
                                    className={`
                                        relative aspect-square rounded-full transition-all duration-500 group outline-none
                                        ${ringClass} ${opacityClass} ${scaleClass}
                                        ${!isResult ? 'hover:scale-105 hover:shadow-2xl cursor-pointer hover:ring-4 hover:ring-indigo-100 dark:hover:ring-indigo-900 hover:ring-offset-4 hover:ring-offset-white dark:hover:ring-offset-gray-900' : 'cursor-default'}
                                    `}
                                >
                                    <img 
                                        src={student.avatarUrl} 
                                        className="w-full h-full rounded-full object-cover bg-gray-100 dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-800" 
                                        alt="Option" 
                                    />
                                    
                                    {/* Result Icons */}
                                    {isResult && isTarget && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-[1px] rounded-full animate-in zoom-in duration-300">
                                            <div className="bg-white dark:bg-gray-900 rounded-full p-3 shadow-xl">
                                                <CheckCircle size={32} className="text-green-500 fill-green-100 dark:fill-green-900/30" />
                                            </div>
                                        </div>
                                    )}
                                    {isResult && isSelected && !isTarget && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-[1px] rounded-full animate-in zoom-in duration-300">
                                            <div className="bg-white dark:bg-gray-900 rounded-full p-3 shadow-xl">
                                                <XCircle size={32} className="text-red-500 fill-red-100 dark:fill-red-900/30" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Next Button Overlay */}
                    {isResult && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-xs flex flex-col items-center gap-3">
                            {pointsEarned > 0 && selectedStudentId === targetStudent?.id && (
                                <div className="bg-yellow-400 text-black font-black text-xs px-4 py-1.5 rounded-full shadow-lg animate-bounce">
                                    +{pointsEarned} Pts {newHighscore && '🏆 NEW RECORD!'}
                                </div>
                            )}
                            <Button 
                                onClick={startRound} 
                                className="h-14 w-full text-base bg-gray-900 hover:bg-black text-white shadow-xl rounded-2xl hover:-translate-y-1 transition-all"
                            >
                                Următorul <ArrowRight size={20} className="ml-2"/>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
