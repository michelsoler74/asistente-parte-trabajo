/**
 * Servicio de exportación a Excel / CSV con compatibilidad total UTF-8 BOM para Microsoft Excel y Google Sheets
 */

// Descargar archivo generado
const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 1. Exportar Resumen Mensual de Horas y Nóminas de la Cuadrilla
export const exportHorasNominaCSV = (partes = [], operarios = [], periodoLabel = 'Mes Actual') => {
  const headers = ['Operario', 'Especialidad', 'DNI', 'Tarifa Hora (€)', 'Horas Totales', 'Total a Liquidar (€)', 'Días Trabajados'];
  
  const opMap = {};
  operarios.forEach(op => {
    const fullName = `${op.nombre} ${op.apellidos || ''}`.trim();
    opMap[fullName] = {
      nombre: fullName,
      especialidad: op.especialidad || 'Operario',
      dni: op.dni || '-',
      tarifa: parseFloat(op.costeHora) || 0,
      horas: 0,
      dias: 0
    };
  });

  partes.forEach(parte => {
    const operariosEnParte = new Set();
    (parte.operarios || []).forEach(op => {
      const name = op.nombre.trim();
      if (!opMap[name]) {
        opMap[name] = {
          nombre: name,
          especialidad: op.especialidad || 'Operario',
          dni: '-',
          tarifa: 0,
          horas: 0,
          dias: 0
        };
      }
      opMap[name].horas += parseFloat(op.horas) || 0;
      operariosEnParte.add(name);
    });

    operariosEnParte.forEach(name => {
      if (opMap[name]) opMap[name].dias += 1;
    });
  });

  const rows = Object.values(opMap).map(item => {
    const totalLiquidar = (item.horas * item.tarifa).toFixed(2);
    return [
      `"${item.nombre}"`,
      `"${item.especialidad}"`,
      `"${item.dni}"`,
      `"${item.tarifa.toFixed(2)} €"`,
      `"${item.horas}"`,
      `"${totalLiquidar} €"`,
      `"${item.dias}"`
    ].join(';');
  });

  const totalHorasGlobal = Object.values(opMap).reduce((s, i) => s + i.horas, 0);
  const totalImporteGlobal = Object.values(opMap).reduce((s, i) => s + (i.horas * i.tarifa), 0).toFixed(2);

  const totalRow = [
    '"TOTAL GENERAL"',
    '""',
    '""',
    '""',
    `"${totalHorasGlobal}"`,
    `"${totalImporteGlobal} €"`,
    '""'
  ].join(';');

  const csvContent = [
    `"INFORME DE HORAS Y LIQUIDACIÓN DE NÓMINAS - ${periodoLabel.toUpperCase()}"`,
    `"Fecha de generación: ${new Date().toLocaleDateString('es-ES')}"`,
    '',
    headers.join(';'),
    ...rows,
    '',
    totalRow
  ].join('\r\n');

  const fileName = `informe_horas_nominas_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, fileName);
};

// 2. Exportar Resumen Completo de Costes y Rentabilidad (Mano de Obra + Materiales)
export const exportResumenObrasCostesCSV = (obras = [], partes = [], operarios = [], albaranes = []) => {
  const headers = [
    'Código',
    'Nombre Obra',
    'Cliente',
    'Estado',
    'Progreso (%)',
    'Presupuesto (€)',
    'Horas Imputadas',
    'Coste Mano Obra (€)',
    'Gasto Materiales (€)',
    'Coste Real Total (€)',
    'Margen Real (€)',
    'Rentabilidad (%)'
  ];

  const tarifaMap = {};
  operarios.forEach(op => {
    const fullName = `${op.nombre} ${op.apellidos || ''}`.trim();
    tarifaMap[fullName] = parseFloat(op.costeHora) || 0;
    tarifaMap[op.nombre] = parseFloat(op.costeHora) || 0;
  });

  const rows = obras.map(obra => {
    const partesDeObra = partes.filter(p => p.obraId === obra.id || p.obraNombre === obra.nombre);
    
    let totalHoras = 0;
    let costeManoObra = 0;
    let costeMateriales = 0;

    partesDeObra.forEach(p => {
      (p.operarios || []).forEach(op => {
        const horas = parseFloat(op.horas) || 0;
        const tarifa = tarifaMap[op.nombre] || 18.0;
        totalHoras += horas;
        costeManoObra += horas * tarifa;
      });

      // Sumar albaranes del parte
      (p.albaranes || []).forEach(alb => {
        costeMateriales += parseFloat(alb.importe) || 0;
      });
    });

    // Sumar albaranes directos de la tabla
    albaranes.filter(a => a.obraId === obra.id || a.obraNombre === obra.nombre).forEach(alb => {
      costeMateriales += parseFloat(alb.importe) || 0;
    });

    const presupuesto = parseFloat(obra.presupuesto) || 0;
    const costeRealTotal = costeManoObra + costeMateriales;
    const margenReal = presupuesto - costeRealTotal;
    const porcentajeRentabilidad = presupuesto > 0 ? ((margenReal / presupuesto) * 100).toFixed(1) : 0;

    return [
      `"${obra.codigo || ''}"`,
      `"${obra.nombre}"`,
      `"${obra.cliente || '-'}"`,
      `"${obra.estado}"`,
      `"${obra.progreso || 0}%"`,
      `"${presupuesto.toFixed(2)} €"`,
      `"${totalHoras} h"`,
      `"${costeManoObra.toFixed(2)} €"`,
      `"${costeMateriales.toFixed(2)} €"`,
      `"${costeRealTotal.toFixed(2)} €"`,
      `"${margenReal.toFixed(2)} €"`,
      `"${porcentajeRentabilidad}%"`
    ].join(';');
  });

  const csvContent = [
    `"INFORME DE CONTROL DE COSTES Y RENTABILIDAD TOTAL (MANO DE OBRA + MATERIALES)"`,
    `"Fecha de generación: ${new Date().toLocaleDateString('es-ES')}"`,
    '',
    headers.join(';'),
    ...rows
  ].join('\r\n');

  const fileName = `informe_rentabilidad_total_obras_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, fileName);
};
