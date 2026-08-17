import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRight, 
  MoreVertical, 
  Edit, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  X
} from 'lucide-react';

export const ObrasList = () => {
  const { obras, partes, saveObra, deleteObra, setSelectedObraId, setCurrentTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todas');
  
  // Modal de Crear / Editar Obra
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState({
    nombre: '',
    cliente: '',
    direccion: '',
    presupuesto: '',
    estado: 'activa',
    progreso: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFinEstimada: '',
    notas: ''
  });

  const openNewModal = () => {
    setEditingObra({
      nombre: '',
      cliente: '',
      direccion: '',
      presupuesto: '',
      estado: 'activa',
      progreso: 0,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFinEstimada: '',
      notas: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (obra, e) => {
    e.stopPropagation();
    setEditingObra({ ...obra });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!editingObra.nombre.trim()) return;
    const ok = await saveObra(editingObra);
    if (ok) setIsModalOpen(false);
  };

  const filteredObras = obras.filter(obra => {
    const matchesSearch = 
      (obra.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (obra.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (obra.direccion || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'todas' || obra.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Obras y Proyectos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de obras en curso, avance y partes vinculados
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Obra</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de obra, cliente o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="todas">Todos los estados</option>
            <option value="activa">En curso / Activas</option>
            <option value="pausada">Pausadas</option>
            <option value="completada">Completadas</option>
          </select>
        </div>
      </div>

      {/* Grid de Obras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredObras.map((obra) => {
          const partesDeEstaObra = partes.filter(p => p.obraId === obra.id || p.obraNombre === obra.nombre);
          const totalHorasObra = partesDeEstaObra.reduce((sum, p) => {
            return sum + (p.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
          }, 0);

          const getBadgeStatus = (estado) => {
            switch (estado) {
              case 'activa':
                return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">En curso</span>;
              case 'pausada':
                return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">Pausada</span>;
              case 'completada':
                return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">Completada</span>;
              default:
                return null;
            }
          };

          return (
            <div
              key={obra.id}
              onClick={() => {
                setSelectedObraId(obra.id);
                setCurrentTab('obra-detalle');
              }}
              className="bg-white rounded-3xl border border-slate-200 hover:border-brand-400 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    {getBadgeStatus(obra.estado)}
                    <button
                      onClick={(e) => openEditModal(obra, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="Editar Obra"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {obra.nombre}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{obra.cliente || 'Cliente no asignado'}</span>
                  </div>
                  {obra.direccion && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{obra.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Barra de Progreso */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Avance</span>
                    <span>{obra.progreso || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${obra.progreso || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Pie de la tarjeta */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    {totalHorasObra}h
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {partesDeEstaObra.length} partes
                  </span>
                </div>

                <span className="text-brand-600 font-bold flex items-center gap-1 text-[11px] group-hover:translate-x-1 transition-transform">
                  Ver ficha <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredObras.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-base">No hay obras registradas</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Crea tu primera obra para comenzar a vincular partes diarios, horas y materiales.
          </p>
          <button
            onClick={openNewModal}
            className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-600/20"
          >
            + Nueva Obra
          </button>
        </div>
      )}

      {/* Modal de Crear / Editar Obra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingObra.id ? 'Editar Obra' : 'Nueva Obra / Proyecto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Obra *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Reforma Integral Vivienda C/ Sol 14"
                  value={editingObra.nombre}
                  onChange={(e) => setEditingObra(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente / Promotor</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez o Empresa S.L."
                    value={editingObra.cliente}
                    onChange={(e) => setEditingObra(prev => ({ ...prev, cliente: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Presupuesto (€)</label>
                  <input
                    type="number"
                    placeholder="Ej: 35000"
                    value={editingObra.presupuesto}
                    onChange={(e) => setEditingObra(prev => ({ ...prev, presupuesto: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección / Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Avda. Constitución 22, Valencia"
                  value={editingObra.direccion}
                  onChange={(e) => setEditingObra(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={editingObra.estado}
                    onChange={(e) => setEditingObra(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="activa">En curso / Activa</option>
                    <option value="pausada">Pausada</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Progreso Estimado ({editingObra.progreso}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingObra.progreso}
                    onChange={(e) => setEditingObra(prev => ({ ...prev, progreso: parseInt(e.target.value) || 0 }))}
                    className="w-full mt-3"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Alcance de Obra</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre licencias, materiales principales, etc..."
                  value={editingObra.notas}
                  onChange={(e) => setEditingObra(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingObra.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteObra(editingObra.id);
                      setIsModalOpen(false);
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Eliminar Obra
                  </button>
                ) : <div></div>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20"
                  >
                    Guardar Obra
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
