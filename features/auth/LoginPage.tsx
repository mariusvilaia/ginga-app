
import React, { useState } from 'react';
import { Mail, Zap, User, GraduationCap, ShieldCheck, Lock, CheckCircle, ArrowLeft, Check } from 'lucide-react';
import { GingaLogo } from '../../components/shared/GingaLogo';
import { AuthAlert } from './AuthComponents';
import { auth, googleProvider } from '../../firebaseConfig';
import * as FirebaseAuth from "firebase/auth";

interface LoginPageProps {
  onLogin: (role: 'admin' | 'instructor' | 'student') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('contact@ginga.ro');
  const [password, setPassword] = useState('Rd392322m');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email || !password) {
        setError('Te rugăm să introduci email-ul și parola.');
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // --- SIGN UP ---
        const userCredential = await FirebaseAuth.createUserWithEmailAndPassword(auth, email, password);
        
        if (userCredential.user) {
            await FirebaseAuth.sendEmailVerification(userCredential.user);
        }
        
        await FirebaseAuth.signOut(auth);

        setPendingEmail(email);
        setShowVerificationScreen(true);

      } else {
        // --- SIGN IN ---
        // Always set persistence to LOCAL so the user stays logged in until explicit logout
        await FirebaseAuth.setPersistence(auth, FirebaseAuth.browserLocalPersistence);

        const userCredential = await FirebaseAuth.signInWithEmailAndPassword(auth, email, password);
        
        if (userCredential.user && !userCredential.user.emailVerified) {
            await FirebaseAuth.signOut(auth);
            setPendingEmail(email);
            setShowVerificationScreen(true);
            return;
        }
      }
    } catch (err: any) {
      const errorCode = err.code;
      const errorMessage = err.message;

      // Only log unexpected system errors to the console. 
      // Expected validation errors (wrong password, etc.) are handled via UI only.
      if (
        errorCode !== 'auth/wrong-password' && 
        errorCode !== 'auth/user-not-found' && 
        errorCode !== 'auth/invalid-credential' &&
        errorCode !== 'auth/email-already-in-use'
      ) {
          console.error("Authentication Error:", err);
      }
      
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-email') {
        setError("Nu există un cont asociat cu acest email. Verifică adresa sau creează un cont nou.");
      } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        setError("Emailul sau parola sunt incorecte.");
      } else if (errorCode === 'auth/email-already-in-use') {
        setError("Există deja un cont cu acest email.");
      } else if (errorCode === 'auth/weak-password') {
        setError("Parola trebuie să aibă minim 6 caractere.");
      } else if (errorCode === 'auth/too-many-requests') {
        setError("Prea multe încercări eșuate. Te rugăm să încerci din nou mai târziu.");
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError("Acest domeniu nu este autorizat în consola Firebase.");
      } else if (errorCode === 'auth/network-request-failed') {
        setError("Eroare de rețea. Verifică conexiunea la internet.");
      } else {
        setError(errorMessage || "A apărut o eroare. Te rugăm să încerci din nou.");
      }
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await FirebaseAuth.setPersistence(auth, FirebaseAuth.browserLocalPersistence);
      await FirebaseAuth.signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Acest domeniu nu este autorizat în consola Firebase.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Autentificarea a fost anulată.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Fereastra de autentificare a fost blocată. Te rugăm să permiți pop-up-urile.");
      } else {
        setError("Nu s-a putut conecta cu Google. Încearcă din nou.");
      }
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Introdu adresa de email.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await FirebaseAuth.sendPasswordResetEmail(auth, email);
      setSuccessMessage("Link-ul de resetare a fost trimis! Verifică inbox-ul.");
    } catch (err: any) {
       console.error("Reset Password Error:", err);
       if (err.code === 'auth/user-not-found') {
           setError("Nu există un utilizator cu acest email.");
       } else if (err.code === 'auth/invalid-email') {
           setError("Adresa de email nu este validă.");
       } else if (err.code === 'auth/unauthorized-domain') {
           setError("Acest domeniu nu este autorizat.");
       } else {
           setError(err.message || "Nu s-a putut trimite email-ul.");
       }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'instructor' | 'student') => {
      onLogin(role);
  }

  // --- VERIFICATION SCREEN ---
  if (showVerificationScreen) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white font-sans text-[#1a1f36] p-6">
            <div className="w-full max-w-[440px] text-center">
                <div className="mb-8 flex justify-center">
                    <GingaLogo size="lg" />
                </div>
                
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail size={32} />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-4 text-[#1a1f36]">Verifică-ți email-ul</h2>
                    
                    <p className="text-[#3c4257] text-base mb-8 leading-relaxed">
                        Am trimis un email de verificare la <span className="font-bold text-[#1a1f36]">{pendingEmail}</span>. 
                        Te rugăm să îl verifici pentru a te putea loga.
                    </p>

                    <button 
                        onClick={() => {
                            setShowVerificationScreen(false);
                            setIsSignUp(false); // Reset to Login mode
                            setError(null);
                        }}
                        className="w-full bg-[#facc15] hover:bg-[#eab308] text-[#1a1f36] font-medium py-3 rounded-md shadow-sm transition-all active:scale-[0.99]"
                    >
                        Înapoi la Login
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans text-[#1a1f36]">
      {/* LEFT PANEL (Black) */}
      <div className="w-full lg:w-[40%] bg-black text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden shrink-0 dark">
         <div className="flex items-center gap-2 mb-12 lg:mb-0">
            <GingaLogo size="sm" /> 
         </div>

         <div className="max-w-md z-10 my-8 lg:my-0">
            <h1 className="text-3xl lg:text-[40px] font-medium leading-[1.1] tracking-tight text-white">
               Tot ce ai nevoie pentru dans, într-un singur loc.
            </h1>
         </div>

         <div className="z-10">
             {/* Footer content removed as requested */}
         </div>
      </div>

      {/* RIGHT PANEL (White) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-24 bg-white relative">
         <div className="w-full max-w-[440px]">
            {isForgotPassword ? (
               <>
                  <h2 className="text-[32px] font-bold mb-4 tracking-tight text-[#1a1f36]">
                     Resetare Parolă
                  </h2>
                  <p className="text-[#3c4257] text-base mb-10 leading-relaxed font-medium">
                     Introduceți adresa de e-mail asociată contului pentru a primi instrucțiunile de resetare.
                  </p>

                  {error && <AuthAlert message={error} />}
                  {successMessage && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl border border-green-100 mb-6">
                        <CheckCircle size={16} />
                        <span className="text-xs font-bold">{successMessage}</span>
                      </div>
                  )}

                  {!successMessage && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-[#3c4257] mb-2">E-mail</label>
                            <div className="relative group">
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-md border border-[#e6ebf1] shadow-sm outline-none focus:ring-4 focus:ring-[#facc15]/20 focus:border-[#facc15] transition-all text-[#1a1f36] bg-white group-hover:border-[#cbd5e1]"
                                    required
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3acb9]">
                                    <Mail size={20} strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-[#facc15] hover:bg-[#eab308] text-[#1a1f36] font-medium py-3 rounded-md shadow-sm transition-all active:scale-[0.99] flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Zap className="animate-spin" size={20}/> : "Trimite Link Resetare"}
                        </button>
                    </form>
                  )}

                  <div className="mt-6 text-center">
                    <button 
                        onClick={() => { 
                            setIsForgotPassword(false); 
                            setError(null); 
                            setSuccessMessage(null); 
                        }} 
                        className="text-sm text-gray-500 hover:text-gray-900 font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={16}/> Înapoi la Conectare
                    </button>
                  </div>
               </>
            ) : (
               <>
                <h2 className="text-[32px] font-bold mb-4 tracking-tight text-[#1a1f36]">
                   {isSignUp ? 'Creează un cont' : 'Conectați-vă la cont'}
                </h2>
                <p className="text-[#3c4257] text-base mb-8 leading-relaxed font-medium">
                   {isSignUp 
                     ? 'Completează detaliile de mai jos pentru a începe.' 
                     : 'Introduceți adresa de e-mail și parola pentru a accesa portalul.'}
                </p>

                {error && <AuthAlert message={error} />}

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div>
                      <label className="block text-sm font-semibold text-[#3c4257] mb-2">E-mail</label>
                      <div className="relative group">
                         <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-md border border-[#e6ebf1] shadow-sm outline-none focus:ring-4 focus:ring-[#facc15]/20 focus:border-[#facc15] transition-all text-[#1a1f36] bg-white group-hover:border-[#cbd5e1]"
                            required
                         />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3acb9]">
                            <User size={20} strokeWidth={1.5} />
                         </div>
                      </div>
                   </div>

                   <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-semibold text-[#3c4257]">Parolă</label>
                          {!isSignUp && (
                              <button 
                                type="button"
                                onClick={() => { setIsForgotPassword(true); setError(null); }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Ai uitat parola?
                              </button>
                          )}
                      </div>
                      <div className="relative group">
                         <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-md border border-[#e6ebf1] shadow-sm outline-none focus:ring-4 focus:ring-[#facc15]/20 focus:border-[#facc15] transition-all text-[#1a1f36] bg-white group-hover:border-[#cbd5e1]"
                            required
                         />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3acb9]">
                            <Lock size={20} strokeWidth={1.5} />
                         </div>
                      </div>
                   </div>

                   <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-[#facc15] hover:bg-[#eab308] text-[#1a1f36] font-medium py-3 rounded-md shadow-sm transition-all active:scale-[0.99] flex justify-center items-center gap-2"
                   >
                      {isLoading ? <Zap className="animate-spin" size={20}/> : (isSignUp ? "Înregistrare" : "Conectare")}
                   </button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {isSignUp ? "Ai deja un cont? Conectează-te" : "Nu ai cont? Creează unul"}
                  </button>
                </div>

                <div className="relative flex py-6 items-center">
                    <div className="flex-grow border-t border-[#e6ebf1]"></div>
                    <span className="flex-shrink-0 mx-4 text-[#a3acb9] text-xs font-bold uppercase tracking-wide">Sau continuă cu</span>
                    <div className="flex-grow border-t border-[#e6ebf1]"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white text-[#3c4257] font-semibold py-2.5 rounded-md border border-[#e6ebf1] hover:border-[#cbd5e1] hover:text-[#1a1f36] hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center gap-3 group active:scale-[0.99]"
                >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04 2.23 1.04 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                   <span>Google</span>
                </button>

                <div className="mt-16 pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Demo Access Configuration</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleDemoLogin('student')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group bg-white">
                            <User size={18} className="text-gray-400 group-hover:text-blue-600 mb-1.5 transition-colors"/>
                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900">Student (Mihnea)</span>
                        </button>
                        <button onClick={() => handleDemoLogin('instructor')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group bg-white">
                            <GraduationCap size={18} className="text-gray-400 group-hover:text-amber-600 mb-1.5 transition-colors"/>
                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900">Instructor (Marius)</span>
                        </button>
                        <button onClick={() => handleDemoLogin('admin')} className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group bg-white">
                            <ShieldCheck size={18} className="text-gray-400 group-hover:text-red-600 mb-1.5 transition-colors"/>
                            <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900">Admin</span>
                        </button>
                    </div>
                </div>
               </>
            )}
         </div>
      </div>
    </div>
  );
};
