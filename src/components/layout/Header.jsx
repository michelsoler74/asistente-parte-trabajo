import React from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, HardHat, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';

export const Header = () => {
  const { currentTab, setCurrentTab, setEditingParteId, empresa, userRole, setUserRole } = useApp();

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return userRole === 'admin' ? 'Panel de Control' : 'Inicio Operario';
      case 'nuevo-parte': return 'Asistente de Parte Diario';
      case 'partes-historial': return 'Historial de Partes';
      case 'obras': return 'Gestión de Obras';
      case 'obra-detalle': return 'Ficha de Obra';
      case 'personal': return 'Equipo y Personal';
      case 'materiales': return 'Albaranes y Compras';
      case 'proveedores-ibiza': return 'Proveedores Ibiza';
      case 'configuracion': return 'Ajustes y Empresa';
      default: return 'Obra Control';
    }
  };

  const handleNewParte = () => {
    setEditingParteId(null);
    setCurrentTab('nuevo-parte');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <HardHat className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{getTitle()}</span>
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {empresa.nombre || 'Plataforma Integral de Obras'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Selector de Rol: Modo Jefe vs Modo Operario */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setUserRole('admin')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
              userRole === 'admin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vista de Oficina con control de costes, presupuestos y ajustes"
          >
            <Briefcase className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Oficina</span>
          </button>
          <button
            onClick={() => setUserRole('operario')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
              userRole === 'operario'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Vista simplificada para operarios en obra"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Campo</span>
          </button>
        </div>

        {currentTab !== 'nuevo-parte' && (
          <button
            onClick={handleNewParte}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all touch-manipulation"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Crear Parte</span>
          </button>
        )}
      </div>
    </header>
  );
};
