import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { exportLibroCompletoExcel } from '../../services/excelExportService';
import { AVAILABLE_FREE_MODELS, testAiConnection } from '../../services/aiService';
import { 
  Settings, 
  Building2, 
  Database, 
  Download, 
  Upload, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  FolderOpen,
  FileSpreadsheet
} from 'lucide-react';

export const ConfiguracionView = () => {
  const { 
    empresa, 
    saveEmpresaConfig, 
    exportFullBackup, 
    importFullBackup,
    loadMonthDemoData,
    obras,
    operarios,
    partes,
    albaranes,
    showToast 
  } = useApp();

  const [formEmpresa, setFormEmpresa] = useState({
    nombre: '',
    cif: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    whatsappEnvio: '',
    colorPrimario: '#0269c9',
    openRouterApiKey: '',
    openRouterModel: 'google/gemini-2.0-flash-lite-preview-02-05:free'
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);

  useEffect(() => {
    if (empresa) {
      setFormEmpresa({ ...empresa });
    }
  }, [empresa]);

  const handleSubmitEmpresa = async (e) => {
    e.preventDefault();
    await saveEmpresaConfig(formEmpresa);
    showToast('Configuración guardada correctamente');
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    try {
      await testAiConnection(formEmpresa.openRouterApiKey, formEmpresa.openRouterModel);
      showToast('¡Conexión exitosa con OpenRouter AI!', 'success');
    } catch (err) {
      showToast(err.message || 'Error al conectar con OpenRouter', 'error');
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      await importFullBackup(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      {/* Cabecera */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Ajustes y Configuración de Empresa
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Personaliza los datos de cabecera de tus PDFs, copias de seguridad y datos de demostración
        </p>
      </div>

      {/* 1. SECCIÓN: DATOS DE LA EMPRESA CONSTRUCTORA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Datos Fiscales y de Contacto</h3>
            <p className="text-xs text-slate-500">Aparecerán automáticamente en los partes diarios en PDF</p>
          </div>
        </div>

        <form onSubmit={handleSubmitEmpresa} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre Comercial / Razón Social *</label>
              <input
                type="text"
                required
                value={formEmpresa.nombre || ''}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: CONSTRUCCIONES Y REFORMAS IBIZA S.L."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">CIF / NIF</label>
              <input
                type="text"
                value={formEmpresa.cif || ''}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, cif: e.target.value }))}
                placeholder="B-12345678"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Dirección Completa</label>
            <input
              type="text"
              value={formEmpresa.direccion || ''}
              onChange={(e) => setFormEmpresa(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Ej: Camí des Cubells 12, Ibiza"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono Oficina</label>
              <input
                type="tel"
                value={formEmpresa.telefono || ''}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="971 000 000"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email de Envío</label>
              <input
                type="email"
                value={formEmpresa.email || ''}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@miempresa.es"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Destino</label>
              <input
                type="tel"
                value={formEmpresa.whatsappEnvio || ''}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, whatsappEnvio: e.target.value }))}
                placeholder="+34 600 000 000"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios de Empresa</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. SECCIÓN: INTELIGENCIA ARTIFICIAL (OPENROUTER MODELOS FREE) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Inteligencia Artificial (OpenRouter Free)</h3>
              <p className="text-xs text-slate-500">Redacción técnica profesional de partes y lectura OCR de albaranes por foto</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Gratuito</span>
          </span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">API Key de OpenRouter</label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 font-bold hover:underline text-[11px]"
              >
                Obtener Clave Gratis en OpenRouter &rarr;
              </a>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formEmpresa.openRouterApiKey || ''}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, openRouterApiKey: e.target.value }))}
                placeholder="sk-or-v1-..."
                className="w-full p-3 pr-20 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-lg bg-slate-200"
              >
                {showApiKey ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tu clave se almacena de forma segura en tu navegador. Puedes crear una cuenta gratis en OpenRouter en 30 segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Modelo de IA Gratuito</label>
              <select
                value={formEmpresa.openRouterModel || 'google/gemini-2.0-flash-lite-preview-02-05:free'}
                onChange={(e) => setFormEmpresa(prev => ({ ...prev, openRouterModel: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
              >
                {AVAILABLE_FREE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleTestAiConnection}
                disabled={isTestingAi}
                className="w-full py-3 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isTestingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando conexión...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Probar Conexión IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmitEmpresa}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ajustes de IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: DATOS DE DEMOSTRACIÓN (1 MES, 4 CUADRILLAS, 4 OBRAS) */}
      <div className="bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 border border-brand-800">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/30 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demostración Comercial y Pruebas</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Cargar Histórico Realista de 1 Mes
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Genera <strong>4 Obras en Ibiza</strong> (Villa Es Cubells, Dalt Vila, Santa Gertrudis, Roca Llisa), <strong>14 Operarios con sus tarifas</strong> y <strong>80 Partes Diarios completos</strong> de las últimas 4 semanas para ver y enseñar todo el potencial de la plataforma.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={loadMonthDemoData}
            className="py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-brand-500/30 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            <span>Generar y Cargar 4 Cuadrillas y 1 Mes de Partes</span>
          </button>
        </div>
      </div>

      {/* 3. SECCIÓN: COPIAS DE SEGURIDAD & ALMACENAMIENTO */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Copias de Seguridad e Importación</h3>
            <p className="text-xs text-slate-500">Tus datos se guardan en IndexedDB local sin límite de 5MB</p>
          </div>
        </div>

        {/* Resumen de Datos Locales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Obras</span>
            <div className="text-lg font-extrabold text-slate-900">{obras.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Personal</span>
            <div className="text-lg font-extrabold text-slate-900">{operarios.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Partes Guardados</span>
            <div className="text-lg font-extrabold text-slate-900">{partes.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400">Albaranes</span>
            <div className="text-lg font-extrabold text-slate-900">{albaranes.length}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => exportLibroCompletoExcel({ obras, partes, operarios, albaranes, empresa })}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            title="Descargar libro de trabajo Excel con 4 hojas: Rentabilidad, Partes, Liquidación y Albaranes"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Libro Excel (.XLS)</span>
          </button>

          <button
            type="button"
            onClick={exportFullBackup}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Copia de Seguridad (.JSON)</span>
          </button>

          <label className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 cursor-pointer active:scale-95 transition-all">
            <Upload className="w-4 h-4 text-brand-600" />
            <span>Restaurar (.JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
