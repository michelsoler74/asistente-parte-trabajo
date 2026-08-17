import { db } from './database';

export const generateFullMonthDemoData = async () => {
  try {
    // 1. Limpiar datos antiguos
    await db.obras.clear();
    await db.operarios.clear();
    await db.partes.clear();
    await db.albaranes.clear();

    // 2. Crear las 4 Obras en Ibiza
    const obra1Id = await db.obras.add({
      codigo: 'IBZ-2026-01',
      nombre: 'Villa Es Cubells - Reforma Integral de Lujo',
      cliente: 'Inversiones Cala d\'Hort S.L.',
      direccion: 'Camí des Cubells km 3, Sant Josep de sa Talaia',
      presupuesto: 145000,
      estado: 'activa',
      progreso: 65,
      fechaInicio: '2026-07-01',
      fechaFinEstimada: '2026-10-30',
      notas: 'Reforma integral de villa de 380m2. Demolición de tabiques, suelo radiante, microcemento y carpintería oculta.',
      createdAt: new Date().toISOString()
    });

    const obra2Id = await db.obras.add({
      codigo: 'IBZ-2026-02',
      nombre: 'Rehabilitación Local Comercial Dalt Vila',
      cliente: 'Grupo Gastronómico Eivissa',
      direccion: 'C/ Mayor 14, Dalt Vila, Eivissa',
      presupuesto: 62000,
      estado: 'activa',
      progreso: 80,
      fechaInicio: '2026-07-05',
      fechaFinEstimada: '2026-09-15',
      notas: 'Acondicionamiento de restaurante. Refuerzo de muros de mampostería histórica, insonorización y fontanería industrial.',
      createdAt: new Date().toISOString()
    });

    const obra3Id = await db.obras.add({
      codigo: 'IBZ-2026-03',
      nombre: 'Construcción Casa de Campo en Santa Gertrudis',
      cliente: 'Familia Ferrer Ribas',
      direccion: 'Venda de Fruitera 45, Santa Gertrudis',
      presupuesto: 280000,
      estado: 'activa',
      progreso: 35,
      fechaInicio: '2026-06-15',
      fechaFinEstimada: '2027-02-28',
      notas: 'Vivienda unifamiliar aislada estilo ibicenco moderno. Muros de carga térmicos, forjado sanitario y piscina desbordante.',
      createdAt: new Date().toISOString()
    });

    const obra4Id = await db.obras.add({
      codigo: 'IBZ-2026-04',
      nombre: 'Mantenimiento & Pintura Urbanización Roca Llisa',
      cliente: 'Comunidad de Propietarios Roca Llisa',
      direccion: 'Avda. del Golf 12, Roca Llisa, Santa Eulària',
      presupuesto: 38500,
      estado: 'activa',
      progreso: 90,
      fechaInicio: '2026-07-10',
      fechaFinEstimada: '2026-08-30',
      notas: 'Reparación de humedades en fachadas, impermeabilización de terrazas comunitarias y pintura exterior al siloxano.',
      createdAt: new Date().toISOString()
    });

    // 3. Crear las 4 Cuadrillas de Personal (14 trabajadores)
    // Cuadrilla 1: Albañilería y Estructuras (Es Cubells)
    const op1 = await db.operarios.add({
      nombre: 'Carlos',
      apellidos: 'Navarro Gómez',
      dni: '48932014A',
      telefono: '611 223 344',
      especialidad: 'Encargado de Obra',
      costeHora: 24.50,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op2 = await db.operarios.add({
      nombre: 'Manuel',
      apellidos: 'Ruiz Serrano',
      dni: '51203948B',
      telefono: '622 334 455',
      especialidad: 'Oficial 1ª Albañilería',
      costeHora: 19.50,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op3 = await db.operarios.add({
      nombre: 'Antonio',
      apellidos: 'Pérez Martínez',
      dni: '74619283D',
      telefono: '644 556 677',
      especialidad: 'Peón Especialista',
      costeHora: 14.50,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op4 = await db.operarios.add({
      nombre: 'Jordi',
      apellidos: 'Torres Marí',
      dni: '41489201E',
      telefono: '655 667 788',
      especialidad: 'Peón Ordinario',
      costeHora: 13.00,
      activo: true,
      createdAt: new Date().toISOString()
    });

    // Cuadrilla 2: Fontanería, Clima y Pladur (Dalt Vila)
    const op5 = await db.operarios.add({
      nombre: 'David',
      apellidos: 'García Soler',
      dni: '09847261C',
      telefono: '633 445 566',
      especialidad: 'Oficial Fontanería y Clima',
      costeHora: 20.00,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op6 = await db.operarios.add({
      nombre: 'Marc',
      apellidos: 'Guasch Ribas',
      dni: '46920184F',
      telefono: '666 778 899',
      especialidad: 'Oficial Pladur y Techos',
      costeHora: 19.00,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op7 = await db.operarios.add({
      nombre: 'Cristian',
      apellidos: 'Molina Soto',
      dni: '53819203G',
      telefono: '677 889 900',
      especialidad: 'Ayudante Instalador',
      costeHora: 14.00,
      activo: true,
      createdAt: new Date().toISOString()
    });

    // Cuadrilla 3: Cimentación y Encofrados (Santa Gertrudis)
    const op8 = await db.operarios.add({
      nombre: 'Vicent',
      apellidos: 'Roig Costa',
      dni: '41409283H',
      telefono: '688 990 011',
      especialidad: 'Encargado Estructurista',
      costeHora: 25.00,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op9 = await db.operarios.add({
      nombre: 'Francisco',
      apellidos: 'Javier Ramos',
      dni: '28930192J',
      telefono: '699 001 122',
      especialidad: 'Oficial Encofrador 1ª',
      costeHora: 20.50,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op10 = await db.operarios.add({
      nombre: 'Daniel',
      apellidos: 'Romero Cruz',
      dni: '71928301K',
      telefono: '600 112 233',
      especialidad: 'Oficial Ferralla',
      costeHora: 19.50,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op11 = await db.operarios.add({
      nombre: 'Bilal',
      apellidos: 'El Mansouri',
      dni: 'X8920193L',
      telefono: '611 334 455',
      especialidad: 'Peón Especialista',
      costeHora: 14.50,
      activo: true,
      createdAt: new Date().toISOString()
    });

    // Cuadrilla 4: Acabados, Pintura y Electricidad (Roca Llisa)
    const op12 = await db.operarios.add({
      nombre: 'Toni',
      apellidos: 'Cardona Ferrer',
      dni: '46901928M',
      telefono: '622 445 566',
      especialidad: 'Oficial Pintor Decorativo',
      costeHora: 19.00,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op13 = await db.operarios.add({
      nombre: 'Sergio',
      apellidos: 'Morales Cano',
      dni: '09819283N',
      telefono: '633 556 677',
      especialidad: 'Oficial Electricista',
      costeHora: 20.00,
      activo: true,
      createdAt: new Date().toISOString()
    });
    const op14 = await db.operarios.add({
      nombre: 'José Manuel',
      apellidos: 'Vega López',
      dni: '38192039P',
      telefono: '644 667 788',
      especialidad: 'Peón Pintor',
      costeHora: 13.50,
      activo: true,
      createdAt: new Date().toISOString()
    });

    // 4. Tareas diarias
    const tareasPorObra = {
      obra1: [
        'Apertura de rozas y colocación de cajas de mecanismos estancas para iluminación LED indirecta.',
        'Colocación de premarcos de puertas correderas empotradas Scrigno y aplomado con nivel láser.',
        'Tendido de suelo radiante con panel Chovapren y tubo multicapa de Rampuixa en planta baja.',
        'Alicatado de baño principal con piezas porcelánicas 120x60 de Centro Ibicenco Cerámico.',
        'Enlucido de yeso proyectado en salón y pasillos. Limpieza y desescombro de runa al camión.',
        'Impermeabilización de terraza superior con lámina G-Flex de Rampuixa y pendientes hacia sumideros.',
        'Montaje de tabiquería de yeso laminado Pladur con aislamiento acústico de lana de roca.',
        'Prueba de estanqueidad de circuitos de fontanería a 6 bares de presión. Todo correcto sin fugas.'
      ],
      obra2: [
        'Insonorización de falso techo de cocina con panel multiaislate Chovapren 1102.',
        'Montaje de colector de fontanería y tuberías de evacuación PVC serie C en zona de baños.',
        'Repicado de revestimientos antiguos de pared y consolidación de piedra caliza original de Dalt Vila.',
        'Instalación de línea eléctrica trifásica de acometida para horno de restaurante.',
        'Colocación de solera autonivelante Paviland Industrial 25 sobre malla de fibra de vidrio.',
        'Montaje de conductos de extracción de humos y salidas de ventilación con compuertas cortafuegos.'
      ],
      obra3: [
        'Encofrado de pilares y muros perimetrales de hormigón visto para planta primera.',
        'Colocación de armadura de acero corrugado B500S en vigas de forjado y zunchos de atado.',
        'Vertido y vibrado de hormigón HA-25 con bomba de 28 metros. Curado con agua.',
        'Replanteo de tabiquería exterior con bloque cerámico térmico termoarcilla de 19cm.',
        'Excavación y nivelación de solera de piscina desbordante con dumper y mini-retro.',
        'Colocación de geotextil y manta drenante HDPE huevera con tubo drenaje ranurado perimetral.'
      ],
      obra4: [
        'Montaje de andamio multidireccional Altrad de Servicios Palau en fachada norte.',
        'Saneado de fisuras en paramentos exteriores con mortero de reparación cosmética R2.',
        'Aplicación de imprimación fijadora al agua y primera mano de pintura al siloxano blanco mate.',
        'Segunda mano de pintura en terrazas y remate de petos perimetrales.',
        'Sustitución de proyectores exteriores por focos LED estancos IP65 de bajo consumo.',
        'Desmontaje de andamios, limpieza final de zonas comunitarias y entrega con visto bueno de la comunidad.'
      ]
    };

    const materialesPorObra = {
      obra1: '15 sacos Pegoland Elite Blanco Puma (Rampuixa), 6 rollos tubo multicapa 20mm, 4 cajas mecanismos Bticino.',
      obra2: '8 paneles Chovapren 1102 (Rampuixa), 12 codos PVC 90º d.40 (CIC), 4 botes adhesivo PVC.',
      obra3: '42 m3 Hormigón HA-25, 1.800 kg acero B500S, 3 rollos manta drenante HDPE huevera (Rampuixa).',
      obra4: '4 botes 15L pintura siloxano blanca (Servicios Palau), 2 sacos mortero cosmético, 8 focos LED 30W IP65.'
    };

    // Precios de albaranes representativos
    const preciosAlbaranesObra1 = [485.50, 720.00, 340.20, 890.00, 610.50, 1150.00, 420.00, 830.40, 560.00, 940.00, 670.00, 780.50, 510.00, 890.00, 630.00, 710.00, 450.00, 820.00, 690.00, 980.00];
    const preciosAlbaranesObra2 = [320.00, 450.50, 210.00, 580.00, 390.40, 670.00, 280.00, 490.50, 310.00, 540.00, 290.00, 460.00, 370.50, 520.00, 340.00, 480.00, 260.00, 510.00, 390.00, 590.00];
    const preciosAlbaranesObra3 = [1650.00, 2200.00, 1450.00, 2800.00, 1950.00, 2400.00, 1300.00, 2100.00, 1750.00, 2600.00, 1500.00, 2300.00, 1850.00, 2500.00, 1600.00, 2250.00, 1400.00, 2150.00, 1700.00, 2700.00];
    const preciosAlbaranesObra4 = [220.00, 310.50, 180.00, 420.00, 250.00, 380.00, 190.00, 340.50, 210.00, 360.00, 170.00, 320.00, 240.00, 390.00, 200.00, 350.00, 160.00, 310.00, 230.00, 410.00];

    // 5. Generar 20 días laborables de lunes a viernes en el último mes
    const hoy = new Date();
    const fechasLaborables = [];
    let d = new Date(hoy);
    d.setDate(d.getDate() - 28);

    while (fechasLaborables.length < 20) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        fechasLaborables.push(new Date(d).toISOString().split('T')[0]);
      }
      d.setDate(d.getDate() + 1);
    }

    // 6. Generar partes y albaranes con importes reales
    const partesGenerados = [];

    // Obra 1 (Villa Es Cubells)
    fechasLaborables.forEach((fecha, idx) => {
      const tarea = tareasPorObra.obra1[idx % tareasPorObra.obra1.length];
      const horasVar = idx % 3 === 0 ? 8.5 : 8;
      const importeAlb = preciosAlbaranesObra1[idx] || 500;

      partesGenerados.push({
        obraId: obra1Id,
        obraNombre: 'Villa Es Cubells - Reforma Integral de Lujo',
        fecha: fecha,
        estado: 'completado',
        operarios: [
          { operarioId: op1, nombre: 'Carlos Navarro Gómez', horas: horasVar, especialidad: 'Encargado de Obra' },
          { operarioId: op2, nombre: 'Manuel Ruiz Serrano', horas: horasVar, especialidad: 'Oficial 1ª Albañilería' },
          { operarioId: op3, nombre: 'Antonio Pérez Martínez', horas: horasVar, especialidad: 'Peón Especialista' },
          { operarioId: op4, nombre: 'Jordi Torres Marí', horas: horasVar, especialidad: 'Peón Ordinario' }
        ],
        trabajosRealizados: tarea,
        materialesUtilizados: materialesPorObra.obra1,
        incidencias: idx === 5 ? 'Avería puntual en compresor; sustituido en 45 min por taller de Sant Josep.' : '',
        observaciones: 'Visita de la dirección facultativa. Aprobada fase de instalaciones.',
        tareasPendientes: 'Continuar con remate de yesos y alicatado en planta superior.',
        imagenes: [],
        albaranes: [
          {
            id: `alb-demo-1-${idx}`,
            proveedor: idx % 2 === 0 ? 'Rampuixa' : 'Centro Ibicenco Cerámico (CIC)',
            numero: `RPX-2026-${1000 + idx}`,
            importe: importeAlb,
            url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22300%22 height=%22200%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%230269c9%22 font-weight=%22bold%22 font-family=%22sans-serif%22 font-size=%2216%22>Albaran Rampuixa %23' + (1000 + idx) + '</text></svg>'
          }
        ],
        firmaEncargado: null,
        firmaCliente: null,
        createdAt: new Date(fecha).toISOString()
      });
    });

    // Obra 2 (Dalt Vila)
    fechasLaborables.forEach((fecha, idx) => {
      const tarea = tareasPorObra.obra2[idx % tareasPorObra.obra2.length];
      const importeAlb = preciosAlbaranesObra2[idx] || 350;

      partesGenerados.push({
        obraId: obra2Id,
        obraNombre: 'Rehabilitación Local Comercial Dalt Vila',
        fecha: fecha,
        estado: 'completado',
        operarios: [
          { operarioId: op5, nombre: 'David García Soler', horas: 8, especialidad: 'Oficial Fontanería y Clima' },
          { operarioId: op6, nombre: 'Marc Guasch Ribas', horas: 8, especialidad: 'Oficial Pladur y Techos' },
          { operarioId: op7, nombre: 'Cristian Molina Soto', horas: 7.5, especialidad: 'Ayudante Instalador' }
        ],
        trabajosRealizados: tarea,
        materialesUtilizados: materialesPorObra.obra2,
        incidencias: idx === 12 ? 'Dificultad de acceso para descarga de material en Dalt Vila por tráfico peatonal.' : '',
        observaciones: 'Coordinación con el electricista de la contrata principal.',
        tareasPendientes: 'Conexión de cuadro secundario y pruebas de climatización.',
        imagenes: [],
        albaranes: [
          {
            id: `alb-demo-2-${idx}`,
            proveedor: 'Centro Ibicenco Cerámico (CIC)',
            numero: `CIC-2026-${500 + idx}`,
            importe: importeAlb,
            url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22300%22 height=%22200%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%230269c9%22 font-weight=%22bold%22 font-family=%22sans-serif%22 font-size=%2216%22>Albaran CIC %23' + (500 + idx) + '</text></svg>'
          }
        ],
        firmaEncargado: null,
        firmaCliente: null,
        createdAt: new Date(fecha).toISOString()
      });
    });

    // Obra 3 (Santa Gertrudis)
    fechasLaborables.forEach((fecha, idx) => {
      const tarea = tareasPorObra.obra3[idx % tareasPorObra.obra3.length];
      const importeAlb = preciosAlbaranesObra3[idx] || 1800;

      partesGenerados.push({
        obraId: obra3Id,
        obraNombre: 'Construcción Casa de Campo en Santa Gertrudis',
        fecha: fecha,
        estado: 'completado',
        operarios: [
          { operarioId: op8, nombre: 'Vicent Roig Costa', horas: 8, especialidad: 'Encargado Estructurista' },
          { operarioId: op9, nombre: 'Francisco Javier Ramos', horas: 8, especialidad: 'Oficial Encofrador 1ª' },
          { operarioId: op10, nombre: 'Daniel Romero Cruz', horas: 8, especialidad: 'Oficial Ferralla' },
          { operarioId: op11, nombre: 'Bilal El Mansouri', horas: 8, especialidad: 'Peón Especialista' }
        ],
        trabajosRealizados: tarea,
        materialesUtilizados: materialesPorObra.obra3,
        incidencias: idx === 8 ? 'Lluvia matinal retrasó el vertido de hormigón 2 horas; recuperado en jornada.' : '',
        observaciones: 'Revisión geotécnica favorable del terreno.',
        tareasPendientes: 'Desencofrado de laterales y curado de pilares.',
        imagenes: [],
        albaranes: [
          {
            id: `alb-demo-3-${idx}`,
            proveedor: 'Rampuixa',
            numero: `RPX-2026-${2000 + idx}`,
            importe: importeAlb,
            url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22300%22 height=%22200%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%230269c9%22 font-weight=%22bold%22 font-family=%22sans-serif%22 font-size=%2216%22>Albaran Rampuixa %23' + (2000 + idx) + '</text></svg>'
          }
        ],
        firmaEncargado: null,
        firmaCliente: null,
        createdAt: new Date(fecha).toISOString()
      });
    });

    // Obra 4 (Roca Llisa)
    fechasLaborables.forEach((fecha, idx) => {
      const tarea = tareasPorObra.obra4[idx % tareasPorObra.obra4.length];
      const importeAlb = preciosAlbaranesObra4[idx] || 250;

      partesGenerados.push({
        obraId: obra4Id,
        obraNombre: 'Mantenimiento & Pintura Urbanización Roca Llisa',
        fecha: fecha,
        estado: 'completado',
        operarios: [
          { operarioId: op12, nombre: 'Toni Cardona Ferrer', horas: 8, especialidad: 'Oficial Pintor Decorativo' },
          { operarioId: op13, nombre: 'Sergio Morales Cano', horas: 8, especialidad: 'Oficial Electricista' },
          { operarioId: op14, nombre: 'José Manuel Vega López', horas: 7.5, especialidad: 'Peón Pintor' }
        ],
        trabajosRealizados: tarea,
        materialesUtilizados: materialesPorObra.obra4,
        incidencias: '',
        observaciones: 'Visto bueno del presidente de la comunidad sobre la tonalidad del blanco.',
        tareasPendientes: 'Remates en barandillas metálicas y aplicación de esmalte antioxidante.',
        imagenes: [],
        albaranes: [
          {
            id: `alb-demo-4-${idx}`,
            proveedor: 'Servicios Palau',
            numero: `PLU-2026-${700 + idx}`,
            importe: importeAlb,
            url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22><rect width=%22300%22 height=%22200%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%230269c9%22 font-weight=%22bold%22 font-family=%22sans-serif%22 font-size=%2216%22>Albaran Palau %23' + (700 + idx) + '</text></svg>'
          }
        ],
        firmaEncargado: null,
        firmaCliente: null,
        createdAt: new Date(fecha).toISOString()
      });
    });

    // 7. Guardar en bloque los 80 partes
    await db.partes.bulkAdd(partesGenerados);

    // 8. Sincronizar tabla de albaranes con importes
    const albaranesParaTabla = [];
    partesGenerados.forEach(p => {
      p.albaranes.forEach(alb => {
        albaranesParaTabla.push({
          parteId: 0,
          obraId: p.obraId,
          obraNombre: p.obraNombre,
          numero: alb.numero,
          proveedor: alb.proveedor,
          importe: alb.importe,
          fotoUrl: alb.url,
          fecha: p.fecha,
          createdAt: p.createdAt
        });
      });
    });
    await db.albaranes.bulkAdd(albaranesParaTabla);

    console.log(`✅ Base de datos cargada con costes de mano de obra y materiales para 4 obras.`);
    return true;

  } catch (err) {
    console.error('Error generando datos demo:', err);
    return false;
  }
};
