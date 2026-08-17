import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  Search, 
  Phone, 
  ExternalLink, 
  MapPin, 
  Tag, 
  Package, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Building2,
  HardHat,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export const ProveedoresIbizaView = () => {
  const { proveedores, catalogoMateriales, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [selectedProveedor, setSelectedProveedor] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Categorías disponibles
  const categorias = useMemo(() => {
    const set = new Set(catalogoMateriales.map(m => m.categoria).filter(Boolean));
    return ['todas', ...Array.from(set)];
  }, [catalogoMateriales]);

  // Proveedores en catálogo
  const proveedoresList = useMemo(() => {
    const set = new Set(catalogoMateriales.map(m => m.proveedor).filter(Boolean));
    return ['todos', ...Array.from(set)];
  }, [catalogoMateriales]);

  // Filtrado de materiales optimizado
  const filteredMateriales = useMemo(() => {
    return catalogoMateriales.filter(item => {
      const matchSearch = 
        (item.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategoria === 'todas' || item.categoria === selectedCategoria;
      const matchProv = selectedProveedor === 'todos' || item.proveedor === selectedProveedor;

      return matchSearch && matchCat && matchProv;
    });
  }, [catalogoMateriales, searchTerm, selectedCategoria, selectedProveedor]);

  // Paginación
  const totalPages = Math.ceil(filteredMateriales.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMateriales.slice(start, start + itemsPerPage);
  }, [filteredMateriales, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCatChange = (cat) => {
    setSelectedCategoria(cat);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 pb-24 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sincronizado con Obsidian Vault</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Proveedores y Materiales en Ibiza
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Directorio de distribuidores insulares y catálogo de {catalogoMateriales.length} materiales con precios
          </p>
        </div>
      </div>

      {/* 1. SECCIÓN: PROVEEDORES PRINCIPALES DE IBIZA */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-600" />
          <span>Distribuidores y Almacenes de Confianza</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {proveedores.map((prov) => (
            <div
              key={prov.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:border-brand-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{prov.nombre}</h4>
                    <span className="text-[11px] font-semibold text-brand-600">{prov.categoria}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                    <Store className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{prov.notas}</p>

                <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prov.direccion}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${prov.telefono.replace(/\s+/g, '')}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{prov.telefono}</span>
                </a>

                {prov.web && (
                  <a
                    href={prov.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
                    title="Visitar web oficial"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SECCIÓN: CATÁLOGO DE MATERIALES Y HERRAMIENTAS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              <span>Catálogo de Materiales ({filteredMateriales.length} artículos)</span>
            </h3>
            <p className="text-xs text-slate-500">Consulta de precios de compra (Base) y PVP recomendados</p>
          </div>

          {/* Buscador */}
          <div className="relative sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar material (ej: Pegoland, PVC, Chovapren)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filtros de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCatChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-manipulation ${
                selectedCategoria === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'todas' ? 'Todas las Categorías' : cat}
            </button>
          ))}
        </div>

        {/* Grid de Artículos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {paginatedItems.map((mat) => (
            <div
              key={mat.id}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-brand-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-600 px-2 py-0.5 bg-slate-200 rounded-md">
                    {mat.categoria}
                  </span>
                  {mat.marca && mat.marca !== 'Desconocida' && (
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      {mat.marca}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                  {mat.nombre}
                </h4>

                <div className="text-[11px] text-slate-600">
                  Proveedor: <strong className="text-slate-800">{mat.proveedor}</strong>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">Precio Base</div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {mat.precioSinIva > 0 ? `${mat.precioSinIva.toFixed(2)} €` : 'Consultar'}
                  </div>
                </div>

                {mat.precioConIva > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-600 uppercase font-semibold">PVP (con IVA)</div>
                    <div className="text-xs font-bold text-emerald-700">
                      {mat.precioConIva.toFixed(2)} €
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMateriales.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No se encontraron materiales con los filtros aplicados.
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
            <div>
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredMateriales.length)} de {filteredMateriales.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold px-2">Página {currentPage} de {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
