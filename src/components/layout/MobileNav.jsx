import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Building2, 
  Plus, 
  Users, 
  FileText,
  ReceiptText,
  Settings
} from 'lucide-react';

export const MobileNav = () => {
  const { currentTab, setCurrentTab, setEditingParteId } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'obras', label: 'Obras', icon: Building2 },
    { id: 'nuevo-parte', label: 'Parte', icon: Plus, isAction: true },
    { id: 'partes-historial', label: 'Historial', icon: FileText },
    { id: 'configuracion', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'obras' && currentTab === 'obra-detalle');

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  setEditingParteId(null);
                  setCurrentTab('nuevo-parte');
                }}
                className="relative -top-3 flex flex-col items-center justify-center p-3 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-500/40 active:scale-90 transition-transform touch-manipulation"
                aria-label="Nuevo Parte"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all touch-manipulation min-w-[56px] ${
                isActive
                  ? 'text-brand-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-brand-600 scale-110' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
