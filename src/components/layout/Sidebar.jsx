import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Users, 
  ReceiptText, 
  Settings, 
  PlusCircle,
  HardHat,
  Store
} from 'lucide-react';

export const Sidebar = () => {
  const { currentTab, setCurrentTab, setEditingParteId, empresa, userRole } = useApp();

  const allMenuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard, adminOnly: false },
    { id: 'partes-historial', label: 'Partes Diarios', icon: FileText, adminOnly: false },
    { id: 'obras', label: 'Obras y Proyectos', icon: Building2, adminOnly: false },
    { id: 'personal', label: 'Personal y Cuadrillas', icon: Users, adminOnly: true },
    { id: 'materiales', label: 'Albaranes y Compras', icon: ReceiptText, adminOnly: false },
    { id: 'proveedores-ibiza', label: 'Proveedores Ibiza', icon: Store, adminOnly: false },
    { id: 'configuracion', label: 'Empresa y Ajustes', icon: Settings, adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-4 shrink-0 justify-between h-screen sticky top-0">
      <div>
        {/* Logo / Título de la Plataforma */}
        <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-tight">OBRA CONTROL</div>
            <div className="text-xs text-brand-400 font-medium">
              {userRole === 'admin' ? '🏢 Modo Oficina' : '👷 Modo Campo'}
            </div>
          </div>
        </div>

        {/* Botón Destacado Nuevo Parte */}
        <button
          onClick={() => {
            setEditingParteId(null);
            setCurrentTab('nuevo-parte');
          }}
          className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Nuevo Parte Diario</span>
        </button>

        {/* Navegación Principal */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'obras' && currentTab === 'obra-detalle');
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Info de la Empresa en el Footer del Sidebar */}
      <div className="pt-4 border-t border-slate-800 px-2 text-xs text-slate-500">
        <p className="font-medium text-slate-400 truncate">{empresa.nombre || 'Empresa'}</p>
        <p className="text-[11px] text-slate-500">v2.2.0 • MVP Listo</p>
      </div>
    </aside>
  );
};
