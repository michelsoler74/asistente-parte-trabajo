import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, ShieldCheck } from 'lucide-react';

export const ConnectionStatusBadge = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
          isOnline
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse hover:bg-amber-100'
        }`}
        title={isOnline ? 'Conectado a la red' : 'Trabajando sin conexión (Modo Offline)'}
      >
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline</span>
          </>
        )}
      </button>

      {/* Modal / Popover informativo */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-72 p-3.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 text-xs text-slate-700 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
              <span className="flex items-center gap-1.5">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-600" />
                )}
                Estado de Red
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isOnline ? 'En línea' : 'Sin conexión'}
              </span>
            </div>

            <p className="text-slate-600">
              {isOnline
                ? 'Tu dispositivo tiene acceso a internet. La aplicación y los datos se actualizan con normalidad.'
                : 'Estás en modo sin conexión. La base de datos local (IndexedDB) guarda automáticamente todos los partes, obras, fotos y firmas.'}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-brand-700 bg-brand-50 p-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 shrink-0 text-brand-600" />
              <span>Garantía de persistencia: No perderás ningún dato si sales de cobertura.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
