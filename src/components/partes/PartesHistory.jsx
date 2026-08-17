import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generatePartePDF } from '../../services/pdfGenerator';
import { shareToWhatsApp, shareToEmail } from '../../services/shareService';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  Printer, 
  Share2, 
  Mail, 
  Edit, 
  Trash2, 
  Plus, 
  Building2,
  Camera,
  Receipt,
  AlertTriangle
} from 'lucide-react';

export const PartesHistory = () => {
  const { partes, deleteParte, setEditingParteId, setCurrentTab, empresa } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterObra, setFilterObra] = useState('todas');

  // Extraer lista única de obras
  const uniqueObras = Array.from(new Set(partes.map(p => p.obraNombre).filter(Boolean)));

  // Filtrado reactivo
  const filteredPartes = partes.filter(parte => {
    const matchesSearch = 
      (parte.obraNombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parte.trabajosRealizados || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parte.materialesUtilizados || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (parte.operarios || []).some(op => (op.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesObra = filterObra === 'todas' || parte.obraNombre === filterObra;

    return matchesSearch && matchesObra;
  });

  const handleEdit = (parteId) => {
    setEditingParteId(parteId);
    setCurrentTab('nuevo-parte');
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Encabezado y Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Historial de Partes Diarios
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {partes.length} partes guardados en el sistema
          </p>
        </div>

        <button
          onClick={() => {
            setEditingParteId(null);
            setCurrentTab('nuevo-parte');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Crear Nuevo Parte</span>
        </button>
      </div>

      {/* Buscador y Selector de Obra */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por obra, operario, trabajo o material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={filterObra}
            onChange={(e) => setFilterObra(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="todas">Todas las obras</option>
            {uniqueObras.map((obra) => (
              <option key={obra} value={obra}>{obra}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de Partes */}
      <div className="space-y-4">
        {filteredPartes.map((parte) => {
          const totalHoras = (parte.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
          const numFotos = (parte.imagenes || []).length;
          const numAlbaranes = (parte.albaranes || []).length;

          return (
            <div
              key={parte.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-brand-300 transition-all space-y-4"
            >
              {/* Header de la tarjeta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      {parte.obraNombre || 'Obra General'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{parte.fecha}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{totalHoras}h</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{(parte.operarios || []).length} op.</span>
                  </span>
                </div>
              </div>

              {/* Contenido descriptivo */}
              <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                {parte.trabajosRealizados && (
                  <div>
                    <span className="font-bold text-slate-900 text-xs block mb-0.5">🔨 Trabajos realizados:</span>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{parte.trabajosRealizados}</p>
                  </div>
                )}

                {parte.materialesUtilizados && (
                  <div>
                    <span className="font-bold text-slate-900 text-xs block mb-0.5">📦 Materiales:</span>
                    <p className="text-slate-600 line-clamp-1">{parte.materialesUtilizados}</p>
                  </div>
                )}

                {parte.incidencias && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Incidencia:</strong> {parte.incidencias}</span>
                  </div>
                )}
              </div>

              {/* Fotos miniaturas si existen */}
              {(numFotos > 0 || numAlbaranes > 0) && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {(parte.imagenes || []).map((img, i) => (
                    <img
                      key={i}
                      src={img.url || img}
                      alt="Foto"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ))}
                  {(parte.albaranes || []).map((alb, i) => (
                    <div key={i} className="relative shrink-0">
                      <img
                        src={alb.url || alb}
                        alt="Albarán"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 opacity-90"
                      />
                      <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/70 text-white text-[9px] rounded font-bold">ALB</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Barra de Acciones */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => generatePartePDF(parte, empresa)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => shareToWhatsApp(parte, empresa)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => shareToEmail(parte, empresa)}
                    className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-600" />
                    <span>Email</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(parte.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => deleteParte(parte.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Eliminar parte"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPartes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base">No se encontraron partes de trabajo</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'Prueba con otro término de búsqueda o filtro de obra.' : 'Crea tu primer parte diario para verlo registrado aquí.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
