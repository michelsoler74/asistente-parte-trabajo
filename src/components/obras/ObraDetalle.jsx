import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { generatePartePDF, generateDossierObraPDF } from '../../services/pdfGenerator';
import { shareToWhatsApp } from '../../services/shareService';
import { exportLibroCompletoExcel } from '../../services/excelExportService';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Clock, 
  FileText, 
  Users, 
  Camera, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Printer, 
  Share2, 
  Edit,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  ShieldAlert,
  Receipt,
  Package,
  Layers,
  Store,
  Maximize2
} from 'lucide-react';

export const ObraDetalle = () => {
  const { obras, partes, operarios, albaranes, selectedObraId, setSelectedObraId, setCurrentTab, setEditingParteId, empresa, userRole, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('partes'); // 'partes', 'rentabilidad', 'personal', 'albaranes', 'fotos'
  const [viewerModal, setViewerModal] = useState({ isOpen: false, images: [], index: 0, title: '' });

  const obra = obras.find(o => o.id === selectedObraId);

  if (!obra) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Obra no encontrada.</p>
        <button
          onClick={() => setCurrentTab('obras')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const partesDeObra = partes.filter(p => p.obraId === obra.id || p.obraNombre === obra.nombre);
  
  // Mapa de tarifas de operarios
  const tarifaMap = {};
  operarios.forEach(op => {
    const fullName = `${op.nombre} ${op.apellidos || ''}`.trim();
    tarifaMap[fullName] = parseFloat(op.costeHora) || 0;
    tarifaMap[op.nombre] = parseFloat(op.costeHora) || 0;
  });

  // 1. Total de horas y coste de mano de obra
  let totalHoras = 0;
  let costeManoObraTotal = 0;

  const operariosMap = {};
  partesDeObra.forEach(p => {
    (p.operarios || []).forEach(op => {
      const horas = parseFloat(op.horas) || 0;
      const tarifa = tarifaMap[op.nombre] || (parseFloat(op.costeHora) || 18.0);
      
      totalHoras += horas;
      costeManoObraTotal += horas * tarifa;

      if (!operariosMap[op.nombre]) {
        operariosMap[op.nombre] = { 
          nombre: op.nombre, 
          especialidad: op.especialidad, 
          tarifa: tarifa, 
          horas: 0, 
          coste: 0, 
          partesCount: 0 
        };
      }
      operariosMap[op.nombre].horas += horas;
      operariosMap[op.nombre].coste += horas * tarifa;
      operariosMap[op.nombre].partesCount += 1;
    });
  });

  const operariosParticipantes = Object.values(operariosMap);

  // 2. Total de gasto en materiales y albaranes en esta obra
  const albaranesDeObra = useMemo(() => {
    const list = [];
    const seen = new Set();

    partesDeObra.forEach(p => {
      (p.albaranes || []).forEach((alb, idx) => {
        const id = alb.id || `${p.id}-${idx}`;
        if (!seen.has(id)) {
          seen.add(id);
          list.push({
            id: id,
            numero: alb.numero || 'Sin Nº',
            proveedor: alb.proveedor || 'Proveedor General',
            fecha: p.fecha,
            importe: parseFloat(alb.importe) || 0,
            url: alb.url || alb
          });
        }
      });
    });

    albaranes.filter(a => a.obraId === obra.id || a.obraNombre === obra.nombre).forEach(alb => {
      if (!seen.has(alb.id)) {
        seen.add(alb.id);
        list.push({
          id: alb.id,
          numero: alb.numero || 'Sin Nº',
          proveedor: alb.proveedor || 'Proveedor General',
          fecha: alb.fecha,
          importe: parseFloat(alb.importe) || 0,
          url: alb.fotoUrl || alb.url
        });
      }
    });

    return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [partesDeObra, albaranes, obra]);

  const costeMaterialesTotal = albaranesDeObra.reduce((sum, alb) => sum + (parseFloat(alb.importe) || 0), 0);

  // 3. Cálculos Financieros Globales
  const presupuesto = parseFloat(obra.presupuesto) || 0;
  const costeRealTotal = costeManoObraTotal + costeMaterialesTotal;
  const margenNetoEstimado = presupuesto - costeRealTotal;

  const pctManoObra = presupuesto > 0 ? ((costeManoObraTotal / presupuesto) * 100) : 0;
  const pctMateriales = presupuesto > 0 ? ((costeMaterialesTotal / presupuesto) * 100) : 0;
  const pctGastoTotal = presupuesto > 0 ? ((costeRealTotal / presupuesto) * 100) : 0;
  const pctMargen = presupuesto > 0 ? ((margenNetoEstimado / presupuesto) * 100) : 0;
  const progresoObra = obra.progreso || 0;

  // Alerta de desviación: si el gasto total consumido supera el avance físico en más de un 15%
  const hayDesviacionCostes = presupuesto > 0 && (pctGastoTotal > progresoObra + 15);

  // Galería de fotos consolidada
  const todasLasFotos = [];
  partesDeObra.forEach(p => {
    (p.imagenes || []).forEach(img => {
      todasLasFotos.push({ ...img, fechaParte: p.fecha });
    });
  });

  const handleCrearParteParaEstaObra = () => {
    setEditingParteId(null);
    setCurrentTab('nuevo-parte');
  };

  const handleGenerateDossier = () => {
    generateDossierObraPDF({
      obra,
      partes: partesDeObra,
      albaranes: albaranesDeObra,
      operarios: operariosParticipantes,
      empresa
    });
  };

  const handleExportCostes = () => {
    exportLibroCompletoExcel({ obras: [obra], partes: partesDeObra, operarios, albaranes: albaranesDeObra, empresa });
    showToast('Libro Excel de la obra descargado con éxito');
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Botón Volver y Acciones de Exportación */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setCurrentTab('obras')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Obras</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDossier}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
            title="Generar e imprimir Dossier Completo de la Obra en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-brand-400" />
            <span>Dossier PDF</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={handleExportCostes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-sm transition-all"
              title="Exportar datos financieros y partes de esta obra a Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel de Obra</span>
            </button>
          )}
        </div>
      </div>

      {/* Ficha Principal de la Obra */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                {obra.codigo || 'OBRA'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                {obra.estado || 'Activa'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {obra.nombre}
            </h2>
            <p className="text-xs text-slate-500">Cliente: <strong>{obra.cliente || 'No especificado'}</strong> • {obra.direccion || 'Ibiza'}</p>
          </div>

          <button
            onClick={handleCrearParteParaEstaObra}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Crear Parte de Hoy</span>
          </button>
        </div>

        {/* Métricas Resumidas Financieras */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Horas</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-brand-600" />
              <span>{totalHoras}h</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase text-slate-400">Progreso Físico</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{progresoObra}%</span>
            </div>
          </div>

          {userRole === 'admin' ? (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Coste Real Total</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <span>{costeRealTotal.toFixed(0)} €</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">{pctGastoTotal.toFixed(1)}% del presupuesto</span>
              </div>

              <div className={`p-4 rounded-2xl border ${margenNetoEstimado >= 0 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                <span className="text-[11px] font-bold uppercase text-slate-500">Margen Restante</span>
                <div className={`text-xl font-extrabold mt-1 flex items-center gap-1.5 ${margenNetoEstimado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  <TrendingUp className="w-5 h-5" />
                  <span>{margenNetoEstimado.toFixed(0)} €</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold">{pctMargen.toFixed(1)}% margen</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Partes Diarios</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>{partesDeObra.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400">Albaranes</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  <span>{albaranesDeObra.length}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Alerta de Desviación Financiera si aplica */}
        {userRole === 'admin' && hayDesviacionCostes && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">⚠️ Alerta de Desviación de Costes:</strong>
              Has consumido el <strong>{pctGastoTotal.toFixed(1)}%</strong> del presupuesto total (Mano de obra + Materiales) con un avance de obra estimado del <strong>{progresoObra}%</strong>.
            </div>
          </div>
        )}
      </div>

      {/* Pestañas de Detalle */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-bold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('partes')}
          className={`pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'partes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Diario de Trabajo ({partesDeObra.length})
        </button>

        {userRole === 'admin' && (
          <button
            onClick={() => setActiveSubTab('rentabilidad')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'rentabilidad'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Costes & Rentabilidad Total</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('albaranes')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'albaranes'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Albaranes y Materiales ({albaranesDeObra.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('personal')}
          className={`pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'personal'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Personal & Horas ({operariosParticipantes.length})
        </button>
        
        <button
          onClick={() => setActiveSubTab('fotos')}
          className={`pb-3 border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'fotos'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Álbum de Fotos ({todasLasFotos.length})
        </button>
      </div>

      {/* 1. Contenido Pestaña Partes */}
      {activeSubTab === 'partes' && (
        <div className="space-y-4">
          {partesDeObra.map((parte) => {
            const horasParte = (parte.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
            return (
              <div key={parte.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{parte.fecha}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                      {horasParte}h
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generatePartePDF(parte, empresa)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => shareToWhatsApp(parte, empresa)}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {parte.trabajosRealizados || 'Sin descripción de tareas'}
                </p>

                {parte.incidencias && (
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-800 text-xs font-medium">
                    ⚠️ {parte.incidencias}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Contenido Pestaña Costes y Rentabilidad Completa (Mano de Obra + Materiales) */}
      {activeSubTab === 'rentabilidad' && userRole === 'admin' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          {/* Tarjetas Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Presupuesto Adjudicado</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{presupuesto.toFixed(2)} €</div>
              <span className="text-[11px] text-slate-400">100% Contratado</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
              <span className="text-xs font-bold text-blue-700 uppercase">Coste Mano de Obra</span>
              <div className="text-2xl font-black text-blue-900 mt-1">{costeManoObraTotal.toFixed(2)} €</div>
              <span className="text-[11px] text-blue-600 font-semibold">{pctManoObra.toFixed(1)}% del presupuesto</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <span className="text-xs font-bold text-amber-700 uppercase">Gasto Materiales / Albaranes</span>
              <div className="text-2xl font-black text-amber-900 mt-1">{costeMaterialesTotal.toFixed(2)} €</div>
              <span className="text-[11px] text-amber-600 font-semibold">{pctMateriales.toFixed(1)}% del presupuesto</span>
            </div>

            <div className={`p-4 rounded-2xl border ${margenNetoEstimado >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="text-xs font-bold text-slate-600 uppercase">Margen Real Restante</span>
              <div className={`text-2xl font-black mt-1 ${margenNetoEstimado >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {margenNetoEstimado.toFixed(2)} €
              </div>
              <span className="text-[11px] font-bold text-emerald-800">
                {pctMargen.toFixed(1)}% beneficio neto
              </span>
            </div>
          </div>

          {/* Barra Gráfica de Distribución de Costes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Distribución Financiera del Presupuesto:</span>
              <span className="text-slate-500">Gasto Total Acumulado: {costeRealTotal.toFixed(2)} € ({pctGastoTotal.toFixed(1)}%)</span>
            </div>

            <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div 
                style={{ width: `${Math.min(100, pctManoObra)}%` }} 
                className="bg-blue-600 h-full transition-all"
                title={`Mano de Obra: ${costeManoObraTotal.toFixed(2)}€ (${pctManoObra.toFixed(1)}%)`}
              />
              <div 
                style={{ width: `${Math.min(100 - pctManoObra, pctMateriales)}%` }} 
                className="bg-amber-500 h-full transition-all"
                title={`Materiales: ${costeMaterialesTotal.toFixed(2)}€ (${pctMateriales.toFixed(1)}%)`}
              />
              <div 
                style={{ width: `${Math.max(0, 100 - pctGastoTotal)}%` }} 
                className="bg-emerald-500 h-full transition-all"
                title={`Margen Disponible: ${margenNetoEstimado.toFixed(2)}€ (${pctMargen.toFixed(1)}%)`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Mano de Obra: <strong>{costeManoObraTotal.toFixed(0)}€ ({pctManoObra.toFixed(1)}%)</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Materiales: <strong>{costeMaterialesTotal.toFixed(0)}€ ({pctMateriales.toFixed(1)}%)</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Margen Beneficio: <strong>{margenNetoEstimado.toFixed(0)}€ ({pctMargen.toFixed(1)}%)</strong></span>
              </div>
            </div>
          </div>

          {/* Desglose de Mano de Obra por Operario */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Desglose de Mano de Obra Imputada</span>
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Operario</th>
                    <th className="p-3">Especialidad</th>
                    <th className="p-3 text-right">Tarifa (€/h)</th>
                    <th className="p-3 text-right">Horas</th>
                    <th className="p-3 text-right">Coste Imputado (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {operariosParticipantes.map((op, i) => (
                    <tr key={i}>
                      <td className="p-3 font-bold text-slate-900">{op.nombre}</td>
                      <td className="p-3 text-slate-500">{op.especialidad || 'Operario'}</td>
                      <td className="p-3 text-right">{op.tarifa.toFixed(2)} €/h</td>
                      <td className="p-3 text-right font-bold">{op.horas} h</td>
                      <td className="p-3 text-right font-black text-brand-700">{op.coste.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desglose de Albaranes y Materiales por Proveedor */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Desglose de Albaranes de Compra en esta Obra</span>
              </h4>
              <span className="text-xs font-bold text-slate-500">
                Total Materiales: <strong className="text-slate-900">{costeMaterialesTotal.toFixed(2)} €</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Nº Albarán</th>
                    <th className="p-3 text-right">Importe (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {albaranesDeObra.map((alb, i) => (
                    <tr key={i}>
                      <td className="p-3 text-slate-500">{alb.fecha}</td>
                      <td className="p-3 font-bold text-slate-900">{alb.proveedor}</td>
                      <td className="p-3 text-slate-600">{alb.numero}</td>
                      <td className="p-3 text-right font-black text-amber-700">{alb.importe.toFixed(2)} €</td>
                    </tr>
                  ))}
                  {albaranesDeObra.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400 text-xs">
                        No hay albaranes con importe registrado para esta obra.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Contenido Pestaña Albaranes */}
      {activeSubTab === 'albaranes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold">Gasto Total en Materiales</span>
              <div className="text-xl font-black text-slate-900">{costeMaterialesTotal.toFixed(2)} €</div>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold">
              {albaranesDeObra.length} albaranes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {albaranesDeObra.map((alb, idx) => (
              <div key={alb.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{alb.proveedor}</span>
                    <span className="text-emerald-700 font-extrabold text-xs px-2 py-0.5 rounded-lg bg-emerald-50">
                      {alb.importe.toFixed(2)} €
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1 mt-2">
                    <div>Nº: <strong className="text-slate-700">{alb.numero}</strong></div>
                    <div>Fecha: <strong>{alb.fecha}</strong></div>
                  </div>
                </div>

                {alb.url && (
                  <div 
                    onClick={() => setViewerModal({ isOpen: true, images: albaranesDeObra, index: idx, title: 'Albarán de Obra' })}
                    className="mt-2 aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer relative group"
                    title="Ver albarán con zoom"
                  >
                    <img src={alb.url} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>Ver con Zoom</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Contenido Pestaña Personal */}
      {activeSubTab === 'personal' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Operario</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4">Jornadas</th>
                <th className="p-4 text-right">Horas Acumuladas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {operariosParticipantes.map((op, i) => (
                <tr key={i}>
                  <td className="p-4 font-bold text-slate-900">{op.nombre}</td>
                  <td className="p-4 text-slate-500">{op.especialidad || 'Operario'}</td>
                  <td className="p-4">{op.partesCount} días</td>
                  <td className="p-4 text-right font-extrabold text-brand-600">{op.horas} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Contenido Pestaña Fotos */}
      {activeSubTab === 'fotos' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {todasLasFotos.map((foto, idx) => (
            <div 
              key={idx} 
              onClick={() => setViewerModal({ isOpen: true, images: todasLasFotos, index: idx, title: 'Fotos de Obra' })}
              className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-square border border-slate-200 group cursor-pointer"
              title="Ver foto en grande"
            >
              <img src={foto.url || foto} alt="Foto de obra" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                <span className="font-semibold">{foto.fechaParte}</span>
                {foto.caption && <span className="truncate">{foto.caption}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visor interactivo con Zoom y Rotación */}
      <ImageViewerModal
        isOpen={viewerModal.isOpen}
        images={viewerModal.images}
        initialIndex={viewerModal.index}
        title={viewerModal.title}
        onClose={() => setViewerModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
