import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt, 
  Search, 
  Building2, 
  Calendar, 
  Camera, 
  ExternalLink, 
  Plus, 
  Trash2, 
  X,
  FileImage,
  DollarSign,
  Store,
  FileText,
  Maximize2
} from 'lucide-react';
import { ImageViewerModal } from '../common/ImageViewerModal';

export const AlbaranesView = () => {
  const { albaranes, obras, partes, proveedores } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerModal, setViewerModal] = useState({ isOpen: false, index: 0 });
  const [filterProveedor, setFilterProveedor] = useState('todos');

  // Recopilar todos los albaranes guardados tanto en la tabla 'albaranes' como embebidos en 'partes'
  const todosLosAlbaranes = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    partes.forEach(parte => {
      (parte.albaranes || []).forEach((alb, idx) => {
        const id = alb.id || `${parte.id}-${idx}`;
        seenIds.add(id);
        list.push({
          id: id,
          url: alb.url || alb,
          numero: alb.numero || 'Sin Nº',
          proveedor: alb.proveedor || 'Proveedor General',
          obraNombre: parte.obraNombre || 'Obra General',
          obraId: parte.obraId,
          fecha: parte.fecha,
          importe: parseFloat(alb.importe) || 0,
          origen: 'Parte Diario'
        });
      });
    });

    albaranes.forEach(alb => {
      if (!seenIds.has(alb.id)) {
        list.push({
          id: alb.id,
          url: alb.fotoUrl || alb.url,
          numero: alb.numero || 'Sin Nº',
          proveedor: alb.proveedor || 'Proveedor General',
          obraNombre: alb.obraNombre || 'Obra General',
          obraId: alb.obraId,
          fecha: alb.fecha,
          importe: parseFloat(alb.importe) || 0,
          origen: 'Registro Directo'
        });
      }
    });

    return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [partes, albaranes]);

  const filteredAlbaranes = useMemo(() => {
    return todosLosAlbaranes.filter(alb => {
      const matchesSearch = 
        (alb.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alb.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alb.obraNombre || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProv = filterProveedor === 'todos' || alb.proveedor === filterProveedor;
      return matchesSearch && matchesProv;
    });
  }, [todosLosAlbaranes, searchTerm, filterProveedor]);

  const totalGastoMateriales = filteredAlbaranes.reduce((sum, a) => sum + (parseFloat(a.importe) || 0), 0);
  const proveedoresUnicos = Array.from(new Set(todosLosAlbaranes.map(a => a.proveedor).filter(Boolean)));

  const openViewer = (idx) => {
    setViewerModal({ isOpen: true, index: idx });
  };

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Albaranes y Compras de Materiales
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de albaranes de entrega, facturas simplificadas e importes por proveedor
          </p>
        </div>
      </div>

      {/* Métricas Rápidas de Gasto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Gasto Total Materiales</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalGastoMateriales.toFixed(2)} €</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Albaranes Registrados</span>
            <div className="text-2xl font-black text-brand-600 mt-0.5">{filteredAlbaranes.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Proveedores Activos</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">{proveedoresUnicos.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por proveedor (Rampuixa, CIC, Palau), nº de albarán u obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={filterProveedor}
            onChange={(e) => setFilterProveedor(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="todos">Todos los Proveedores</option>
            {proveedoresUnicos.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Albaranes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAlbaranes.map((alb, idx) => (
          <div
            key={alb.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Foto o Preview */}
              <div 
                onClick={() => openViewer(idx)}
                className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden group"
              >
                <img
                  src={alb.url}
                  alt={`Albarán ${alb.numero}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                  <Maximize2 className="w-4 h-4" />
                  <span>Ver con Zoom</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-extrabold text-sm text-slate-900 truncate">
                    {alb.proveedor}
                  </span>
                  {alb.importe > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs shrink-0">
                      {alb.importe.toFixed(2)} €
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Nº: <strong className="text-slate-700">{alb.numero}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{alb.obraNombre}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{alb.fecha}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>{alb.origen}</span>
              <button
                onClick={() => openViewer(idx)}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" /> Ampliar
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAlbaranes.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-base">No hay albaranes registrados</h4>
          <p className="text-xs text-slate-400 mt-1">Los albaranes fotografiados en los partes diarios o subidos aquí aparecerán automáticamente.</p>
        </div>
      )}

      {/* Visor interactivo con Zoom, Rotación y Descarga */}
      <ImageViewerModal
        isOpen={viewerModal.isOpen}
        images={filteredAlbaranes}
        initialIndex={viewerModal.index}
        title="Albarán de Materiales"
        onClose={() => setViewerModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

