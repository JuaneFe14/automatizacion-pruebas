/**
 * apiClient.js
 * SRP: encapsular todas las peticiones HTTP a la API REST detrás de una
 * abstracción. DIP: los tests dependen de esta interfaz, no de URLs rígidas.
 * OCP: los interceptores permiten añadir logging, reintentos o métricas
 * sin modificar el núcleo del cliente.
 */
const axios = require('axios');
const config = require('../utils/config');

/** Códigos de estado centralizados (Clean Code: sin valores mágicos). */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
});

/**
 * Crea un cliente Axios preconfigurado con la configuración centralizada.
 * @param {object} [overrides] - Permite extender/configurar sin tocar el núcleo (OCP)
 * @returns {import('axios').AxiosInstance}
 */
function createApiClient(overrides = {}) {
  const client = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeoutMs,
    headers: { 'Content-Type': 'application/json' },
    ...overrides,
  });

  // Marca el inicio de cada petición para medir tiempos de respuesta.
  client.interceptors.request.use((requestConfig) => {
    requestConfig.metadata = { startTime: Date.now() };
    return requestConfig;
  });

  // Adjunta durationMs tanto a respuestas exitosas como a errores (400/404).
  const attachDuration = (response) => {
    const startTime = response.config?.metadata?.startTime;
    if (startTime) response.durationMs = Date.now() - startTime;
    return response;
  };

  client.interceptors.response.use(
    (response) => attachDuration(response),
    (error) => {
      if (error.response) attachDuration(error.response);
      return Promise.reject(error);
    }
  );

  return client;
}

module.exports = { createApiClient, HTTP_STATUS };
