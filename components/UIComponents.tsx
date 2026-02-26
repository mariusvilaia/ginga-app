
import React from 'react';
import { Loader2, X } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', isLoading?: boolean }> = 
  ({ children, variant = 'primary', className = '', isLoading, ...props }) => {
  const baseStyle = "w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex justify-center items-center active:scale-95";
  const variants = {
    // Primary: Brand Yellow with Dark Text
    primary: "bg-brand-yellow text-gray-900 shadow-lg hover:bg-yellow-500",
    // Secondary: White with border
    secondary: "bg-white text-gray-900 border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200",
    // Danger: Subtle red bg
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    // Ghost: Minimal
    ghost: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }> = ({ label, error, className = '', ...props }) => (
  <div className="w-full mb-4">
    {label && <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${error ? 'text-red-500' : 'text-gray-400'}`}>{label}</label>}
    <input 
      className={`w-full px-4 py-3.5 rounded-xl border-2 bg-white text-gray-900 placeholder-gray-400 outline-none transition-all font-medium ${error ? 'border-red-500 focus:border-red-600 bg-red-50/10' : 'border-gray-200 focus:border-gray-900 focus:bg-white'} ${className}`}
      {...props} 
    />
    {error && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{error}</p>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "bg-gray-100 text-gray-600" }) => (
  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${color}`}>
    {children}
  </span>
);

export const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out flex items-center ${checked ? 'bg-brand-yellow' : 'bg-gray-200'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);
