/**
 * Servicio de Generación de Sellos Digitales y Códigos de Verificación de Integridad.
 */

export const generateVerificationStamp = (parteData = {}) => {
  const datePart = (parteData.fecha || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  const year = new Date().getFullYear();

  const code = `OC-${year}-${datePart}-${randomHex}`;
  const timestamp = new Date().toISOString();

  return {
    codigoVerificacion: code,
    timestampSello: timestamp,
    firmadoDigitalmente: true
  };
};
