import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Users, 
  FileText, 
  ReceiptText, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Share2,
  Printer,
  DollarSign,
  Receipt,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { generatePartePDF } from '../../services/pdfGenerator';
import { shareToWhatsApp } from '../../services/shareService';
import { exportLibroCompletoExcel } from '../../services/excelExportService';

export const Dashboard = () => {
  const { obras, operarios, partes, albaranes, setCurrentTab, setSelectedObraId, setEditingParteId, empresa, userRole, showToast } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const partesHoy = partes.filter(p => p.fecha === todayStr);
  const totalHorasHoy = partesHoy.reduce((sum, p) => {
    return sum + (p.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
  }, 0);

  const obrasActivas = obras.filter(o => o.estado === 'activa');
  const operariosActivos = operarios.filter(o => o.activo);

  // Totales Financieros Globales
  const tarifaMap = {};
  operarios.forEach(op => {
    const fullName = `${op.nombre} ${op.apellidos || ''}`.trim();
    tarifaMap[fullName] = parseFloat(op.costeHora) || 0;
    tarifaMap[op.nombre] = parseFloat(op.costeHora) || 0;
  });

  let totalManoObraGlobal = 0;
  partes.forEach(p => {
    (p.operarios || []).forEach(op => {
      const horas = parseFloat(op.horas) || 0;
      const tarifa = tarifaMap[op.nombre] || 18.0;
      totalManoObraGlobal += horas * tarifa;
    });
  });

  const totalMaterialesGlobal = albaranes.reduce((sum, a) => sum + (parseFloat(a.importe) || 0), 0);
  const totalGastoGlobal = totalManoObraGlobal + totalMaterialesGlobal;
  const totalPresupuestoGlobal = obras.reduce((sum, o) => sum + (parseFloat(o.presupuesto) || 0), 0);
  const margenGlobal = totalPresupuestoGlobal - totalGastoGlobal;

  const startNewParte = () => {
    setEditingParteId(null);
    setCurrentTab('nuevo-parte');
  };

  const handleExportExcel = () => {
    exportLibroCompletoExcel({ obras, partes, operarios, albaranes, empresa });
    showToast('Libro Excel descargado con 4 pestañas formateadas');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Banner de Bienvenida y Acciones Rápidas */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {empresa.nombre || 'Control Diario de Obras'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl">
              {userRole === 'admin' 
                ? 'Control global de costes, mano de obra, materiales y rentabilidad de obras.' 
                : 'Registra los avances, horas de cuadrilla, materiales y fotos del día en tus obras.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {userRole === 'admin' && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm border border-emerald-500/30 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all touch-manipulation"
                title="Exportar Libro Completo Excel con 4 hojas: Rentabilidad, Partes, Liquidación y Albaranes"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Excel</span>
              </button>
            )}

            <button
              onClick={startNewParte}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-500/30 active:scale-95 transition-all touch-manipulation"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Nuevo Parte Diario</span>
            </button>
          </div>
        </div>

        {/* Círculos decorativos de fondo */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-brand-400/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Resumen Financiero Ejecutivo (Solo en Modo Oficina) */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Presupuestos Obras</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {totalPresupuestoGlobal.toFixed(0)} €
            </div>
            <span className="text-[11px] text-slate-500">{obras.length} proyectos contratados</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-blue-700">Gasto Mano de Obra</span>
            <div className="text-xl sm:text-2xl font-black text-blue-900 mt-1">
              {totalManoObraGlobal.toFixed(0)} €
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">
              {totalPresupuestoGlobal > 0 ? ((totalManoObraGlobal / totalPresupuestoGlobal) * 100).toFixed(1) : 0}% del presupuesto
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-700">Gasto Materiales</span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
              {totalMaterialesGlobal.toFixed(0)} €
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">
              {totalPresupuestoGlobal > 0 ? ((totalMaterialesGlobal / totalPresupuestoGlobal) * 100).toFixed(1) : 0}% del presupuesto
            </span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-700">Margen Neto Global</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              {margenGlobal.toFixed(0)} €
            </div>
            <span className="text-[11px] text-emerald-800 font-bold">
              {totalPresupuestoGlobal > 0 ? ((margenGlobal / totalPresupuestoGlobal) * 100).toFixed(1) : 0}% rentabilidad
            </span>
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Operativas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Obras Activas</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{obrasActivas.length}</span>
            <span className="text-xs text-slate-400">de {obras.length} totales</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Personal Activo</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{operariosActivos.length}</span>
            <span className="text-xs text-emerald-600 font-medium">En plantilla</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Partes Guardados</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{partes.length}</span>
            <span className="text-xs text-slate-400">en historial</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Albaranes</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{albaranes.length}</span>
            <span className="text-xs text-indigo-600 font-medium">comprobantes</span>
          </div>
        </div>
      </div>

      {/* Grid Central: Obras en Progreso y Últimos Partes Diarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Obras Activas */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Obras en Curso</h3>
            </div>
            <button
              onClick={() => setCurrentTab('obras')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {obrasActivas.slice(0, 4).map((obra) => (
              <div
                key={obra.id}
                onClick={() => {
                  setSelectedObraId(obra.id);
                  setCurrentTab('obra-detalle');
                }}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-brand-50/50 hover:border-brand-200 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
                      {obra.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{obra.cliente || 'Sin cliente asignado'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {obra.progreso || 0}%
                  </span>
                </div>

                <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${obra.progreso || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Últimos Partes de Trabajo */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Últimos Partes Diarios Registrados</h3>
            </div>
            <button
              onClick={() => setCurrentTab('partes-historial')}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              Ver historial <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {partes.slice(0, 5).map((parte) => {
              const horasTotales = (parte.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
              return (
                <div
                  key={parte.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">{parte.obraNombre}</span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">
                        {parte.fecha}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {parte.trabajosRealizados || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>👷 {parte.operarios?.length || 0} operarios</span>
                      <span>⏱️ {horasTotales}h trabajadas</span>
                      {parte.albaranes?.length > 0 && <span>📄 {parte.albaranes.length} albaranes</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => generatePartePDF(parte, empresa)}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Imprimir / Guardar PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => shareToWhatsApp(parte, empresa)}
                      className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
