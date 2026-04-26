
import React, { useState, useEffect } from 'react';
import { UserProfile, SkillLevel, DanceStyle, ChatMember } from './types';
import { INITIAL_USER, MOCK_STUDENTS_POOL, MOCK_INSTRUCTORS_DATA, AVATARS } from './constants';
import { DesktopDashboard } from './components/dashboard/DesktopDashboard';
import { LoginPage } from './features/auth/LoginPage';
import { OnboardingPage } from './features/auth/OnboardingPage';
import { StudentDashboard } from './features/student/StudentDashboard';
import { InstructorDashboard } from './features/instructor/InstructorDashboard';
import { auth, db } from './firebaseConfig';
import * as FirebaseAuth from "firebase/auth";
import { useData } from './contexts/DataContext';
import { doc, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const { claimStudentProfile, students } = useData(); // Use the claim function and students data from Context

  const [authState, setAuthState] = useState<'logged-out' | 'onboarding' | 'logged-in'>('logged-out');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [justOnboarded, setJustOnboarded] = useState(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = FirebaseAuth.onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // STRICT CHECK: Only allow access if email is verified
        if (!firebaseUser.emailVerified) {
          FirebaseAuth.signOut(auth);
          setAuthState('logged-out');
          return;
        }

        // Determine Role based on Email
        let role: 'student' | 'admin' | 'instructor' = 'student';
        
        // --- ADMIN OVERRIDE ---
        if (firebaseUser.email === 'contact@ginga.ro') {
            role = 'admin';
        } else if (MOCK_INSTRUCTORS_DATA.some(i => i.email === firebaseUser.email)) {
            role = 'instructor';
        }

        // --- CLAIM PROFILE LOGIC (Link Imported CSV to this User) ---
        if (role === 'student') {
            await claimStudentProfile(firebaseUser);
        }

        // --- FETCH REAL USER DATA FROM FIRESTORE ---
        let userData: UserProfile = {
            ...INITIAL_USER,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Utilizator Nou',
            avatarUrl: firebaseUser.photoURL || undefined,
            role: role
        };

        try {
            // Check if we have a student profile for this UID (either just claimed or existed)
            const docRef = doc(db, 'students', firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                // If profile exists in Firestore, use that data!
                // This enables the student to see the Subscription/Group assigned by Admin via CSV
                const firestoreData = docSnap.data();
                userData = { ...userData, ...firestoreData }; 
            }
        } catch (e) {
            console.error("Error fetching user profile:", e);
        }

        setUser(userData);
        setAuthState('logged-in');
      }
    });

    return () => unsubscribe();
  }, [claimStudentProfile]); // Add claimStudentProfile to dependency array

  const handleLogin = (role: 'admin' | 'instructor' | 'student') => {
    // This function is mostly for Demo button clicks now, but we keep it for fallback logic
    let updatedUser: UserProfile = { ...INITIAL_USER, role };

    if (role === 'instructor') {
        const marius = MOCK_INSTRUCTORS_DATA.find(i => i.name?.includes('Marius Vilaia'));
        if (marius) {
            updatedUser = {
                ...INITIAL_USER,
                id: marius.id,
                name: marius.name,
                email: marius.email,
                phone: marius.phone,
                avatarUrl: marius.avatarUrl, 
                role: 'instructor',
            };
        } else {
             updatedUser.name = 'Marius Vilaia';
             updatedUser.role = 'instructor';
             updatedUser.avatarUrl = AVATARS.MariusVilaia;
        }
    } else if (role === 'admin') {
        updatedUser = {
            ...INITIAL_USER,
            name: 'Ginga Admin',
            role: 'admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Ginga&background=000&color=fff'
        };
    }
    
    setUser(updatedUser);
    setJustOnboarded(false); 
    setAuthState('logged-in');
  };

  const handleOnboardingComplete = (profileData: any) => {
    const mapExperienceToLevel = (code: string): SkillLevel => {
        switch (code) {
            case '0-3m': return SkillLevel.BEGINNER;
            case '3-6m': return SkillLevel.IMPROVERS;
            case '6-12m': return SkillLevel.INTERMEDIATE;
            case '1y+': return SkillLevel.ADVANCED;
            case '2y+': return SkillLevel.ADVANCED;
            default: return SkillLevel.BEGINNER;
        }
    };

    const newEnrollments = (profileData.styles || []).map((style: string) => ({
        style: style as DanceStyle,
        level: mapExperienceToLevel(profileData.experience[style] || '0-3m')
    }));

    const finalizedUser: UserProfile = {
      ...user,
      name: profileData.name,
      favoriteStyle: profileData.styles[0] as DanceStyle,
      enrollments: newEnrollments, 
      isOnboarded: true,
    };
    
    setUser(finalizedUser);
    setJustOnboarded(true); 
    setAuthState('logged-in');
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
    
    if (auth.currentUser) {
        const firebaseUpdates: { displayName?: string; photoURL?: string } = {};
        if (updates.name) firebaseUpdates.displayName = updates.name;
        if (updates.avatarUrl) firebaseUpdates.photoURL = updates.avatarUrl;

        if (Object.keys(firebaseUpdates).length > 0) {
            try {
                await FirebaseAuth.updateProfile(auth.currentUser, firebaseUpdates);
            } catch (e) {
                console.error("Failed to update Firebase profile", e);
            }
        }
    }
  };

  const handleLogout = async () => {
    try {
      await FirebaseAuth.signOut(auth);
      setAuthState('logged-out'); 
      setJustOnboarded(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  if (authState === 'logged-out') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (authState === 'onboarding') {
    return <OnboardingPage onComplete={handleOnboardingComplete} initialData={{ name: user.name, email: user.email }} />;
  }

  if (user.role === 'student') {
    return <StudentDashboard user={user} onLogout={handleLogout} startOnMembership={justOnboarded} onUpdateProfile={handleUpdateProfile} />;
  }

  if (user.role === 'instructor') {
    return <InstructorDashboard user={user} onLogout={handleLogout} />;
  }

  // Convert students to ChatMember format for DesktopDashboard if necessary
  const dashboardMembers: ChatMember[] = students.map(s => ({
      userId: s.id,
      name: s.name,
      avatarColor: 'bg-blue-500', // Default
      avatarUrl: s.avatarUrl,
      role: 'member',
      joinedAt: s.joinDate,
      riskScore: s.risk.level === 'high' ? 80 : 20
  }));

  return (
    <DesktopDashboard 
      user={user} 
      members={dashboardMembers} 
      onLogout={handleLogout}
      isDarkMode={isDarkMode} 
      toggleDarkMode={toggleDarkMode} 
      onUpdateProfile={handleUpdateProfile}
    />
  );
};

export default App;
