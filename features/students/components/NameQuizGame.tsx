import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Volume2, VolumeX, Check, X, ArrowRight, MessageCircle, User, Users } from 'lucide-react';
import { StudentDetailedProfile, UserProfile } from '../../../types';
import { Button } from '../../../components/UIComponents';
import { useData } from '../../../contexts/DataContext';

interface NameQuizGameProps {
    students: StudentDetailedProfile[];
    allGroups: any[]; // GroupDetailedProfile[]
    currentUser: UserProfile;
    onNavigateToProfile?: (studentId: string) => void;
}

interface GameState {
    status: 'playing' | 'result' | 'finished';
    currentStudent: StudentDetailedProfile | null;
    options: { id: string; label: string; isCorrect: boolean }[];
    selectedOptionId: string | null;
    score: { correct: number; total: number; streak: number };
}

export const NameQuizGame: React.FC<NameQuizGameProps> = ({ students, allGroups, currentUser, onNavigateToProfile }) => {
    const { updateStudent, updateInstructor } = useData();
    
    // 1. Filter Students based on Role
    const accessibleStudents = useMemo(() => {
        if (currentUser.role === 'admin') return students;
        
        // Find groups taught by this instructor
        const instructorGroupIds = allGroups
            .filter(g => g.instructors.some((i: any) => i.id === currentUser.id || i.name === currentUser.name))
            .map(g => g.id);

        // Filter students enrolled in those groups
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
        currentStudent: null,
        options: [],
        selectedOptionId: null,
        score: { correct: 0, total: 0, streak: 0 }
    });

    const [isMuted, setIsMuted] = useState(false);
    const [pointsEarned, setPointsEarned] = useState(0);
    const [newHighscore, setNewHighscore] = useState(false);

    // 3. Helper to format name
    const formatName = (fullName: string, forceInitial = false) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        const first = parts[0];
        // If forceInitial is true OR if the name is very short, add last initial for clarity
        if ((forceInitial || parts.length > 1) && parts[1]) {
             // For the game options, usually First Name + Last Initial is good if needed, 
             // but the screenshot shows just First Name mostly. We'll stick to First Name unless collision.
             if (forceInitial) return `${first} ${parts[1].charAt(0)}.`;
        }
        return first;
    };

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

    // 4. Start New Round
    const startRound = () => {
        setPointsEarned(0);
        setNewHighscore(false);
        if (accessibleStudents.length < 4) {
            setGameState(prev => ({ ...prev, status: 'finished' }));
            return;
        }

        // Pick Random Student
        const randomIndex = Math.floor(Math.random() * accessibleStudents.length);
        const target = accessibleStudents[randomIndex];

        // Pick Distractors
        const sameGenderCandidates = accessibleStudents.filter(s => s.id !== target.id && s.gender === target.gender);
        let selectedDistractors: StudentDetailedProfile[] = [];

        if (sameGenderCandidates.length >= 3) {
            selectedDistractors = sameGenderCandidates.sort(() => 0.5 - Math.random()).slice(0, 3);
        } else {
            selectedDistractors = [...sameGenderCandidates];
            const otherCandidates = accessibleStudents.filter(s => s.id !== target.id && s.gender !== target.gender);
            const needed = 3 - selectedDistractors.length;
            if (otherCandidates.length >= needed) {
                const filled = otherCandidates.sort(() => 0.5 - Math.random()).slice(0, needed);
                selectedDistractors = [...selectedDistractors, ...filled];
            } else {
                selectedDistractors = [...selectedDistractors, ...otherCandidates];
            }
        }

        const roundStudents = [target, ...selectedDistractors];
        
        // Determine if we need initials (if duplicate first names exist in the options)
        const firstNames = roundStudents.map(s => (s.name || '').split(' ')[0]);
        const nameCounts = firstNames.reduce((acc, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const options = roundStudents.map(s => ({
            id: s.id,
            label: formatName(s.name, nameCounts[(s.name || '').split(' ')[0]] > 1),
            isCorrect: s.id === target.id
        })).sort(() => 0.5 - Math.random());

        setGameState(prev => ({
            ...prev,
            status: 'playing',
            currentStudent: target,
            options: options,
            selectedOptionId: null
        }));
    };

    // Init
    useEffect(() => {
        if (!gameState.currentStudent && accessibleStudents.length > 0) {
            startRound();
        }
    }, [accessibleStudents]);

    // 5. Handle Answer
    const handleAnswer = async (optionId: string) => {
        if (gameState.status !== 'playing') return;

        const isCorrect = gameState.options.find(o => o.id === optionId)?.isCorrect;
        playSound(isCorrect ? 'success' : 'error');
        
        const newStreak = isCorrect ? gameState.score.streak + 1 : 0;
        let pointsToAdd = 0;
        if (isCorrect) {
            pointsToAdd = 50 + (newStreak > 1 ? (newStreak * 10) : 0);
            setPointsEarned(pointsToAdd);
        }

        setGameState(prev => ({
            ...prev,
            status: 'result',
            selectedOptionId: optionId,
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

    const { currentStudent, options, selectedOptionId, status, score } = gameState;
    const isResult = status === 'result';
    const isCorrect = isResult && selectedOptionId === currentStudent?.id;
    
    // Determine style tag for result view
    const studentStyle = currentStudent?.favoriteStyle || (currentStudent?.enrollments && currentStudent.enrollments.length > 0 ? currentStudent.enrollments[0].style : 'STUDENT');

    return (
        <div className="flex flex-col items-center justify-center w-full py-8 relative">
            
            {/* Score Pill */}
            <div className="flex items-center gap-5 bg-white dark:bg-gray-900 px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 transition-all hover:-translate-y-1 mb-10">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scor</span>
                    <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{score.correct}/{score.total}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">Streak <Sparkles size={12} className={score.streak > 2 ? "text-orange-400 fill-orange-400" : "text-gray-300"}/></span>
                    <span className={`text-xl font-black leading-none ${score.streak > 2 ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>{score.streak}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                </button>
            </div>

            {/* Main Card */}
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
                
                {/* Result Top Bar - Green if correct */}
                {isResult && isCorrect && (
                    <div className="absolute top-0 left-0 right-0 h-3 bg-[#34A853]"></div>
                )}
                {isResult && !isCorrect && (
                    <div className="absolute top-0 left-0 right-0 h-3 bg-red-500"></div>
                )}

                <div className="p-8 pb-4 w-full flex flex-col items-center">
                    {/* Floating Points Badge */}
                    {isResult && isCorrect && pointsEarned > 0 && (
                        <div className="absolute top-6 right-6 bg-[#FACC15] text-black font-black text-xs px-3 py-1 rounded-lg shadow-sm animate-bounce z-10 transform rotate-3">
                            +{pointsEarned} Pts
                        </div>
                    )}

                    {/* Avatar Section */}
                    <div className="relative mb-6 mt-4">
                        {/* Dashed Ring */}
                        <div className="absolute -inset-3 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 pointer-events-none"></div>
                        
                        <div className="relative w-32 h-32 rounded-full p-1 bg-white dark:bg-gray-800">
                            <img 
                                src={currentStudent?.avatarUrl} 
                                className="w-full h-full rounded-full object-cover shadow-sm bg-gray-50"
                                alt="Student"
                            />
                        </div>

                        {/* Result Checkmark */}
                        {isResult && (
                            <div className={`absolute bottom-0 right-0 p-2 rounded-full shadow-lg border-4 border-white dark:border-gray-900 ${isCorrect ? 'bg-[#34A853]' : 'bg-red-500'} animate-in zoom-in duration-300`}>
                                {isCorrect ? <Check size={20} className="text-white" strokeWidth={3} /> : <X size={20} className="text-white" strokeWidth={3} />}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    {isResult ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 w-full flex flex-col items-center">
                            {newHighscore && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">NEW HIGH SCORE!</p>}
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                {currentStudent?.name}
                            </h2>
                            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-6">
                                {studentStyle}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mb-8">
                                <button className="w-12 h-12 rounded-2xl border border-green-200 text-green-600 flex items-center justify-center hover:bg-green-50 transition-colors">
                                    <MessageCircle size={20} />
                                </button>
                                <button 
                                    onClick={() => currentStudent && onNavigateToProfile && onNavigateToProfile(currentStudent.id)}
                                    className="w-12 h-12 rounded-2xl border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                    <User size={20} />
                                </button>
                            </div>

                            <Button 
                                onClick={startRound} 
                                className="w-full h-14 text-base font-black bg-[#FACC15] hover:bg-[#EAB308] text-gray-900 shadow-xl shadow-yellow-500/20 rounded-2xl transition-all"
                            >
                                Următorul <ArrowRight size={20} className="ml-2"/>
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <h2 className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-8">
                                Cum se numește {currentStudent?.gender === 'F' ? "această cursantă" : "acest cursant"}?
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                {options.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleAnswer(option.id)}
                                        className="py-4 px-2 rounded-2xl font-bold text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]"
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};