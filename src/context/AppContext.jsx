import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initialSeedData } from '../db/database';
import { migrateFromLocalStorage } from '../db/migration';
import { generateFullMonthDemoData } from '../db/demoDataGenerator';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Estado de navegación y Rol de Usuario
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'nuevo-parte', 'partes-historial', 'obras', 'personal', 'materiales', 'proveedores-ibiza', 'configuracion'
  const [selectedObraId, setSelectedObraId] = useState(null);
  const [editingParteId, setEditingParteId] = useState(null);
  const [userRole, setUserRoleState] = useState(() => {
    return localStorage.getItem('__obracontrol_user_role__') || 'admin';
  });

  const setUserRole = (role) => {
    setUserRoleState(role);
    localStorage.setItem('__obracontrol_user_role__', role);
    showToast(`Modo cambiado a: ${role === 'admin' ? '🏢 Jefe de Obra / Oficina' : '👷 Operario en Campo'}`);
    if (role === 'operario' && currentTab === 'configuracion') {
      setCurrentTab('dashboard');
    }
  };
  
  // Toast de notificaciones
  const [toast, setToast] = useState(null);

  // Inicialización de BD y Migración
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initialSeedData();
        await migrateFromLocalStorage();
        setIsDbReady(true);
      } catch (err) {
        console.error('Error inicializando DB:', err);
        setIsDbReady(true);
      }
    };
    setupDatabase();
  }, []);

  // Consultas reactivas con Dexie LiveQuery
  const obras = useLiveQuery(() => db.obras.toArray(), [], []);
  const operarios = useLiveQuery(() => db.operarios.toArray(), [], []);
  const partes = useLiveQuery(() => db.partes.orderBy('fecha').reverse().toArray(), [], []);
  const albaranes = useLiveQuery(() => db.albaranes.orderBy('fecha').reverse().toArray(), [], []);
  const proveedores = useLiveQuery(() => db.proveedores.toArray(), [], []);
  const catalogoMateriales = useLiveQuery(() => db.catalogoMateriales.toArray(), [], []);
  
  const configEntry = useLiveQuery(() => db.configuracion.get('empresa'), []);
  const empresa = configEntry?.value || {
    nombre: 'CONSTRUCCIONES Y REFORMAS IBIZA S.L.',
    cif: 'B-87654321',
    direccion: 'C/ del Mar 18',
    ciudad: 'Ibiza (Baleares)',
    telefono: '971 000 000',
    email: 'contacto@reformasibiza.es',
    whatsappEnvio: '+34600000000',
    colorPrimario: '#0269c9'
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Cargar datos de demostración de 1 mes completo
  const loadMonthDemoData = async () => {
    showToast('Generando histórico de 1 mes para 4 cuadrillas...', 'info');
    const ok = await generateFullMonthDemoData();
    if (ok) {
      showToast('¡Datos demo de 1 mes cargados con éxito! (80 partes, 4 obras)');
      setCurrentTab('dashboard');
    } else {
      showToast('Error cargando datos demo', 'error');
    }
  };

  // Operaciones de Obras
  const saveObra = async (obraData) => {
    try {
      if (obraData.id) {
        await db.obras.update(obraData.id, { ...obraData, updatedAt: new Date().toISOString() });
        showToast('Obra actualizada correctamente');
      } else {
        await db.obras.add({
          ...obraData,
          codigo: obraData.codigo || `OBR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          progreso: obraData.progreso || 0,
          estado: obraData.estado || 'activa',
          createdAt: new Date().toISOString()
        });
        showToast('Nueva obra creada con éxito');
      }
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error al guardar obra', 'error');
      return false;
    }
  };

  const deleteObra = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar esta obra y desvincular sus partes?')) {
      await db.obras.delete(id);
      showToast('Obra eliminada');
      if (selectedObraId === id) setSelectedObraId(null);
    }
  };

  // Operaciones de Operarios
  const saveOperario = async (opData) => {
    try {
      if (opData.id) {
        await db.operarios.update(opData.id, opData);
        showToast('Operario actualizado');
      } else {
        await db.operarios.add({
          ...opData,
          activo: opData.activo !== undefined ? opData.activo : true,
          createdAt: new Date().toISOString()
        });
        showToast('Operario añadido a la plantilla');
      }
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error al guardar operario', 'error');
      return false;
    }
  };

  const deleteOperario = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este operario de la plantilla?')) {
      await db.operarios.delete(id);
      showToast('Operario eliminado');
    }
  };

  // Operaciones de Proveedores
  const saveProveedor = async (provData) => {
    try {
      if (provData.id) {
        await db.proveedores.update(provData.id, provData);
        showToast('Proveedor actualizado');
      } else {
        await db.proveedores.add({
          ...provData,
          createdAt: new Date().toISOString()
        });
        showToast('Proveedor añadido');
      }
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error al guardar proveedor', 'error');
      return false;
    }
  };

  const deleteProveedor = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este proveedor?')) {
      await db.proveedores.delete(id);
      showToast('Proveedor eliminado');
    }
  };

  // Operaciones de Materiales
  const saveMaterial = async (matData) => {
    try {
      if (matData.id) {
        await db.catalogoMateriales.update(matData.id, matData);
        showToast('Material actualizado');
      } else {
        await db.catalogoMateriales.add(matData);
        showToast('Material añadido al catálogo');
      }
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error al guardar material', 'error');
      return false;
    }
  };

  // Operaciones de Partes Diarios
  const saveParte = async (parteData) => {
    try {
      let parteId = parteData.id;
      if (parteId) {
        await db.partes.update(parteId, { ...parteData, updatedAt: new Date().toISOString() });
        showToast('Parte diario actualizado');
      } else {
        parteId = await db.partes.add({
          ...parteData,
          createdAt: new Date().toISOString()
        });
        showToast('Parte diario guardado con éxito');
      }

      // Si el parte incluye albaranes, registrarlos también en la tabla de albaranes
      if (parteData.albaranes && parteData.albaranes.length > 0) {
        for (const alb of parteData.albaranes) {
          if (!alb.guardadoEnTabla) {
            await db.albaranes.add({
              parteId: parteId,
              obraId: parteData.obraId,
              obraNombre: parteData.obraNombre,
              numero: alb.numero || 'S/N',
              proveedor: alb.proveedor || 'Proveedor General',
              fotoUrl: alb.url || alb,
              fecha: parteData.fecha,
              createdAt: new Date().toISOString()
            });
          }
        }
      }

      return parteId;
    } catch (e) {
      console.error(e);
      showToast('Error al guardar el parte', 'error');
      return null;
    }
  };

  const deleteParte = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este parte de trabajo?')) {
      await db.partes.delete(id);
      showToast('Parte eliminado');
    }
  };

  // Operaciones de Configuración
  const saveEmpresaConfig = async (nuevaConfig) => {
    try {
      await db.configuracion.put({
        key: 'empresa',
        value: nuevaConfig
      });
      showToast('Datos de empresa actualizados');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error al guardar configuración', 'error');
      return false;
    }
  };

  // Exportar Backup Completo a JSON
  const exportFullBackup = async () => {
    try {
      const allObras = await db.obras.toArray();
      const allOperarios = await db.operarios.toArray();
      const allPartes = await db.partes.toArray();
      const allAlbaranes = await db.albaranes.toArray();
      const allProveedores = await db.proveedores.toArray();
      const allConfig = await db.configuracion.toArray();

      const backupData = {
        version: '2.2.0',
        timestamp: new Date().toISOString(),
        obras: allObras,
        operarios: allOperarios,
        partes: allPartes,
        albaranes: allAlbaranes,
        proveedores: allProveedores,
        configuracion: allConfig
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup_obracontrol_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Copia de seguridad descargada');
    } catch (err) {
      console.error('Error exportando backup:', err);
      showToast('Error al exportar datos', 'error');
    }
  };

  // Importar Backup desde JSON
  const importFullBackup = async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.obras) await db.obras.bulkPut(data.obras);
      if (data.operarios) await db.operarios.bulkPut(data.operarios);
      if (data.partes) await db.partes.bulkPut(data.partes);
      if (data.albaranes) await db.albaranes.bulkPut(data.albaranes);
      if (data.proveedores) await db.proveedores.bulkPut(data.proveedores);
      if (data.configuracion) await db.configuracion.bulkPut(data.configuracion);
      showToast('Copia de seguridad restaurada con éxito');
      return true;
    } catch (err) {
      console.error('Error importando backup:', err);
      showToast('El archivo no es una copia de seguridad válida', 'error');
      return false;
    }
  };

  const value = {
    isDbReady,
    currentTab,
    setCurrentTab,
    selectedObraId,
    setSelectedObraId,
    editingParteId,
    setEditingParteId,
    userRole,
    setUserRole,
    obras: obras || [],
    operarios: operarios || [],
    partes: partes || [],
    albaranes: albaranes || [],
    proveedores: proveedores || [],
    catalogoMateriales: catalogoMateriales || [],
    empresa,
    toast,
    showToast,
    saveObra,
    deleteObra,
    saveOperario,
    deleteOperario,
    saveProveedor,
    deleteProveedor,
    saveMaterial,
    saveParte,
    deleteParte,
    saveEmpresaConfig,
    exportFullBackup,
    importFullBackup,
    loadMonthDemoData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
