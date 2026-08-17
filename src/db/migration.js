import { db } from './database';

export const migrateFromLocalStorage = async () => {
  try {
    const migrationFlag = localStorage.getItem('__migrated_to_indexeddb_v2__');
    if (migrationFlag) {
      return { migrated: false, count: 0 };
    }

    let importedCount = 0;

    // 1. Migrar partes históricos
    const legacyHistoryRaw = localStorage.getItem('partes_diarios_history');
    if (legacyHistoryRaw) {
      const historyList = JSON.parse(legacyHistoryRaw);
      if (Array.isArray(historyList) && historyList.length > 0) {
        for (const item of historyList) {
          // Buscar o crear la obra correspondiente si no existe
          const obraNombre = item.nombreTrabajo || item.obraNombre || 'Obra Histórica Sin Nombre';
          let obra = await db.obras.where('nombre').equalsIgnoreCase(obraNombre).first();
          
          if (!obra) {
            const newObraId = await db.obras.add({
              codigo: `OBR-LEGACY-${Date.now().toString().slice(-4)}`,
              nombre: obraNombre,
              cliente: 'Cliente Histórico',
              direccion: '',
              presupuesto: 0,
              estado: 'completada',
              progreso: 100,
              fechaInicio: item.fecha || new Date().toISOString().split('T')[0],
              notas: 'Importado de versión previa',
              createdAt: new Date().toISOString()
            });
            obra = { id: newObraId };
          }

          // Adaptar operarios
          const operariosFormateados = Array.isArray(item.operarios)
            ? item.operarios.map(op => ({
                nombre: typeof op === 'string' ? op : (op.nombre || ''),
                horas: typeof op === 'string' ? 8 : (parseFloat(op.horas) || 8),
                especialidad: 'Operario'
              }))
            : [];

          await db.partes.add({
            obraId: obra.id,
            obraNombre: obraNombre,
            fecha: item.fecha || new Date().toISOString().split('T')[0],
            estado: 'completado',
            operarios: operariosFormateados,
            trabajosRealizados: item.trabajosRealizados || '',
            materialesUtilizados: item.materialesUtilizados || '',
            incidencias: item.incidencias || '',
            observaciones: item.observaciones || '',
            tareasPendientes: item.tareasPendientes || '',
            imagenes: Array.isArray(item.imagenes) ? item.imagenes : [],
            albaranes: Array.isArray(item.albaranes) ? item.albaranes : [],
            firmaEncargado: item.firmaEncargado || null,
            firmaCliente: item.firmaCliente || null,
            createdAt: item.fechaCreacion || new Date().toISOString()
          });

          importedCount++;
        }
      }
    }

    // 2. Migrar configuración previa
    const legacyConfigEmail = localStorage.getItem('empresa_email');
    const legacyConfigWhatsapp = localStorage.getItem('empresa_whatsapp');
    if (legacyConfigEmail || legacyConfigWhatsapp) {
      const existingConfig = await db.configuracion.get('empresa');
      if (existingConfig) {
        await db.configuracion.put({
          key: 'empresa',
          value: {
            ...existingConfig.value,
            email: legacyConfigEmail || existingConfig.value.email,
            whatsappEnvio: legacyConfigWhatsapp || existingConfig.value.whatsappEnvio
          }
        });
      }
    }

    localStorage.setItem('__migrated_to_indexeddb_v2__', 'true');
    console.log(`✅ Migración de datos completada: ${importedCount} partes importados.`);
    return { migrated: true, count: importedCount };

  } catch (error) {
    console.error('Error durante la migración de datos:', error);
    return { migrated: false, error };
  }
};
