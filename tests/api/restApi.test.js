/**
 * restApi.test.js — Suite de pruebas funcionales para la API REST (DummyJSON).
 *
 * Cubre los criterios de la §6.A de AGENTS.md:
 *  - Códigos de estado: 200, 201, 400 y 404.
 *  - Estructura del cuerpo de respuesta (propiedades clave con expect.objectContaining).
 *  - Tiempos de respuesta menores al timeout centralizado (config.api.timeoutMs).
 *  - Escenario feliz (datos válidos) y escenario negativo (datos inválidos).
 *
 * SRP: el test solo declara flujo y aserciones; el HTTP vive en apiClient (DIP).
 */
const { createApiClient, HTTP_STATUS } = require('../../src/api/apiClient');
const config = require('../../src/utils/config');

/** Credenciales sintéticas inexistentes para el escenario negativo. */
const INVALID_CREDENTIALS = Object.freeze({
  username: 'usuario_del_taller_que_no_existe',
  password: 'clave_invalida_del_taller',
});

/** Payload válido para la creación de un producto (escenario feliz). */
const VALID_PRODUCT = Object.freeze({
  title: 'Cuaderno de pruebas automatizadas',
  price: 12.5,
  stock: 25,
  category: 'stationery',
});

describe('API REST DummyJSON - Lectura de productos', () => {
  let api;

  beforeAll(() => {
    api = createApiClient();
  });

  test('GET /products/1 debería retornar 200 con la estructura del producto y tiempo de respuesta aceptable', async () => {
    const response = await api.get('/products/1');

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.data).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        price: expect.any(Number),
        stock: expect.any(Number),
        category: expect.any(String),
        images: expect.any(Array),
      })
    );
    expect(response.durationMs).toBeLessThan(config.api.timeoutMs);
  });

  test('GET /products/9999 debería retornar 404 para un recurso inexistente', async () => {
    const error = await api.get('/products/9999').catch((caught) => caught);

    expect(error.response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(error.response.durationMs).toBeLessThan(config.api.timeoutMs);
  });
});

describe('API REST DummyJSON - Creación de productos', () => {
  let api;

  beforeAll(() => {
    api = createApiClient();
  });

  test('POST /products/add con datos válidos debería retornar 201 y el id generado', async () => {
    const response = await api.post('/products/add', VALID_PRODUCT);

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(response.data).toEqual(
      expect.objectContaining({ id: expect.any(Number) })
    );
    expect(response.durationMs).toBeLessThan(config.api.timeoutMs);
  });
});

describe('API REST DummyJSON - Escenario negativo de autenticación', () => {
  let api;

  beforeAll(() => {
    api = createApiClient();
  });

  test('POST /auth/login con credenciales inválidas debería retornar 400 con mensaje de error', async () => {
    const error = await api
      .post('/auth/login', INVALID_CREDENTIALS)
      .catch((caught) => caught);

    expect(error.response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(error.response.data).toEqual(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(error.response.durationMs).toBeLessThan(config.api.timeoutMs);
  });
});
