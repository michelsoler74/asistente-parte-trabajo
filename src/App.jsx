import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Toast } from './components/common/Toast';
import { Dashboard } from './components/dashboard/Dashboard';
import { ParteFormWizard } from './components/partes/ParteFormWizard';
import { PartesHistory } from './components/partes/PartesHistory';
import { ObrasList } from './components/obras/ObrasList';
import { ObraDetalle } from './components/obras/ObraDetalle';
import { PersonalList } from './components/personal/PersonalList';
import { AlbaranesView } from './components/materiales/AlbaranesView';
import { ProveedoresIbizaView } from './components/proveedores/ProveedoresIbizaView';
import { ConfiguracionView } from './components/configuracion/ConfiguracionView';
import { Loader2 } from 'lucide-react';

export const App = () => {
  const { currentTab, isDbReady } = useApp();

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm font-semibold tracking-wide">Cargando base de datos de obras...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'nuevo-parte':
        return <ParteFormWizard />;
      case 'partes-historial':
        return <PartesHistory />;
      case 'obras':
        return <ObrasList />;
      case 'obra-detalle':
        return <ObraDetalle />;
      case 'personal':
        return <PersonalList />;
      case 'materiales':
        return <AlbaranesView />;
      case 'proveedores-ibiza':
        return <ProveedoresIbizaView />;
      case 'configuracion':
        return <ConfiguracionView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar para pantallas medianas/grandes */}
      <Sidebar />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Barra de Navegación Móvil Inferior */}
        <MobileNav />
      </div>

      {/* Alertas Flotantes */}
      <Toast />
    </div>
  );
};
