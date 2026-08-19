import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VoiceButton } from '../common/VoiceButton';
import { SignaturePad } from '../common/SignaturePad';
import { generatePartePDF } from '../../services/pdfGenerator';
import { shareToWhatsApp, shareToEmail } from '../../services/shareService';
import { compressImage, formatFileSize } from '../../services/imageCompressionService';
import { getCurrentGPSLocation } from '../../services/geoService';
import { generateVerificationStamp } from '../../services/securityStampService';
import { refinarTextoTecnicoIA, extraerDatosAlbaranIA } from '../../services/aiService';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { 
  Building2, 
  Calendar, 
  Users, 
  Hammer, 
  Package, 
  AlertTriangle, 
  CheckSquare, 
  Camera, 
  Receipt, 
  FileCheck, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Share2, 
  Printer, 
  Mail, 
  Save, 
  RotateCcw,
  Sparkles,
  UserPlus,
  Clock,
  Check,
  Search,
  Store,
  DollarSign,
  Maximize2,
  Loader2,
  MapPin,
  ShieldCheck,
  Navigation,
  ExternalLink,
  ListOrdered,
  Wand2
} from 'lucide-react';

const STEPS = [
  { id: 'obra', title: 'Obra y Fecha', icon: Building2 },
  { id: 'personal', title: 'Personal', icon: Users },
  { id: 'trabajos', title: 'Trabajos', icon: Hammer },
  { id: 'materiales', title: 'Materiales', icon: Package },
  { id: 'incidencias', title: 'Incidencias', icon: AlertTriangle },
  { id: 'tareas', title: 'Pendientes', icon: CheckSquare },
  { id: 'fotos', title: 'Fotos', icon: Camera },
  { id: 'albaranes', title: 'Albaranes', icon: Receipt },
  { id: 'resumen', title: 'Resumen & Firma', icon: FileCheck },
];

export const ParteFormWizard = () => {
  const { obras, operarios, partes, proveedores, catalogoMateriales, saveParte, editingParteId, setEditingParteId, setCurrentTab, empresa, showToast } = useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    obraId: '',
    obraNombre: '',
    fecha: new Date().toISOString().split('T')[0],
    operarios: [],
    trabajosRealizados: '',
    materialesUtilizados: '',
    incidencias: '',
    observaciones: '',
    tareasPendientes: '',
    imagenes: [],
    albaranes: [],
    firmaEncargado: null,
    firmaCliente: null,
    geolocalizacion: null,
    codigoVerificacion: '',
    timestampSello: '',
    estado: 'completado'
  });

  const [newTempOperario, setNewTempOperario] = useState({ nombre: '', especialidad: 'Operario', horas: 8 });
  const [showAddCustomWorker, setShowAddCustomWorker] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [isRefiningAI, setIsRefiningAI] = useState({ field: null, loading: false });
  const [isProcessingOcrId, setIsProcessingOcrId] = useState(null);
  const [viewerModal, setViewerModal] = useState({ isOpen: false, images: [], index: 0, title: '' });

  useEffect(() => {
    if (editingParteId) {
      const parteToEdit = partes.find(p => p.id === editingParteId);
      if (parteToEdit) {
        setFormData({ ...parteToEdit });
      }
    } else {
      if (obras.length > 0 && !formData.obraId) {
        const primeraActiva = obras.find(o => o.estado === 'activa') || obras[0];
        setFormData(prev => ({
          ...prev,
          obraId: primeraActiva.id,
          obraNombre: primeraActiva.nombre
        }));
      }
    }
  }, [editingParteId, partes, obras]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleOperarioPlantilla = (op) => {
    const exists = formData.operarios.some(o => o.operarioId === op.id || o.nombre === `${op.nombre} ${op.apellidos}`);
    if (exists) {
      setFormData(prev => ({
        ...prev,
        operarios: prev.operarios.filter(o => o.operarioId !== op.id && o.nombre !== `${op.nombre} ${op.apellidos}`)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        operarios: [
          ...prev.operarios,
          {
            operarioId: op.id,
            nombre: `${op.nombre} ${op.apellidos}`.trim(),
            especialidad: op.especialidad || 'Operario',
            horas: 8
          }
        ]
      }));
    }
  };

  const setHoursToAll = (horas) => {
    setFormData(prev => ({
      ...prev,
      operarios: prev.operarios.map(op => ({ ...op, horas }))
    }));
  };

  const updateOperarioHoras = (index, deltaOrValue) => {
    setFormData(prev => {
      const updated = [...prev.operarios];
      if (typeof deltaOrValue === 'number') {
        const current = parseFloat(updated[index].horas) || 0;
        updated[index].horas = Math.max(0, current + deltaOrValue);
      } else {
        updated[index].horas = deltaOrValue;
      }
      return { ...prev, operarios: updated };
    });
  };

  const handleAddTempOperario = () => {
    if (!newTempOperario.nombre.trim()) return;
    setFormData(prev => ({
      ...prev,
      operarios: [
        ...prev.operarios,
        {
          nombre: newTempOperario.nombre.trim(),
          especialidad: newTempOperario.especialidad.trim(),
          horas: parseFloat(newTempOperario.horas) || 8
        }
      ]
    }));
    setNewTempOperario({ nombre: '', especialidad: 'Operario', horas: 8 });
    setShowAddCustomWorker(false);
  };

  const removeOperarioFromParte = (index) => {
    setFormData(prev => ({
      ...prev,
      operarios: prev.operarios.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e, type = 'imagenes') => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsProcessingImages(true);
    showToast(`Optimizando ${files.length} foto(s)...`, 'info');

    try {
      const defaultProveedor = (proveedores && proveedores[0]?.nombre) || 'Rampuixa';
      const compressedList = [];

      for (const file of files) {
        const result = await compressImage(file, {
          maxWidth: type === 'albaranes' ? 1800 : 1600,
          quality: 0.82
        });

        compressedList.push({
          id: Date.now() + Math.random(),
          url: result.dataUrl,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          timestamp: new Date().toISOString(),
          caption: '',
          proveedor: defaultProveedor,
          numero: '',
          importe: ''
        });
      }

      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], ...compressedList]
      }));

      showToast(`¡${files.length} imagen(es) optimizada(s) y listas!`);
    } catch (err) {
      console.error('Error optimizando imágenes:', err);
      showToast('Error al procesar imágenes', 'error');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (id, type = 'imagenes') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(img => img.id !== id)
    }));
  };

  const openImageViewer = (images, index = 0, title = 'Visor de Imagen') => {
    setViewerModal({
      isOpen: true,
      images,
      index,
      title
    });
  };

  const handleCaptureGPS = async () => {
    setIsCapturingGPS(true);
    showToast('Buscando satélites GPS...', 'info');
    try {
      const loc = await getCurrentGPSLocation();
      setFormData(prev => ({
        ...prev,
        geolocalizacion: loc
      }));
      showToast(`📍 GPS Registrado con precisión ±${loc.accuracy}m`, 'success');
    } catch (err) {
      console.warn('Error GPS:', err);
      showToast(err.message || 'No se pudo obtener la ubicación GPS', 'error');
    } finally {
      setIsCapturingGPS(false);
    }
  };

  const handleRefinarTextoIA = async (field, tipo = 'trabajos') => {
    const textoActual = formData[field] || '';
    if (!textoActual.trim()) {
      showToast('Escribe o dicta algo de texto primero para que la IA lo refine', 'info');
      return;
    }

    setIsRefiningAI({ field, loading: true });
    showToast('✨ Redactando en terminología técnica con IA...', 'info');
    try {
      const textoRefinado = await refinarTextoTecnicoIA({
        textoBorrador: textoActual,
        tipo,
        empresa
      });
      setFormData(prev => ({ ...prev, [field]: textoRefinado }));
      showToast('¡Texto profesional generado con éxito!', 'success');
    } catch (err) {
      console.warn('Error refinarTextoIA:', err);
      showToast(err.message || 'Error al conectar con la IA', 'error');
    } finally {
      setIsRefiningAI({ field: null, loading: false });
    }
  };

  const handleOcrAlbaranIA = async (alb) => {
    if (!alb.url) {
      showToast('El albarán no tiene imagen válida', 'error');
      return;
    }

    setIsProcessingOcrId(alb.id);
    showToast('🔍 Analizando albarán con Visión IA...', 'info');
    try {
      const datos = await extraerDatosAlbaranIA({
        imageBase64: alb.url,
        empresa
      });

      setFormData(prev => ({
        ...prev,
        albaranes: prev.albaranes.map(a => {
          if (a.id === alb.id) {
            return {
              ...a,
              proveedor: datos.proveedor || a.proveedor,
              numero: datos.numero || a.numero,
              importe: datos.importe > 0 ? datos.importe.toFixed(2) : a.importe,
              caption: datos.conceptos || a.caption
            };
          }
          return a;
        })
      }));
      showToast(`¡Albarán extraído! (${datos.proveedor || 'OK'} - ${datos.importe || 0}€)`, 'success');
    } catch (err) {
      console.warn('Error OCR:', err);
      showToast(err.message || 'Error al leer el albarán con IA', 'error');
    } finally {
      setIsProcessingOcrId(null);
    }
  };

  const handleSave = async (redirect = true) => {
    if (!formData.obraNombre) {
      showToast('Por favor selecciona o escribe el nombre de la obra', 'error');
      setCurrentStep(0);
      return null;
    }

    let payload = { ...formData };
    if (!payload.codigoVerificacion) {
      const stamp = generateVerificationStamp(payload);
      payload = { ...payload, ...stamp };
      setFormData(payload);
    }

    const savedId = await saveParte(payload);
    if (savedId && redirect) {
      setEditingParteId(null);
      setCurrentTab('partes-historial');
    }
    return savedId;
  };

  const handleWhatsApp = async () => {
    await handleSave(false);
    await shareToWhatsApp(formData, empresa);
  };

  const handlePDF = async () => {
    await handleSave(false);
    generatePartePDF(formData, empresa);
  };

  const handleEmail = async () => {
    await handleSave(false);
    shareToEmail(formData, empresa);
  };

  const addQuickTag = (field, tagText) => {
    const current = formData[field] || '';
    const updated = current ? `${current}, ${tagText}` : tagText;
    handleFieldChange(field, updated);
  };

  const suggestedIbizaMaterials = useMemo(() => {
    if (!materialSearchQuery || materialSearchQuery.trim().length < 2) return [];
    const query = materialSearchQuery.toLowerCase();
    return catalogoMateriales
      .filter(m => (m.nombre || '').toLowerCase().includes(query) || (m.marca || '').toLowerCase().includes(query))
      .slice(0, 5);
  }, [catalogoMateriales, materialSearchQuery]);

  const totalHoras = formData.operarios.reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
  const totalAlbaranesImporte = (formData.albaranes || []).reduce((acc, alb) => acc + (parseFloat(alb.importe) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Barra de Pasos */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm sticky top-16 z-20">
        <div className="flex items-center justify-between overflow-x-auto gap-2 py-1 scrollbar-none">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 touch-manipulation ${
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 scale-105'
                    : isCompleted
                    ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : isCompleted ? 'text-brand-600' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenedor del Paso */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm min-h-[420px] flex flex-col justify-between">
        <div>
          {/* Encabezado del Paso */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                {currentStep + 1}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {STEPS[currentStep].title}
                </h3>
                <p className="text-xs text-slate-500">
                  Paso {currentStep + 1} de {STEPS.length}
                </p>
              </div>
            </div>

            {/* Total de Horas y Gasto */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>{totalHoras}h</span>
              </div>
              {totalAlbaranesImporte > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <Receipt className="w-4 h-4" />
                  <span>{totalAlbaranesImporte.toFixed(2)}€</span>
                </div>
              )}
            </div>
          </div>

          {/* PASO 0: OBRA Y FECHA */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Seleccionar Obra / Proyecto
                </label>
                {obras.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {obras.map((obra) => {
                      const isSelected = formData.obraId === obra.id || formData.obraNombre === obra.nombre;
                      return (
                        <div
                          key={obra.id}
                          onClick={() => setFormData(prev => ({ ...prev, obraId: obra.id, obraNombre: obra.nombre }))}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900">{obra.nombre}</div>
                            <div className="text-xs text-slate-500">{obra.cliente || 'Cliente sin especificar'}</div>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-brand-600 font-bold" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mb-2">No tienes obras guardadas aún.</p>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    O escribe el nombre de la obra directamente:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.obraNombre}
                      onChange={(e) => handleFieldChange('obraNombre', e.target.value)}
                      placeholder="Ej: Reforma Cocina Calle Mayor 12"
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                    />
                    <VoiceButton
                      fieldName="obraNombre"
                      currentValue={formData.obraNombre}
                      onTranscript={(t) => handleFieldChange('obraNombre', t)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Fecha de la Jornada
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleFieldChange('fecha', e.target.value)}
                  className="w-full sm:w-64 p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Geolocalización GPS de Obra */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    <span>Ubicación GPS de la Obra</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={isCapturingGPS}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      formData.geolocalizacion
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                    }`}
                  >
                    {isCapturingGPS ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Buscando GPS...</span>
                      </>
                    ) : formData.geolocalizacion ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>GPS Registrado</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Capturar GPS</span>
                      </>
                    )}
                  </button>
                </div>

                {formData.geolocalizacion ? (
                  <div className="flex flex-wrap items-center justify-between text-xs bg-white p-3 rounded-xl border border-emerald-200 text-slate-600 gap-2">
                    <div>
                      <span className="font-semibold text-slate-800">
                        Lat: {formData.geolocalizacion.latitude}, Long: {formData.geolocalizacion.longitude}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        (Precisión: ±{formData.geolocalizacion.accuracy}m)
                      </span>
                    </div>
                    <a
                      href={formData.geolocalizacion.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Ver en Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Opcional: Registra las coordenadas exactas de la obra para certificar la asistencia y firma del parte.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PASO 1: PERSONAL Y HORAS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Seleccionar Cuadrilla de la Plantilla (Toque para añadir/quitar)
                  </label>
                  {formData.operarios.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHoursToAll(8)}
                      className="text-xs text-brand-600 font-bold hover:underline"
                    >
                      ⚡ Asignar 8h a todos
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {operarios.map((op) => {
                    const isSelected = formData.operarios.some(o => o.operarioId === op.id || o.nombre === `${op.nombre} ${op.apellidos}`);
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => toggleOperarioPlantilla(op)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all active:scale-95 touch-manipulation ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        <span>{op.nombre} {op.apellidos}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'}`}>
                          {op.especialidad || 'Operario'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Operarios trabajando hoy ({formData.operarios.length})
                </label>

                {formData.operarios.map((op, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{op.nombre}</div>
                      <div className="text-xs text-slate-500">{op.especialidad}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateOperarioHoras(index, -0.5)}
                        className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={op.horas}
                        onChange={(e) => updateOperarioHoras(index, parseFloat(e.target.value) || 0)}
                        className="w-16 p-1.5 text-center font-bold bg-white border border-slate-300 rounded-lg text-sm"
                      />
                      <span className="text-xs font-semibold text-slate-600">h</span>
                      <button
                        type="button"
                        onClick={() => updateOperarioHoras(index, 0.5)}
                        className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOperarioFromParte(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                        title="Quitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                {!showAddCustomWorker ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCustomWorker(true)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Añadir operario eventual o subcontrata</span>
                  </button>
                ) : (
                  <div className="p-4 bg-brand-50/50 border border-brand-200 rounded-2xl space-y-3">
                    <div className="font-bold text-xs text-brand-900">Añadir Operario Eventual</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre y Apellidos"
                        value={newTempOperario.nombre}
                        onChange={(e) => setNewTempOperario(prev => ({ ...prev, nombre: e.target.value }))}
                        className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Especialidad (ej: Electricista)"
                        value={newTempOperario.especialidad}
                        onChange={(e) => setNewTempOperario(prev => ({ ...prev, especialidad: e.target.value }))}
                        className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Horas"
                          value={newTempOperario.horas}
                          onChange={(e) => setNewTempOperario(prev => ({ ...prev, horas: e.target.value }))}
                          className="w-20 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-center"
                        />
                        <button
                          type="button"
                          onClick={handleAddTempOperario}
                          className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 flex-1"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: TRABAJOS REALIZADOS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  ¿Qué trabajos se han realizado hoy?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRefinarTextoIA('trabajosRealizados', 'trabajos')}
                    disabled={isRefiningAI.loading}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 border border-purple-200 shadow-2xs active:scale-95 transition-all disabled:opacity-50"
                    title="Transformar texto coloquial en redacción técnica profesional con IA"
                  >
                    {isRefiningAI.loading && isRefiningAI.field === 'trabajosRealizados' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Redactando...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>✨ Mejorar con IA</span>
                      </>
                    )}
                  </button>

                  <VoiceButton
                    fieldName="trabajosRealizados"
                    currentValue={formData.trabajosRealizados}
                    onTranscript={(t) => handleFieldChange('trabajosRealizados', t)}
                  />
                </div>
              </div>

              <textarea
                rows={5}
                value={formData.trabajosRealizados}
                onChange={(e) => handleFieldChange('trabajosRealizados', e.target.value)}
                placeholder="Describe las tareas realizadas (puedes usar el botón de dictar por voz arriba)..."
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all leading-relaxed"
              />

              {/* Sugerencias de Partidas de la Obra si existen */}
              {(() => {
                const obraActual = obras.find(o => o.id === formData.obraId || o.nombre === formData.obraNombre);
                if (obraActual && obraActual.partidas && obraActual.partidas.length > 0) {
                  return (
                    <div className="p-3 bg-brand-50/50 border border-brand-200 rounded-2xl space-y-1.5">
                      <span className="text-[11px] font-bold text-brand-900 flex items-center gap-1">
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span>Partidas asignadas a esta obra (toque para añadir al texto):</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {obraActual.partidas.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addQuickTag('trabajosRealizados', `[${p.capitulo || 'Partida'}] ${p.nombre}`)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-brand-100 text-brand-800 text-xs font-semibold border border-brand-200 shadow-2xs transition-colors"
                          >
                            + {p.nombre} ({p.porcentajeAvance || 0}%)
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Sugerencias rápidas (+):</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Desescombro y limpieza', 'Apertura de rozas', 'Tabiquería pladur', 'Alicatado de paredes', 'Instalación fontanería', 'Tendido cableado', 'Enlucido de yeso', 'Pintura plástica', 'Hormigonado solera'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addQuickTag('trabajosRealizados', tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: MATERIALES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Materiales y Maquinaria Utilizada
                </label>
                <VoiceButton
                  fieldName="materialesUtilizados"
                  currentValue={formData.materialesUtilizados}
                  onTranscript={(t) => handleFieldChange('materialesUtilizados', t)}
                />
              </div>

              <textarea
                rows={4}
                value={formData.materialesUtilizados}
                onChange={(e) => handleFieldChange('materialesUtilizados', e.target.value)}
                placeholder="Ej: 10 sacos Pegoland Puma, 25m tubo PVC 50mm, 4 placas pladur..."
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all leading-relaxed"
              />

              <div className="bg-brand-50/40 p-3.5 rounded-2xl border border-brand-200 space-y-2">
                <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-brand-600" />
                  <span>Buscar en Catálogo de Ibiza (Rampuixa, CIC, Palau)</span>
                </span>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribe para buscar material (ej: pego, pvc, chova, mortero)..."
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {suggestedIbizaMaterials.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {suggestedIbizaMaterials.map(mat => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          addQuickTag('materialesUtilizados', `${mat.nombre} (${mat.proveedor})`);
                          setMaterialSearchQuery('');
                        }}
                        className="p-2 text-left bg-white hover:bg-brand-100/50 border border-slate-200 rounded-xl text-xs transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-slate-800 truncate">{mat.nombre}</span>
                        <span className="text-[10px] text-brand-700 shrink-0 font-bold">
                          {mat.precioSinIva > 0 ? `${mat.precioSinIva.toFixed(2)}€` : '+ Añadir'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: INCIDENCIAS Y OBSERVACIONES */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-700">
                    ⚠️ Incidencias o Problemas en Obra
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRefinarTextoIA('incidencias', 'incidencias')}
                      disabled={isRefiningAI.loading}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 border border-purple-200 shadow-2xs active:scale-95 transition-all disabled:opacity-50"
                      title="Redactar aviso formal de incidencia con IA"
                    >
                      {isRefiningAI.loading && isRefiningAI.field === 'incidencias' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Redactando...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>✨ Redactar con IA</span>
                        </>
                      )}
                    </button>

                    <VoiceButton
                      fieldName="incidencias"
                      currentValue={formData.incidencias}
                      onTranscript={(t) => handleFieldChange('incidencias', t)}
                    />
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={formData.incidencias}
                  onChange={(e) => handleFieldChange('incidencias', e.target.value)}
                  placeholder="Retrasos en suministros, averías, climatología adversa, modificaciones solicitadas..."
                  className="w-full p-4 bg-amber-50/50 border border-amber-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white text-amber-950 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    📝 Observaciones Generales
                  </label>
                  <VoiceButton
                    fieldName="observaciones"
                    currentValue={formData.observaciones}
                    onTranscript={(t) => handleFieldChange('observaciones', t)}
                  />
                </div>
                <textarea
                  rows={3}
                  value={formData.observaciones}
                  onChange={(e) => handleFieldChange('observaciones', e.target.value)}
                  placeholder="Visitas técnicas, acuerdos con el cliente o la dirección facultativa..."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* PASO 5: TAREAS PENDIENTES */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tareas Pendientes para la Próxima Jornada
                </label>
                <VoiceButton
                  fieldName="tareasPendientes"
                  currentValue={formData.tareasPendientes}
                  onTranscript={(t) => handleFieldChange('tareasPendientes', t)}
                />
              </div>

              <textarea
                rows={5}
                value={formData.tareasPendientes}
                onChange={(e) => handleFieldChange('tareasPendientes', e.target.value)}
                placeholder="¿Qué trabajos deben continuarse mañana? ¿Qué material se necesita pedir a Rampuixa o CIC?..."
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>
          )}

          {/* PASO 6: FOTOS */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Fotos de Avance de Obra</h4>
                  <p className="text-xs text-slate-500">Captura antes/después, avances o detalles constructivos</p>
                </div>

                <label className={`cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95 transition-all ${
                  isProcessingImages ? 'bg-slate-400 text-white cursor-wait' : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}>
                  {isProcessingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{isProcessingImages ? 'Comprimiendo...' : 'Añadir Fotos'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isProcessingImages}
                    onChange={(e) => handleImageUpload(e, 'imagenes')}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.imagenes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.imagenes.map((img, idx) => (
                    <div 
                      key={img.id} 
                      onClick={() => openImageViewer(formData.imagenes, idx, 'Fotos de Obra')}
                      className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer shadow-sm hover:shadow-md transition-all"
                    >
                      <img src={img.url} alt="Foto de obra" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
                      {/* Overlay con lupa */}
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <div className="p-2 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center gap-1 text-xs font-bold">
                          <Maximize2 className="w-4 h-4" />
                          <span>Ver</span>
                        </div>
                      </div>

                      {/* Badge de tamaño */}
                      {img.compressedSize && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-bold text-slate-200">
                          {formatFileSize(img.compressedSize)}
                        </div>
                      )}

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id, 'imagenes');
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition-all z-10"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No hay fotos añadidas en este parte</p>
                  <p className="text-[11px] text-slate-400 mt-1">Las fotos se optimizan y comprimen automáticamente sin perder calidad</p>
                </div>
              )}
            </div>
          )}

          {/* PASO 7: ALBARANES CON IMPORTE (€) Y PROVEEDORES */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Albaranes y Compras de Materiales</h4>
                  <p className="text-xs text-slate-500">Fotografía e indica el importe del albarán</p>
                </div>

                <label className={`cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95 transition-all ${
                  isProcessingImages ? 'bg-slate-400 text-white cursor-wait' : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}>
                  {isProcessingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  <span>{isProcessingImages ? 'Comprimiendo...' : 'Foto Albarán'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isProcessingImages}
                    onChange={(e) => handleImageUpload(e, 'albaranes')}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.albaranes.map((alb, idx) => (
                  <div key={alb.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 items-center hover:border-slate-300 transition-all">
                    {/* Miniatura con zoom */}
                    <div 
                      onClick={() => openImageViewer(formData.albaranes, idx, 'Albarán de Materiales')}
                      className="relative group w-20 h-20 shrink-0 cursor-pointer rounded-xl overflow-hidden border border-slate-300"
                      title="Ver albarán en grande con zoom"
                    >
                      <img src={alb.url} alt="Albarán" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      {alb.compressedSize && (
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-center text-[9px] text-slate-200 font-medium">
                          {formatFileSize(alb.compressedSize)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <select
                        value={alb.proveedor || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            albaranes: prev.albaranes.map(a => a.id === alb.id ? { ...a, proveedor: val } : a)
                          }));
                        }}
                        className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                      >
                        <option value="Rampuixa">Rampuixa Ibiza</option>
                        <option value="Centro Ibicenco Cerámico (CIC)">Centro Ibicenco Cerámico (CIC)</option>
                        <option value="Servicios Palau">Servicios Palau</option>
                        {proveedores.filter(p => !['Rampuixa', 'Centro Ibicenco Cerámico (CIC)', 'Servicios Palau'].includes(p.nombre)).map(p => (
                          <option key={p.id} value={p.nombre}>{p.nombre}</option>
                        ))}
                        <option value="Otro Proveedor">Otro Proveedor</option>
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nº Albarán"
                          value={alb.numero || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              albaranes: prev.albaranes.map(a => a.id === alb.id ? { ...a, numero: val } : a)
                            }));
                          }}
                          className="flex-1 p-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                        />

                        <input
                          type="number"
                          step="0.01"
                          placeholder="Importe (€)"
                          value={alb.importe || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              albaranes: prev.albaranes.map(a => a.id === alb.id ? { ...a, importe: val } : a)
                            }));
                          }}
                          className="w-24 p-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-right"
                        />
                      </div>

                      {/* Botón OCR con IA */}
                      <button
                        type="button"
                        onClick={() => handleOcrAlbaranIA(alb)}
                        disabled={isProcessingOcrId === alb.id}
                        className="w-full py-1 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-2xs"
                        title="Leer automáticamente proveedor, número e importe de la foto con IA"
                      >
                        {isProcessingOcrId === alb.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Leyendo datos con IA...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>🔍 Auto-Rellenar con IA</span>
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(alb.id, 'albaranes')}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                      title="Eliminar albarán"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {formData.albaranes.length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No hay albaranes registrados hoy</p>
                  <p className="text-[11px] text-slate-400 mt-1">Sube la foto del albarán para que quede archivado y vinculado a la obra</p>
                </div>
              )}
            </div>
          )}

          {/* PASO 8: RESUMEN Y FIRMAS */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-brand-950 text-white space-y-4 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-brand-300 uppercase font-bold tracking-wider">Resumen de Jornada</span>
                    <h4 className="text-lg font-extrabold text-white mt-0.5">{formData.obraNombre}</h4>
                    <p className="text-xs text-slate-400">{formData.fecha}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="px-3 py-1.5 rounded-xl bg-brand-500/30 border border-brand-400/40 text-brand-300 font-extrabold text-sm">
                      {totalHoras} Horas
                    </div>
                    {totalAlbaranesImporte > 0 && (
                      <span className="text-xs text-emerald-400 font-bold">
                        +{totalAlbaranesImporte.toFixed(2)} € materiales
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  <div>👷 Cuadrilla: <strong className="text-white">{formData.operarios.length}</strong></div>
                  <div>📸 Fotos: <strong className="text-white">{formData.imagenes.length}</strong></div>
                  <div>📄 Albaranes: <strong className="text-white">{formData.albaranes.length} ({totalAlbaranesImporte.toFixed(0)}€)</strong></div>
                  <div>⚠️ Incidencias: <strong className="text-white">{formData.incidencias ? 'Sí' : 'No'}</strong></div>
                </div>
              </div>

              {/* Sello de Seguridad y Geolocalización */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Sello de Seguridad & Trazabilidad</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {formData.codigoVerificacion || 'Se generará al guardar'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    {formData.geolocalizacion ? (
                      <div className="flex items-center gap-2">
                        <span>
                          GPS: <strong>{formData.geolocalizacion.latitude}, {formData.geolocalizacion.longitude}</strong> (±{formData.geolocalizacion.accuracy}m)
                        </span>
                        <a
                          href={formData.geolocalizacion.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 font-bold hover:underline inline-flex items-center gap-0.5 text-[11px]"
                        >
                          <span>Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">GPS no capturado aún</span>
                    )}
                  </div>

                  {!formData.geolocalizacion && (
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      disabled={isCapturingGPS}
                      className="text-brand-600 font-bold hover:underline flex items-center gap-1 self-start sm:self-auto text-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {isCapturingGPS ? 'Buscando GPS...' : 'Registrar GPS Ahora'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SignaturePad
                  title="Firma del Encargado"
                  initialSignature={formData.firmaEncargado}
                  onSave={(dataUrl) => handleFieldChange('firmaEncargado', dataUrl)}
                />
                <SignaturePad
                  title="Firma del Cliente / Dirección"
                  initialSignature={formData.firmaCliente}
                  onSave={(dataUrl) => handleFieldChange('firmaCliente', dataUrl)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <button
                  type="button"
                  onClick={handlePDF}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4 text-brand-400" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleEmail}
                  className="py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/30 active:scale-95 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar por Email</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navegación Inferior */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
          <button
            type="button"
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Guardar Borrador</span>
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-brand-600/25 active:scale-95 transition-all"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Finalizar y Guardar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Visor interactivo de pantalla completa para Fotos y Albaranes con Zoom y Rotación */}
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
