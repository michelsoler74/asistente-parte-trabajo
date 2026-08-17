import Dexie from 'dexie';
import ibizaCatalog from './ibizaCatalog.json';

export const db = new Dexie('PlataformaObrasDB');

// Definición de tablas e índices
db.version(2).stores({
  obras: '++id, codigo, nombre, cliente, estado, fechaInicio, createdAt',
  operarios: '++id, nombre, apellidos, especialidad, costeHora, activo, createdAt',
  partes: '++id, obraId, fecha, estado, createdAt',
  albaranes: '++id, obraId, parteId, proveedor, numero, fecha, createdAt',
  proveedores: '++id, nombre, categoria, telefono, direccion, web, createdAt',
  catalogoMateriales: '++id, nombre, marca, categoria, proveedor, precioSinIva, precioConIva',
  configuracion: 'key',
  borradores: 'id, updatedAt'
});

let isSeedingInProgress = false;

// Limpieza de duplicados accidentales
export const deduplicateDatabase = async () => {
  try {
    // 1. Desduplicar Obras por código/nombre
    const allObras = await db.obras.toArray();
    const seenObras = new Set();
    for (const obra of allObras) {
      const key = `${obra.codigo || ''}-${obra.nombre || ''}`.trim().toLowerCase();
      if (seenObras.has(key)) {
        await db.obras.delete(obra.id);
      } else {
        seenObras.add(key);
      }
    }

    // 2. Desduplicar Operarios por nombre completo
    const allOperarios = await db.operarios.toArray();
    const seenOperarios = new Set();
    for (const op of allOperarios) {
      const key = `${op.nombre || ''}-${op.apellidos || ''}`.trim().toLowerCase();
      if (seenOperarios.has(key)) {
        await db.operarios.delete(op.id);
      } else {
        seenOperarios.add(key);
      }
    }
  } catch (err) {
    console.warn('Error en deduplicateDatabase:', err);
  }
};

// Datos de demostración iniciales y Catálogo de Ibiza
export const initialSeedData = async () => {
  if (isSeedingInProgress) return;
  isSeedingInProgress = true;

  try {
    const isSeeded = localStorage.getItem('__obracontrol_db_seeded_v2__');
    const obrasCount = await db.obras.count();

    if (obrasCount === 0 && !isSeeded) {
      localStorage.setItem('__obracontrol_db_seeded_v2__', 'true');

      const obra1Id = await db.obras.add({
        codigo: 'OBR-2026-01',
        nombre: 'Reforma Integral Vivienda Calle Mayor',
        cliente: 'Familia González',
        direccion: 'C/ Mayor 45, 3ºB, Madrid',
        presupuesto: 48500,
        estado: 'activa',
        progreso: 45,
        fechaInicio: '2026-01-15',
        fechaFinEstimada: '2026-04-30',
        notas: 'Cambio completo de tabiquería, fontanería, electricidad y alicatados.',
        createdAt: new Date().toISOString()
      });

      const obra2Id = await db.obras.add({
        codigo: 'OBR-2026-02',
        nombre: 'Construcción Chalet Unifamiliar',
        cliente: 'Inversiones Residenciales S.L.',
        direccion: 'Avda. Los Pinos 12, Pozuelo de Alarcón',
        presupuesto: 185000,
        estado: 'activa',
        progreso: 20,
        fechaInicio: '2026-02-01',
        fechaFinEstimada: '2026-09-30',
        notas: 'Estructura terminada, comenzando cerramientos exteriores.',
        createdAt: new Date().toISOString()
      });

      await db.obras.add({
        codigo: 'OBR-2025-88',
        nombre: 'Mantenimiento & Pintura Urbanización Las Lomas',
        cliente: 'Comunidad de Propietarios Las Lomas',
        direccion: 'Camino del Río 8, Las Rozas',
        presupuesto: 12400,
        estado: 'completada',
        progreso: 100,
        fechaInicio: '2025-11-10',
        fechaFinEstimada: '2025-12-20',
        notas: 'Obra finalizada y entregada con visto bueno.',
        createdAt: new Date().toISOString()
      });

      // Operarios de ejemplo
      await db.operarios.bulkAdd([
        {
          nombre: 'Carlos',
          apellidos: 'Navarro Gómez',
          dni: '48932014A',
          telefono: '611 223 344',
          especialidad: 'Encargado de Obra',
          costeHora: 24.50,
          activo: true,
          createdAt: new Date().toISOString()
        },
        {
          nombre: 'Manuel',
          apellidos: 'Ruiz Serrano',
          dni: '51203948B',
          telefono: '622 334 455',
          especialidad: 'Oficial 1ª Albañilería',
          costeHora: 19.50,
          activo: true,
          createdAt: new Date().toISOString()
        },
        {
          nombre: 'David',
          apellidos: 'García Soler',
          dni: '09847261C',
          telefono: '633 445 566',
          especialidad: 'Oficial 2ª Fontanería y Clima',
          costeHora: 18.00,
          activo: true,
          createdAt: new Date().toISOString()
        },
        {
          nombre: 'Antonio',
          apellidos: 'Pérez Martínez',
          dni: '74619283D',
          telefono: '644 556 677',
          especialidad: 'Peón Especialista',
          costeHora: 14.50,
          activo: true,
          createdAt: new Date().toISOString()
        }
      ]);

      // Configuración inicial de empresa
      await db.configuracion.put({
        key: 'empresa',
        value: {
          nombre: 'CONSTRUCCIONES Y REFORMAS IBIZA S.L.',
          cif: 'B-87654321',
          direccion: 'C/ del Mar 18',
          ciudad: 'Ibiza (Baleares)',
          telefono: '971 000 000',
          email: 'contacto@reformasibiza.es',
          whatsappEnvio: '+34600000000',
          logo: '',
          colorPrimario: '#0269c9'
        }
      });
    }

    // 3. Sembrar Proveedores de Ibiza si no existen
    const provCount = await db.proveedores.count();
    if (provCount === 0) {
      await db.proveedores.bulkAdd([
        {
          nombre: 'Rampuixa',
          categoria: 'Almacén de Construcción, Morteros y Aislamientos',
          telefono: '971 33 00 11',
          direccion: 'Ctra. Ibiza a Santa Eulalia, km 4.5, Ibiza',
          web: 'https://www.rampuixa.com/',
          notas: 'Distribuidor Pegoland Puma, Chova, áridos, ferretería y fontanería en Ibiza.',
          createdAt: new Date().toISOString()
        },
        {
          nombre: 'Centro Ibicenco Cerámico (CIC)',
          categoria: 'Cerámica, Pavimentos, Sanitarios y Fontanería',
          telefono: '971 31 16 50',
          direccion: 'Ctra. San Antonio km 1.2, 07800 Ibiza',
          web: 'https://www.centroibicencoceramico.es/',
          notas: 'Especialistas en alicatados de gres, porcelánicos, platos de ducha y grifería.',
          createdAt: new Date().toISOString()
        },
        {
          nombre: 'Servicios Palau',
          categoria: 'Ferretería Industrial, Maquinaria y Andamios',
          telefono: '971 31 44 11',
          direccion: 'Polígono Can Bufí, Calle dels Teixidors 12, Ibiza',
          web: 'https://shop.serviciospalau.es/',
          notas: 'Herramientas Dewalt, Bellota, andamios Altrad, ropa de seguridad y EPIs.',
          createdAt: new Date().toISOString()
        }
      ]);
    }

    // 4. Sembrar Catálogo de Materiales de Ibiza (468 productos)
    const matCount = await db.catalogoMateriales.count();
    if (matCount === 0 && Array.isArray(ibizaCatalog) && ibizaCatalog.length > 0) {
      await db.catalogoMateriales.bulkAdd(ibizaCatalog);
      console.log(`📦 Catálogo de Ibiza cargado: ${ibizaCatalog.length} materiales.`);
    }

    await deduplicateDatabase();

  } finally {
    isSeedingInProgress = false;
  }
};
