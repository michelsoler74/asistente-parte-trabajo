import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-bounce duration-300 max-w-sm">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
        isError 
          ? 'bg-rose-900/90 text-white border-rose-700 backdrop-blur-md'
          : isInfo
          ? 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-md'
          : 'bg-emerald-900/90 text-white border-emerald-700 backdrop-blur-md'
      }`}>
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        ) : isInfo ? (
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        )}
        <p className="text-xs sm:text-sm font-medium pr-2">{toast.message}</p>
      </div>
    </div>
  );
};
