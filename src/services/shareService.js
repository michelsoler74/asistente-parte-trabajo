/**
 * Servicio para formatear y compartir partes de trabajo por WhatsApp, Email o Portapapeles
 */

export const generateWhatsAppText = (parte, empresa = {}) => {
  const totalHoras = (parte.operarios || []).reduce((acc, op) => acc + (parseFloat(op.horas) || 0), 0);
  
  const fechaFormateada = parte.fecha 
    ? new Date(parte.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('es-ES');

  let text = `📋 *PARTE DIARIO DE TRABAJO*\n`;
  if (empresa.nombre) text += `🏢 *${empresa.nombre}*\n`;
  text += `───────────────────────\n`;
  text += `🏗️ *Obra / Proyecto:* ${parte.obraNombre || 'Obra General'}\n`;
  text += `📅 *Fecha:* ${fechaFormateada}\n`;
  text += `⏰ *Total Horas:* ${totalHoras}h  |  👷 *Operarios:* ${(parte.operarios || []).length}\n\n`;

  if (parte.operarios && parte.operarios.length > 0) {
    text += `*👥 CUADRILLA & HORAS:*\n`;
    parte.operarios.forEach((op, index) => {
      const spec = op.especialidad ? ` (${op.especialidad})` : '';
      text += `• ${op.nombre}${spec}: *${op.horas}h*\n`;
    });
    text += `\n`;
  }

  if (parte.trabajosRealizados && parte.trabajosRealizados.trim()) {
    text += `*🔧 TRABAJOS REALIZADOS:*\n${parte.trabajosRealizados.trim()}\n\n`;
  }

  if (parte.materialesUtilizados && parte.materialesUtilizados.trim()) {
    text += `*📦 MATERIALES EMPLEADOS:*\n${parte.materialesUtilizados.trim()}\n\n`;
  }

  if (parte.incidencias && parte.incidencias.trim()) {
    text += `*⚠️ INCIDENCIAS / AVISOS:*\n${parte.incidencias.trim()}\n\n`;
  }

  if (parte.observaciones && parte.observaciones.trim()) {
    text += `*📝 OBSERVACIONES:*\n${parte.observaciones.trim()}\n\n`;
  }

  if (parte.tareasPendientes && parte.tareasPendientes.trim()) {
    text += `*📋 TAREAS PENDIENTES PRÓXIMO DÍA:*\n${parte.tareasPendientes.trim()}\n\n`;
  }

  if (parte.geolocalizacion && parte.geolocalizacion.mapsUrl) {
    text += `📍 *Ubicación GPS Obra:* ${parte.geolocalizacion.mapsUrl}\n\n`;
  }

  const numFotos = (parte.imagenes || []).length;
  const numAlbaranes = (parte.albaranes || []).length;
  if (numFotos > 0 || numAlbaranes > 0) {
    text += `📎 *Adjuntos registrados:* 📸 ${numFotos} fotos | 📄 ${numAlbaranes} albaranes\n`;
  }

  if (parte.codigoVerificacion) {
    text += `🛡️ *Sello Digital:* ${parte.codigoVerificacion}\n`;
  }

  text += `\n_Generado automáticamente desde Obra Control_`;
  return text;
};

export const shareToWhatsApp = async (parte, empresa = {}) => {
  const text = generateWhatsAppText(parte, empresa);

  try {
    // Si el navegador soporta Web Share API (móviles Android/iOS)
    if (navigator.share) {
      await navigator.share({
        title: `Parte Diario - ${parte.obraNombre || 'Obra'}`,
        text: text,
      });
      return { success: true, method: 'web-share' };
    }

    // Fallback: enlace universal WhatsApp Web / App
    const encoded = encodeURIComponent(text);
    const destination = empresa.whatsappEnvio ? empresa.whatsappEnvio.replace(/\D/g, '') : '';
    const whatsappUrl = destination 
      ? `https://wa.me/${destination}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
      
    window.open(whatsappUrl, '_blank');
    return { success: true, method: 'whatsapp-link' };

  } catch (error) {
    console.warn('Error al compartir:', error);
    // Fallback al portapapeles
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard', text };
    }
    return { success: false, error, text };
  }
};

export const shareToEmail = (parte, empresa = {}) => {
  const subject = encodeURIComponent(`Parte Diario de Trabajo - ${parte.obraNombre || 'Obra'} - ${parte.fecha}`);
  const body = encodeURIComponent(generateWhatsAppText(parte, empresa));
  const emailDestino = empresa.email || '';
  
  const mailtoUrl = `mailto:${emailDestino}?subject=${subject}&body=${body}`;
  window.location.href = mailtoUrl;
  return { success: true };
};
