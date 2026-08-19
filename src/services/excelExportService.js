/**
 * Servicio de exportación a Excel Multi-Pestaña y CSV para Obra Control.
 * Genera libros de trabajo con múltiples hojas formateadas (SpreadsheetML)
 * compatibles al 100% con Microsoft Excel, Google Sheets, LibreOffice Calc y Apple Numbers.
 */

// Helper para descargar archivos generados
const downloadFile = (content, fileName, mimeType = 'application/vnd.ms-excel;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeXml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Genera un Libro de Trabajo Excel completo (.xls / SpreadsheetML) con 4 pestañas:
 * 1. Rentabilidad y Control de Obras
 * 2. Registro Histórico de Partes Diarios
 * 3. Liquidación y Horas de Cuadrilla
 * 4. Albaranes y Facturas de Proveedores
 */
export const exportLibroCompletoExcel = ({ obras = [], partes = [], operarios = [], albaranes = [], empresa = {} }) => {
  const tarifaMap = {};
  operarios.forEach(op => {
    const fullName = `${op.nombre} ${op.apellidos || ''}`.trim();
    tarifaMap[fullName] = parseFloat(op.costeHora) || 0;
    tarifaMap[op.nombre] = parseFloat(op.costeHora) || 0;
  });

  const fechaHoy = new Date().toLocaleDateString('es-ES');
  const empresaNombre = empresa.nombre || 'OBRA CONTROL';

  // 1. Datos Hoja 1: Rentabilidad Obras
  const obrasRows = obras.map(obra => {
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
      (p.albaranes || []).forEach(alb => {
        costeMateriales += parseFloat(alb.importe) || 0;
      });
    });

    albaranes.filter(a => a.obraId === obra.id || a.obraNombre === obra.nombre).forEach(alb => {
      costeMateriales += parseFloat(alb.importe) || 0;
    });

    const presupuesto = parseFloat(obra.presupuesto) || 0;
    const costeTotal = costeManoObra + costeMateriales;
    const margen = presupuesto - costeTotal;
    const rentabilidad = presupuesto > 0 ? ((margen / presupuesto) * 100).toFixed(1) : '0.0';

    return {
      codigo: obra.codigo || 'S/C',
      nombre: obra.nombre,
      cliente: obra.cliente || '-',
      estado: obra.estado || 'activa',
      progreso: `${obra.progreso || 0}%`,
      presupuesto,
      totalHoras,
      costeManoObra,
      costeMateriales,
      costeTotal,
      margen,
      rentabilidad: `${rentabilidad}%`
    };
  });

  // 2. Datos Hoja 2: Partes Diarios
  const partesRows = partes.map(p => {
    const totalHoras = (p.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
    const cuadrilla = (p.operarios || []).map(o => `${o.nombre} (${o.horas}h)`).join(', ');
    const gps = p.geolocalizacion ? `${p.geolocalizacion.latitude}, ${p.geolocalizacion.longitude}` : 'No registrado';
    return {
      fecha: p.fecha,
      obra: p.obraNombre || 'General',
      cuadrilla,
      totalHoras,
      trabajos: p.trabajosRealizados || '-',
      materiales: p.materialesUtilizados || '-',
      incidencias: p.incidencias || '-',
      gps,
      sello: p.codigoVerificacion || '-'
    };
  });

  // 3. Datos Hoja 3: Liquidación Cuadrilla
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
          tarifa: 18.0,
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

  const cuadrillaRows = Object.values(opMap).map(item => ({
    nombre: item.nombre,
    especialidad: item.especialidad,
    dni: item.dni,
    tarifa: item.tarifa,
    horas: item.horas,
    dias: item.dias,
    total: item.horas * item.tarifa
  }));

  // 4. Datos Hoja 4: Albaranes y Compras
  const allAlbaranesList = [];
  const seenAlbaranes = new Set();

  partes.forEach(p => {
    (p.albaranes || []).forEach((alb, idx) => {
      const id = alb.id || `${p.id}-${idx}`;
      seenAlbaranes.add(id);
      allAlbaranesList.push({
        fecha: p.fecha,
        proveedor: alb.proveedor || 'General',
        numero: alb.numero || 'S/N',
        obra: p.obraNombre || 'General',
        importe: parseFloat(alb.importe) || 0,
        origen: 'Parte Diario'
      });
    });
  });

  albaranes.forEach(alb => {
    if (!seenAlbaranes.has(alb.id)) {
      allAlbaranesList.push({
        fecha: alb.fecha || '-',
        proveedor: alb.proveedor || 'General',
        numero: alb.numero || 'S/N',
        obra: alb.obraNombre || 'General',
        importe: parseFloat(alb.importe) || 0,
        origen: 'Registro Directo'
      });
    }
  });

  // Generar XML SpreadsheetML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0269C9"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0269C9" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0354A2"/>
   </Borders>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="#,##0.00 &quot;€&quot;"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0.0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00 &quot;€&quot;"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#94A3B8"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0269C9"/>
   </Borders>
  </Style>
  <Style ss:ID="Positive">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#15803D"/>
   <NumberFormat ss:Format="#,##0.00 &quot;€&quot;"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>

 <!-- HOJA 1: RENTABILIDAD Y OBRAS -->
 <Worksheet ss:Name="Rentabilidad Obras">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="90"/>
   <Column ss:Width="200"/>
   <Column ss:Width="140"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="11" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(empresaNombre)} - INFORME DE RENTABILIDAD Y CONTROL DE COSTES (Generado: ${fechaHoy})</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Código</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nombre Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Cliente</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Estado</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Progreso</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Presupuesto</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Horas Totales</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mano Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Materiales</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Coste Real</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Margen Neto</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Rentabilidad</Data></Cell>
   </Row>
   ${obrasRows.map(o => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(o.codigo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.nombre)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.cliente)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.estado)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.progreso)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.presupuesto}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${o.totalHoras}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.costeManoObra}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.costeMateriales}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.costeTotal}</Data></Cell>
    <Cell ss:StyleID="Positive"><Data ss:Type="Number">${o.margen}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.rentabilidad)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- HOJA 2: REGISTRO DE PARTES -->
 <Worksheet ss:Name="Partes Diarios">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="80"/>
   <Column ss:Width="180"/>
   <Column ss:Width="200"/>
   <Column ss:Width="80"/>
   <Column ss:Width="250"/>
   <Column ss:Width="200"/>
   <Column ss:Width="180"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="8" ss:StyleID="Title"><Data ss:Type="String">REGISTRO CRONOLÓGICO DE PARTES DE TRABAJO</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Fecha</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Cuadrilla en Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Horas</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Trabajos Realizados</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Materiales</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Incidencias</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ubicación GPS</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Sello Seguridad</Data></Cell>
   </Row>
   ${partesRows.map(p => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(p.fecha)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.obra)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.cuadrilla)}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${p.totalHoras}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.trabajos)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.materiales)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.incidencias)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.gps)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(p.sello)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- HOJA 3: LIQUIDACIÓN CUADRILLA -->
 <Worksheet ss:Name="Liquidación Cuadrilla">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="180"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">RESUMEN DE HORAS Y LIQUIDACIÓN DE OPERARIOS</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Operario</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Especialidad / Cargo</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">DNI</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tarifa Hora</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Horas Totales</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Días Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total a Liquidar</Data></Cell>
   </Row>
   ${cuadrillaRows.map(c => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(c.nombre)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.especialidad)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.dni)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.tarifa}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${c.horas}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.dias}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.total}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- HOJA 4: ALBARANES Y MATERIALES -->
 <Worksheet ss:Name="Albaranes y Compras">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="80"/>
   <Column ss:Width="180"/>
   <Column ss:Width="120"/>
   <Column ss:Width="180"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="5" ss:StyleID="Title"><Data ss:Type="String">REGISTRO DE ALBARANES Y GASTO DE MATERIALES</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Fecha</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Proveedor</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nº Albarán</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Obra Asignada</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Importe</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Origen</Data></Cell>
   </Row>
   ${allAlbaranesList.map(a => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(a.fecha)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.proveedor)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.numero)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.obra)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${a.importe}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.origen)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  const fileName = `Libro_Control_Obras_${new Date().toISOString().split('T')[0]}.xls`;
  downloadFile(xml, fileName);
};

// Funciones CSV de compatibilidad
export const exportHorasNominaCSV = (partes = [], operarios = [], periodoLabel = 'Mes Actual') => {
  exportLibroCompletoExcel({ partes, operarios });
};

export const exportResumenObrasCostesCSV = (obras = [], partes = [], operarios = [], albaranes = []) => {
  exportLibroCompletoExcel({ obras, partes, operarios, albaranes });
};
