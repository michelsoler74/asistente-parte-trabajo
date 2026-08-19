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
  Maximize2,
  ListOrdered,
  CheckSquare,
  Sparkles,
  Check,
  Trash2,
  Edit3,
  X,
  SlidersHorizontal
} from 'lucide-react';

export const ObraDetalle = () => {
  const { obras, partes, operarios, albaranes, selectedObraId, setSelectedObraId, setCurrentTab, setEditingParteId, empresa, userRole, showToast, saveObra } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('partes'); // 'partes', 'partidas', 'rentabilidad', 'personal', 'albaranes', 'fotos'
  const [viewerModal, setViewerModal] = useState({ isOpen: false, images: [], index: 0, title: '' });
  const [editingPartidaModal, setEditingPartidaModal] = useState(null); // null o { id, nombre, capitulo, importePresupuestado, porcentajeAvance }

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

  // 3. Módulo de Partidas Presupuestarias y Certificaciones
  const partidasList = useMemo(() => obra.partidas || [], [obra.partidas]);

  const totalPartidasPresupuesto = useMemo(() => {
    return partidasList.reduce((sum, p) => sum + (parseFloat(p.importePresupuestado) || 0), 0);
  }, [partidasList]);

  const totalCertificadoEuros = useMemo(() => {
    return partidasList.reduce((sum, p) => {
      const imp = parseFloat(p.importePresupuestado) || 0;
      const pct = parseFloat(p.porcentajeAvance) || 0;
      return sum + (imp * pct / 100);
    }, 0);
  }, [partidasList]);

  const pctAvanceCertificado = totalPartidasPresupuesto > 0 
    ? ((totalCertificadoEuros / totalPartidasPresupuesto) * 100).toFixed(1)
    : (obra.progreso || 0);

  const handleLoadTemplatePartidas = async () => {
    const basePpto = presupuesto > 0 ? presupuesto : 50000;
    const plantilla = [
      { id: 'p1', nombre: 'Demoliciones, picados y desescombro', capitulo: '01. Derribos', importePresupuestado: Math.round(basePpto * 0.10), porcentajeAvance: 100 },
      { id: 'p2', nombre: 'Tabiquería, trasdosados de pladur y albañilería', capitulo: '02. Albañilería', importePresupuestado: Math.round(basePpto * 0.25), porcentajeAvance: 60 },
      { id: 'p3', nombre: 'Instalaciones de fontanería, sanitarios y clima', capitulo: '03. Fontanería', importePresupuestado: Math.round(basePpto * 0.20), porcentajeAvance: 40 },
      { id: 'p4', nombre: 'Instalación eléctrica, cuadro, iluminación y domótica', capitulo: '04. Electricidad', importePresupuestado: Math.round(basePpto * 0.15), porcentajeAvance: 30 },
      { id: 'p5', nombre: 'Pavimentos porcelánicos, solados y alicatados', capitulo: '05. Revestimientos', importePresupuestado: Math.round(basePpto * 0.18), porcentajeAvance: 0 },
      { id: 'p6', nombre: 'Carpintería interior, armarios, pintura y remates', capitulo: '06. Acabados', importePresupuestado: Math.round(basePpto * 0.12), porcentajeAvance: 0 }
    ];

    const avgProgreso = Math.round(plantilla.reduce((sum, p) => sum + p.porcentajeAvance, 0) / plantilla.length);
    await saveObra({
      ...obra,
      partidas: plantilla,
      progreso: avgProgreso
    });
    showToast('Plantilla estándar de 6 partidas cargada');
  };

  const handleUpdatePartidaAvance = async (partidaId, newAvance) => {
    const updated = partidasList.map(p => {
      if (p.id === partidaId) {
        return { ...p, porcentajeAvance: Math.min(100, Math.max(0, parseInt(newAvance, 10) || 0)) };
      }
      return p;
    });

    const sumPpto = updated.reduce((s, p) => s + (parseFloat(p.importePresupuestado) || 0), 0);
    const sumCert = updated.reduce((s, p) => s + ((parseFloat(p.importePresupuestado) || 0) * (p.porcentajeAvance / 100)), 0);
    const avgProgreso = sumPpto > 0 ? Math.round((sumCert / sumPpto) * 100) : 0;

    await saveObra({
      ...obra,
      partidas: updated,
      progreso: avgProgreso
    });
  };

  const handleSavePartidaModal = async (e) => {
    e.preventDefault();
    if (!editingPartidaModal.nombre) {
      showToast('Por favor escribe el nombre de la partida', 'error');
      return;
    }

    let updated;
    if (editingPartidaModal.id) {
      updated = partidasList.map(p => p.id === editingPartidaModal.id ? editingPartidaModal : p);
    } else {
      updated = [...partidasList, { ...editingPartidaModal, id: `p-${Date.now()}` }];
    }

    const sumPpto = updated.reduce((s, p) => s + (parseFloat(p.importePresupuestado) || 0), 0);
    const sumCert = updated.reduce((s, p) => s + ((parseFloat(p.importePresupuestado) || 0) * ((p.porcentajeAvance || 0) / 100)), 0);
    const avgProgreso = sumPpto > 0 ? Math.round((sumCert / sumPpto) * 100) : (obra.progreso || 0);

    await saveObra({
      ...obra,
      partidas: updated,
      progreso: avgProgreso
    });
    setEditingPartidaModal(null);
    showToast('Partida guardada correctamente');
  };

  const handleDeletePartida = async (partidaId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta partida?')) {
      const updated = partidasList.filter(p => p.id !== partidaId);
      await saveObra({
        ...obra,
        partidas: updated
      });
      showToast('Partida eliminada');
    }
  };

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

        <button
          onClick={() => setActiveSubTab('partidas')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'partidas'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Partidas y Avance ({partidasList.length})</span>
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

      {/* 2. Contenido Pestaña Partidas Presupuestarias y Certificaciones */}
      {activeSubTab === 'partidas' && (
        <div className="space-y-6">
          {/* Métricas de Avance Económico Certificado */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-brand-400 uppercase font-bold tracking-wider">Control de Certificación y Avance</span>
                <h3 className="text-lg font-black text-white mt-0.5">Avance Físico & Financiero</h3>
                <p className="text-xs text-slate-400">
                  Calculado en base a {partidasList.length} partidas presupuestarias
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadTemplatePartidas}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
                  title="Cargar 6 partidas estándar de reforma (Demoliciones, Albañilería, Fontanería, Electricidad, Pavimentos, Acabados)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plantilla Estándar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingPartidaModal({ nombre: '', capitulo: '01. General', importePresupuestado: '', porcentajeAvance: 0 })}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-600/30 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Partida</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] font-bold uppercase text-slate-400">Presupuesto Obra</span>
                <div className="text-base font-extrabold text-white mt-0.5">{presupuesto.toFixed(0)} €</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] font-bold uppercase text-slate-400">Partidas Asignadas</span>
                <div className="text-base font-extrabold text-white mt-0.5">{totalPartidasPresupuesto.toFixed(0)} €</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] font-bold uppercase text-emerald-400">Certificado Producido</span>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">{totalCertificadoEuros.toFixed(0)} €</div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] font-bold uppercase text-brand-300">Avance Ponderado</span>
                <div className="text-base font-extrabold text-brand-300 mt-0.5">{pctAvanceCertificado}%</div>
              </div>
            </div>
          </div>

          {/* Listado de Partidas */}
          <div className="space-y-3">
            {partidasList.map((partida) => {
              const importe = parseFloat(partida.importePresupuestado) || 0;
              const avance = parseInt(partida.porcentajeAvance, 10) || 0;
              const certEuros = (importe * avance) / 100;
              const isFinished = avance === 100;

              return (
                <div
                  key={partida.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition-all space-y-3 ${
                    isFinished ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {partida.capitulo && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-extrabold uppercase">
                            {partida.capitulo}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-slate-900">{partida.nombre}</h4>
                      </div>
                      <div className="text-xs text-slate-500">
                        Presupuesto: <strong className="text-slate-800">{importe.toFixed(2)} €</strong> • Producido: <strong className="text-emerald-700">{certEuros.toFixed(2)} €</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                        isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {isFinished ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{avance}%</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingPartidaModal(partida)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar partida"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePartida(partida.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Barra y Selector Rápido de % */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isFinished ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${avance}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {[0, 25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleUpdatePartidaAvance(partida.id, pct)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              avance === pct
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={avance}
                          onChange={(e) => handleUpdatePartidaAvance(partida.id, e.target.value)}
                          className="w-24 sm:w-32 accent-brand-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {partidasList.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
                <ListOrdered className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No hay partidas presupuestarias cargadas</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Desglosa la obra por capítulos para llevar un control estricto de las certificaciones de avance y el valor producido.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleLoadTemplatePartidas}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-600/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Cargar Plantilla Estándar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* Modal para Crear / Editar Partida Presupuestaria */}
      {editingPartidaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingPartidaModal.id ? 'Editar Partida' : 'Nueva Partida Presupuestaria'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPartidaModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartidaModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Partida</label>
                <input
                  type="text"
                  required
                  value={editingPartidaModal.nombre || ''}
                  onChange={(e) => setEditingPartidaModal(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Tabiquería de Pladur y Aislamientos"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capítulo / Código</label>
                  <input
                    type="text"
                    value={editingPartidaModal.capitulo || ''}
                    onChange={(e) => setEditingPartidaModal(prev => ({ ...prev, capitulo: e.target.value }))}
                    placeholder="Ej: 02. Albañilería"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Importe Presupuestado (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPartidaModal.importePresupuestado || ''}
                    onChange={(e) => setEditingPartidaModal(prev => ({ ...prev, importePresupuestado: e.target.value }))}
                    placeholder="0.00"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Porcentaje de Avance</label>
                  <span className="text-xs font-black text-brand-600">{editingPartidaModal.porcentajeAvance || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editingPartidaModal.porcentajeAvance || 0}
                  onChange={(e) => setEditingPartidaModal(prev => ({ ...prev, porcentajeAvance: parseInt(e.target.value, 10) }))}
                  className="w-full accent-brand-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPartidaModal(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
                >
                  Guardar Partida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
