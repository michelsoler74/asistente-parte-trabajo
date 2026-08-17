import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportHorasNominaCSV } from '../../services/excelExportService';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Clock, 
  DollarSign, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  X, 
  Briefcase,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Download,
  Calendar
} from 'lucide-react';

export const PersonalList = () => {
  const { operarios, partes, saveOperario, deleteOperario, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('todas');
  
  // Modal de Operario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    especialidad: 'Oficial 1ª Albañilería',
    costeHora: 18.00,
    activo: true,
    notas: ''
  });

  // Modal de Exportación Excel
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPeriodo, setExportPeriodo] = useState('este-mes');

  const openNewModal = () => {
    setEditingOp({
      nombre: '',
      apellidos: '',
      dni: '',
      telefono: '',
      especialidad: 'Oficial 1ª Albañilería',
      costeHora: 18.00,
      activo: true,
      notas: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (op) => {
    setEditingOp({ ...op });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!editingOp.nombre.trim()) return;
    const ok = await saveOperario(editingOp);
    if (ok) setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    let filteredPartes = [...partes];
    let label = 'Todos los Partes';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (exportPeriodo === 'este-mes') {
      label = `Mes de ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
      filteredPartes = partes.filter(p => {
        const d = new Date(p.fecha);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    } else if (exportPeriodo === 'mes-anterior') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      label = `Mes Anterior (${prevMonth + 1}/${prevYear})`;
      filteredPartes = partes.filter(p => {
        const d = new Date(p.fecha);
        return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
      });
    }

    exportHorasNominaCSV(filteredPartes, operarios, label);
    setIsExportModalOpen(false);
    showToast('Informe de Horas y Nóminas descargado en Excel (CSV)');
  };

  const especialidadesUnicas = Array.from(new Set(operarios.map(o => o.especialidad).filter(Boolean)));

  const filteredOperarios = operarios.filter(op => {
    const fullName = `${op.nombre} ${op.apellidos || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || (op.dni || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEsp = filterEspecialidad === 'todas' || op.especialidad === filterEspecialidad;
    return matchesSearch && matchesEsp;
  });

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Personal y Cuadrillas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Directorio de trabajadores, categorías, tarifas y control de horas
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Nóminas Excel</span>
          </button>

          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Añadir Operario</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={filterEspecialidad}
            onChange={(e) => setFilterEspecialidad(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="todas">Todas las categorías</option>
            {especialidadesUnicas.map(esp => (
              <option key={esp} value={esp}>{esp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Fichas de Operarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOperarios.map((op) => {
          const fullName = `${op.nombre} ${op.apellidos || ''}`.trim();
          const totalHorasAcumuladas = partes.reduce((sum, p) => {
            const match = (p.operarios || []).find(o => o.operarioId === op.id || o.nombre === fullName || o.nombre === op.nombre);
            return sum + (match ? (parseFloat(match.horas) || 0) : 0);
          }, 0);

          const importeTotalAcumulado = (totalHorasAcumuladas * (parseFloat(op.costeHora) || 0)).toFixed(2);

          return (
            <div
              key={op.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {op.nombre.charAt(0)}{op.apellidos ? op.apellidos.charAt(0) : ''}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        {op.nombre} {op.apellidos}
                      </h3>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-semibold mt-0.5">
                        {op.especialidad || 'Operario'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(op)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {op.dni && <div>DNI: <strong className="text-slate-700">{op.dni}</strong></div>}
                  {op.telefono && (
                    <div className="flex items-center justify-between">
                      <span>Teléfono: <strong className="text-slate-700">{op.telefono}</strong></span>
                      <a
                        href={`tel:${op.telefono.replace(/\s+/g, '')}`}
                        className="p-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="Llamar"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  {op.costeHora > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Tarifa: <strong className="text-slate-800">{op.costeHora} €/h</strong></span>
                      <span className="text-emerald-700 font-bold">Total: {importeTotalAcumulado} €</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie con horas acumuladas */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Horas trabajadas:</span>
                <span className="px-3 py-1 rounded-xl bg-brand-50 text-brand-700 text-xs font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{totalHorasAcumuladas}h</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOperarios.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-base">No hay operarios registrados</h4>
          <p className="text-xs text-slate-400 mt-1">Añade a los trabajadores de tu cuadrilla para seleccionarlos en 1 toque en los partes diarios.</p>
        </div>
      )}

      {/* Modal de Exportación Excel / Nóminas */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Exportar Informe a Excel (CSV)
                </h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <label className="block font-bold text-slate-700">Seleccionar Período de Liquidación:</label>
              
              <div className="space-y-2">
                <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${exportPeriodo === 'este-mes' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="periodo"
                    value="este-mes"
                    checked={exportPeriodo === 'este-mes'}
                    onChange={(e) => setExportPeriodo(e.target.value)}
                    className="accent-emerald-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Mes Actual</div>
                    <div className="text-xs text-slate-500">Horas trabajadas durante el mes en curso</div>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${exportPeriodo === 'mes-anterior' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="periodo"
                    value="mes-anterior"
                    checked={exportPeriodo === 'mes-anterior'}
                    onChange={(e) => setExportPeriodo(e.target.value)}
                    className="accent-emerald-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Mes Anterior Completo</div>
                    <div className="text-xs text-slate-500">Ideal para cierre de nóminas mensual</div>
                  </div>
                </label>

                <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${exportPeriodo === 'todos' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="periodo"
                    value="todos"
                    checked={exportPeriodo === 'todos'}
                    onChange={(e) => setExportPeriodo(e.target.value)}
                    className="accent-emerald-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Todo el Histórico</div>
                    <div className="text-xs text-slate-500">Acumulado total de todas las obras</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Excel (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear / Editar Operario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingOp.id ? 'Editar Operario' : 'Añadir Operario a la Plantilla'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos"
                    value={editingOp.nombre}
                    onChange={(e) => setEditingOp(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    placeholder="Ej: Navarro"
                    value={editingOp.apellidos}
                    onChange={(e) => setEditingOp(prev => ({ ...prev, apellidos: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Especialidad / Categoría</label>
                <select
                  value={editingOp.especialidad}
                  onChange={(e) => setEditingOp(prev => ({ ...prev, especialidad: e.target.value }))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Encargado de Obra">Encargado de Obra</option>
                  <option value="Oficial 1ª Albañilería">Oficial 1ª Albañilería</option>
                  <option value="Oficial 2ª Albañilería">Oficial 2ª Albañilería</option>
                  <option value="Oficial Fontanero">Oficial Fontanero</option>
                  <option value="Oficial Electricista">Oficial Electricista</option>
                  <option value="Oficial Pintor">Oficial Pintor</option>
                  <option value="Peón Especialista">Peón Especialista</option>
                  <option value="Peón Ordinario">Peón Ordinario</option>
                  <option value="Subcontrata Externa">Subcontrata Externa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="600 000 000"
                    value={editingOp.telefono}
                    onChange={(e) => setEditingOp(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarifa Coste (€/h)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="18.50"
                    value={editingOp.costeHora}
                    onChange={(e) => setEditingOp(prev => ({ ...prev, costeHora: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingOp.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteOperario(editingOp.id);
                      setIsModalOpen(false);
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Eliminar
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
                    Guardar
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
