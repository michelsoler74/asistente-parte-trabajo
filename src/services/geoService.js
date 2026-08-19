/**
 * Servicio de Geolocalización para Partes de Trabajo en Obra Control.
 * Obtiene coordenadas GPS de alta precisión y genera enlaces verificados de Google Maps.
 */

export const getCurrentGPSLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new Error('La geolocalización no es compatible con este dispositivo o navegador.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        const timestamp = new Date(position.timestamp || Date.now()).toISOString();
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        resolve({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          accuracy: Math.round(accuracy),
          altitude: altitude ? Math.round(altitude) : null,
          timestamp,
          mapsUrl
        });
      },
      (error) => {
        let errorMsg = 'Error al obtener la ubicación GPS.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permiso de ubicación denegado por el usuario o navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'La señal GPS no está disponible en este momento.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Tiempo de espera agotado al buscar satélites GPS.';
            break;
          default:
            errorMsg = error.message || errorMsg;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  });
};
