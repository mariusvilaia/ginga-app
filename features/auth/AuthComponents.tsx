
import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full max-w-md bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8">
    {children}
  </div>
);

export const AuthInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }> = ({ label, error, ...props }) => (
  <div className="space-y-1.5 mb-4">
    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">{label}</label>
    <input 
      {...props}
      className={`w-full px-4 py-3 rounded-xl border-2 bg-gray-50/50 transition-all outline-none font-medium
        ${error ? 'border-red-200 focus:border-red-500' : 'border-gray-100 focus:border-gray-900'}`}
    />
    {error && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{error}</p>}
  </div>
);

export const AuthButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary', isLoading?: boolean }> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const base = "w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex justify-center items-center gap-2";
  const styles = {
    primary: "bg-[#E53935] text-white shadow-lg shadow-red-500/20 hover:bg-[#D32F2F]",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

export const AuthAlert: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 mb-6">
    <AlertCircle size={16} />
    <span className="text-xs font-bold">{message}</span>
  </div>
);
