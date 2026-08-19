/**
 * Generador de informe PDF para imprimir / guardar como PDF
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

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Parte Diario - ${parte.obraNombre || 'Obra'} - ${parte.fecha}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
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
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0269c9;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #0269c9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .doc-badge {
      background: #0269c9;
      color: #fff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 700;
      text-align: right;
      display: inline-block;
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
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
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
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      color: #0354a2;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-content {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      white-space: pre-wrap;
      font-size: 12.5px;
      color: #334155;
    }
    .incident-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 10px 14px;
      color: #92400e;
      white-space: pre-wrap;
    }
    table.operarios-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 12px;
    }
    table.operarios-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 6px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    table.operarios-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    table.operarios-table tr:last-child td {
      border-bottom: none;
    }
    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 8px;
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
      max-height: 220px;
      object-fit: cover;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
    }
    .image-caption {
      font-size: 10px;
      color: #64748b;
      padding: 4px 6px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
      page-break-inside: avoid;
    }
    .sign-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      min-height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sign-box img {
      max-height: 60px;
      object-fit: contain;
      margin: 0 auto;
    }
    .sign-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 10px;
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
  <div class="no-print" style="background:#0269c9; color:white; padding:12px; text-align:center; margin-bottom:16px; border-radius:6px; font-weight:600;">
    <button onclick="window.print()" style="background:white; color:#0269c9; border:none; padding:8px 18px; border-radius:4px; font-weight:700; cursor:pointer; font-size:14px; margin-right:12px;">🖨️ Imprimir / Guardar en PDF</button>
    <button onclick="window.close()" style="background:transparent; color:white; border:1px solid white; padding:8px 14px; border-radius:4px; font-weight:600; cursor:pointer; font-size:14px;">Cerrar</button>
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
  <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:8px 12px; margin-bottom:16px; font-size:11px; color:#166534; display:flex; justify-content:space-between; align-items:center;">
    <div>
      <strong>📍 Geolocalización GPS Verificada:</strong> Lat ${parte.geolocalizacion.latitude}, Long ${parte.geolocalizacion.longitude} (Precisión: ±${parte.geolocalizacion.accuracy}m)
    </div>
    <a href="${parte.geolocalizacion.mapsUrl}" target="_blank" style="color:#0269c9; font-weight:bold; text-decoration:none;">Ver en Google Maps &rarr;</a>
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
      ${parte.firmaEncargado ? `<img src="${parte.firmaEncargado}" alt="Firma Encargado">` : '<div style="height:40px"></div>'}
      <div style="font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:4px;">Conforme con los trabajos realizados</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Firma del Cliente / Dirección Facultativa</div>
      ${parte.firmaCliente ? `<img src="${parte.firmaCliente}" alt="Firma Cliente">` : '<div style="height:40px"></div>'}
      <div style="font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:4px;">Visto bueno y conformidad</div>
    </div>
  </div>

  <div class="footer">
    <div>
      Documento generado por <strong>Obra Control</strong>
      ${parte.codigoVerificacion ? ` | Sello Digital: <strong>${parte.codigoVerificacion}</strong>` : ''}
    </div>
    <div>Página 1 de 1</div>
  </div>

  <script>
    window.onload = function() {
      // Auto disparar diálogo de impresión tras renderizar
      setTimeout(() => {
        // window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

