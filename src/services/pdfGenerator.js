/**
 * Generador de Informes y Dossiers PDF Corporativos para Obra Control
 * Incluye informe individual de parte diario y Dossier Completo de Proyecto / Obra.
 */

export const generatePartePDF = (parte, empresa = {}) => {
  const totalHoras = (parte.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
  
  const fechaObj = parte.fecha ? new Date(parte.fecha) : new Date();
  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes en tu navegador para generar el PDF.');
    return;
  }

  const colorPrimario = empresa.colorPrimario || '#0269c9';

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Parte Diario - ${parte.obraNombre || 'Obra'} - ${parte.fecha}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      font-size: 12.5px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid ${colorPrimario};
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: ${colorPrimario};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.4;
    }
    .doc-badge {
      background: ${colorPrimario};
      color: #fff;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 800;
      text-align: right;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    .doc-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      text-align: right;
      text-transform: capitalize;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .summary-item label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .summary-item span {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .section {
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: ${colorPrimario};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.3px;
    }
    .section-content {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      white-space: pre-wrap;
      font-size: 12px;
      color: #334155;
      line-height: 1.5;
    }
    .incident-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 8px 12px;
      color: #92400e;
      white-space: pre-wrap;
      font-size: 12px;
    }
    table.operarios-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 11.5px;
    }
    table.operarios-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      border-bottom: 1px solid #cbd5e1;
    }
    table.operarios-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 6px;
      page-break-inside: avoid;
    }
    .image-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;
      text-align: center;
      padding: 4px;
    }
    .image-card img {
      max-width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
    }
    .image-caption {
      font-size: 10px;
      color: #64748b;
      padding: 3px 6px;
      font-weight: 500;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .sign-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #fafafa;
    }
    .sign-box img {
      max-height: 55px;
      object-fit: contain;
      margin: 0 auto;
    }
    .sign-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 9.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:${colorPrimario}; color:white; padding:10px; text-align:center; margin-bottom:14px; border-radius:6px; font-weight:600;">
    <button onclick="window.print()" style="background:white; color:${colorPrimario}; border:none; padding:7px 16px; border-radius:4px; font-weight:700; cursor:pointer; font-size:13px; margin-right:12px;">🖨️ Imprimir / Guardar en PDF</button>
    <button onclick="window.close()" style="background:transparent; color:white; border:1px solid white; padding:7px 12px; border-radius:4px; font-weight:600; cursor:pointer; font-size:13px;">Cerrar</button>
  </div>

  <div class="header">
    <div>
      <div class="company-title">${empresa.nombre || 'EMPRESA CONSTRUCTORA'}</div>
      <div class="company-info">
        ${empresa.cif ? `CIF: ${empresa.cif} | ` : ''} ${empresa.direccion || ''} ${empresa.ciudad ? `(${empresa.ciudad})` : ''}<br>
        ${empresa.telefono ? `Tel: ${empresa.telefono}` : ''} ${empresa.email ? ` | Email: ${empresa.email}` : ''}
      </div>
    </div>
    <div>
      <div class="doc-badge">PARTE DIARIO DE TRABAJO</div>
      <div class="doc-date">${fechaFormateada}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-item">
      <label>Obra / Proyecto</label>
      <span>${parte.obraNombre || 'General'}</span>
    </div>
    <div class="summary-item">
      <label>Total Horas Jornada</label>
      <span>${totalHoras} Horas</span>
    </div>
    <div class="summary-item">
      <label>Personal en Obra</label>
      <span>${(parte.operarios || []).length} Operarios</span>
    </div>
  </div>

  ${parte.geolocalizacion ? `
  <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:7px 10px; margin-bottom:14px; font-size:10.5px; color:#166534; display:flex; justify-content:space-between; align-items:center;">
    <div>
      <strong>📍 Geolocalización GPS Verificada:</strong> Lat ${parte.geolocalizacion.latitude}, Long ${parte.geolocalizacion.longitude} (Precisión: ±${parte.geolocalizacion.accuracy}m)
    </div>
    <a href="${parte.geolocalizacion.mapsUrl}" target="_blank" style="color:${colorPrimario}; font-weight:bold; text-decoration:none;">Ver en Google Maps &rarr;</a>
  </div>
  ` : ''}

  ${(parte.operarios && parte.operarios.length > 0) ? `
  <div class="section">
    <div class="section-title">👷 Personal y Horas Imputadas</div>
    <table class="operarios-table">
      <thead>
        <tr>
          <th>Operario</th>
          <th>Categoría / Especialidad</th>
          <th style="text-align:right">Horas</th>
        </tr>
      </thead>
      <tbody>
        ${parte.operarios.map(op => `
          <tr>
            <td><strong>${op.nombre}</strong></td>
            <td>${op.especialidad || 'Operario'}</td>
            <td style="text-align:right; font-weight:700;">${op.horas} h</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${parte.trabajosRealizados ? `
  <div class="section">
    <div class="section-title">🔨 Trabajos Realizados</div>
    <div class="section-content">${parte.trabajosRealizados}</div>
  </div>
  ` : ''}

  ${parte.materialesUtilizados ? `
  <div class="section">
    <div class="section-title">📦 Materiales y Maquinaria</div>
    <div class="section-content">${parte.materialesUtilizados}</div>
  </div>
  ` : ''}

  ${parte.incidencias ? `
  <div class="section">
    <div class="section-title">⚠️ Incidencias / Avisos de Obra</div>
    <div class="incident-box">${parte.incidencias}</div>
  </div>
  ` : ''}

  ${parte.observaciones ? `
  <div class="section">
    <div class="section-title">📝 Observaciones</div>
    <div class="section-content">${parte.observaciones}</div>
  </div>
  ` : ''}

  ${parte.tareasPendientes ? `
  <div class="section">
    <div class="section-title">📋 Tareas Pendientes para Siguiente Jornada</div>
    <div class="section-content">${parte.tareasPendientes}</div>
  </div>
  ` : ''}

  ${((parte.imagenes && parte.imagenes.length > 0) || (parte.albaranes && parte.albaranes.length > 0)) ? `
  <div class="section">
    <div class="section-title">📸 Registro Fotográfico y Documentos</div>
    <div class="images-grid">
      ${(parte.imagenes || []).map((img, i) => `
        <div class="image-card">
          <img src="${img.url || img}" alt="Foto de obra ${i+1}">
          <div class="image-caption">Fotografía ${i+1} ${img.caption ? `- ${img.caption}` : ''}</div>
        </div>
      `).join('')}
      ${(parte.albaranes || []).map((alb, i) => `
        <div class="image-card">
          <img src="${alb.url || alb}" alt="Albarán ${i+1}">
          <div class="image-caption">Albarán ${alb.numero ? `Nº ${alb.numero}` : `${i+1}`} ${alb.proveedor ? `(${alb.proveedor})` : ''} ${alb.importe ? `- ${alb.importe}€` : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="signatures">
    <div class="sign-box">
      <div class="sign-title">Firma del Encargado / Responsable</div>
      ${parte.firmaEncargado ? `<img src="${parte.firmaEncargado}" alt="Firma Encargado">` : '<div style="height:35px"></div>'}
      <div style="font-size:9.5px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:3px;">Conforme con los trabajos realizados</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Firma del Cliente / Dirección Facultativa</div>
      ${parte.firmaCliente ? `<img src="${parte.firmaCliente}" alt="Firma Cliente">` : '<div style="height:35px"></div>'}
      <div style="font-size:9.5px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:3px;">Visto bueno y conformidad</div>
    </div>
  </div>

  <div class="footer">
    <div>
      Documento generado por <strong>Obra Control</strong>
      ${parte.codigoVerificacion ? ` | Sello de Integridad: <strong>${parte.codigoVerificacion}</strong>` : ''}
    </div>
    <div>Página 1 de 1</div>
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Genera el Dossier Completo de una Obra en PDF (Resumen Ejecutivo, Financiero, Partes y Fotos)
 */
export const generateDossierObraPDF = ({ obra, partes = [], albaranes = [], operarios = [], empresa = {} }) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes en tu navegador para generar el Dossier.');
    return;
  }

  const colorPrimario = empresa.colorPrimario || '#0269c9';
  const fechaHoy = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  // Cálculos
  const tarifaMap = {};
  operarios.forEach(op => {
    tarifaMap[op.nombre] = parseFloat(op.costeHora) || 18.0;
  });

  let totalHoras = 0;
  let totalManoObra = 0;
  partes.forEach(p => {
    (p.operarios || []).forEach(op => {
      const h = parseFloat(op.horas) || 0;
      const t = tarifaMap[op.nombre] || 18.0;
      totalHoras += h;
      totalManoObra += h * t;
    });
  });

  const totalMateriales = albaranes.reduce((sum, a) => sum + (parseFloat(a.importe) || 0), 0);
  const presupuesto = parseFloat(obra.presupuesto) || 0;
  const costeTotal = totalManoObra + totalMateriales;
  const margenNeto = presupuesto - costeTotal;
  const rentabilidad = presupuesto > 0 ? ((margenNeto / presupuesto) * 100).toFixed(1) : 0;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Dossier de Obra - ${obra.nombre}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.45; font-size: 12px; }
    .header { border-bottom: 3px solid ${colorPrimario}; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 800; color: ${colorPrimario}; }
    .badge { background: ${colorPrimario}; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 13px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .metric { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
    .metric label { font-size: 9.5px; text-transform: uppercase; font-weight: 700; color: #64748b; }
    .metric val { display: block; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th { background: #f1f5f9; padding: 6px; text-align: left; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    td { padding: 6px; border-bottom: 1px solid #f1f5f9; }
    .sec-title { font-size: 13px; font-weight: 800; color: ${colorPrimario}; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 16px 0 8px 0; }
    .no-print { background: ${colorPrimario}; color: white; padding: 10px; text-align: center; margin-bottom: 16px; border-radius: 6px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="background:white; color:${colorPrimario}; border:none; padding:8px 16px; border-radius:4px; font-weight:700; cursor:pointer;">🖨️ Imprimir Dossier Completo</button>
  </div>

  <div class="header">
    <div>
      <div class="title">${empresa.nombre || 'EMPRESA CONSTRUCTORA'}</div>
      <div style="font-size:11px; color:#64748b; margin-top:2px;">${empresa.direccion || ''} • Tel: ${empresa.telefono || ''} • ${empresa.email || ''}</div>
    </div>
    <div style="text-align:right;">
      <div class="badge">DOSSIER INTEGRAL DE PROYECTO</div>
      <div style="font-size:11px; color:#64748b; margin-top:3px;">${fechaHoy}</div>
    </div>
  </div>

  <div class="card">
    <div style="font-size:15px; font-weight:800; color:#0f172a;">${obra.nombre} (${obra.codigo || 'S/C'})</div>
    <div style="color:#64748b; font-size:11px; margin-top:3px;">Cliente: <strong>${obra.cliente || '-'}</strong> | Ubicación: <strong>${obra.direccion || '-'}</strong> | Estado: <strong>${obra.estado.toUpperCase()} (${obra.progreso || 0}%)</strong></div>
  </div>

  <div class="grid-4">
    <div class="metric"><label>Presupuesto</label><val>${presupuesto.toFixed(2)} €</val></div>
    <div class="metric"><label>Mano de Obra (${totalHoras}h)</label><val>${totalManoObra.toFixed(2)} €</val></div>
    <div class="metric"><label>Materiales</label><val>${totalMateriales.toFixed(2)} €</val></div>
    <div class="metric" style="background:#f0fdf4; border-color:#bbf7d0;"><label style="color:#166534;">Margen Neto (${rentabilidad}%)</label><val style="color:#166534;">${margenNeto.toFixed(2)} €</val></div>
  </div>

  <div class="sec-title">📋 Historial de Partes Diarios Ejecutados (${partes.length} partes)</div>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Total Horas</th>
        <th>Trabajos Realizados</th>
        <th>Incidencias</th>
        <th>Sello / GPS</th>
      </tr>
    </thead>
    <tbody>
      ${partes.map(p => `
        <tr>
          <td><strong>${p.fecha}</strong></td>
          <td>${(p.operarios || []).reduce((s, o) => s + (parseFloat(o.horas) || 0), 0)}h</td>
          <td>${p.trabajosRealizados || '-'}</td>
          <td style="color:${p.incidencias ? '#b45309' : '#64748b'};">${p.incidencias || 'Sin incidencias'}</td>
          <td style="font-size:10px;">${p.codigoVerificacion || 'Verificado'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${albaranes.length > 0 ? `
  <div class="sec-title" style="margin-top:20px;">🧾 Albaranes y Materiales Comprados (${albaranes.length} albaranes - ${totalMateriales.toFixed(2)} €)</div>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Proveedor</th>
        <th>Nº Albarán</th>
        <th style="text-align:right;">Importe (€)</th>
      </tr>
    </thead>
    <tbody>
      ${albaranes.map(a => `
        <tr>
          <td>${a.fecha || '-'}</td>
          <td><strong>${a.proveedor}</strong></td>
          <td>${a.numero}</td>
          <td style="text-align:right; font-weight:700;">${(parseFloat(a.importe) || 0).toFixed(2)} €</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div style="margin-top:30px; border-top:1px solid #e2e8f0; padding-top:8px; font-size:10px; color:#94a3b8; display:flex; justify-content:space-between;">
    <div>Obra Control - Informe Ejecutivo y Dossier de Obra</div>
    <div>Página 1 de 1</div>
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
