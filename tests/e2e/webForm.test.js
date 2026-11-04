/**
 * webForm.test.js — Suite E2E del formulario de login (the-internet.herokuapp.com).
 *
 * Cubre los criterios de la §6.B de AGENTS.md:
 *  - Interacción real del usuario (escribir, limpiar, clic) vía POM.
 *  - Aserciones sobre mensajes de éxito y de validación de error.
 *  - Datos de frontera: campos vacíos, mayúsculas (case-sensitive),
 *    contraseña incorrecta/vacía.
 *
 * Reglas §5.3: driver.quit() garantizado en afterAll + captura automática
 * de evidencia cuando un escenario falla.
 * Reglas §5.2: sin pausas fijas; todas las esperas son explícitas (BasePage).
 */
jest.setTimeout(30000); // Margen para varias esperas explícitas por escenario

const FormPage = require('../../src/pages/FormPage');
const { createDriver } = require('../../src/utils/driverFactory');
const { captureScreenshot } = require('../../src/utils/screenshotHelper');
const config = require('../../src/utils/config');

/** Mensajes reales verificados contra la página (Clean Code: centralizados). */
const FEEDBACK_MESSAGES = Object.freeze({
  secureArea: 'You logged into a secure area!',
  invalidUsername: 'Your username is invalid!',
  invalidPassword: 'Your password is invalid!',
});

/** @type {import('selenium-webdriver').WebDriver} */
let driver;
let formPage;

// Aislamiento total por test (§6.B + §5.3): cada escenario recibe una
// sesión de navegador NUEVA — sin cookies, caché ni estado de navegación
// heredado — y garantiza driver.quit() en afterEach aunque el test falle.
beforeEach(async () => {
  driver = await createDriver();
  formPage = new FormPage(driver);
});

afterEach(async () => {
  if (driver) await driver.quit();
});

/**
 * Envuelve un escenario: si falla, guarda una captura de evidencia
 * (DRY: un único try/catch para toda la suite) y relanza el error.
 */
const withEvidence = (scenarioName, scenario) => async () => {
  try {
    await scenario();
  } catch (error) {
    try {
      const evidencePath = await captureScreenshot(driver, scenarioName);
      console.error(`Evidencia del fallo: ${evidencePath}`);
    } catch {
      // Si ni siquiera hay navegador, no enmascaramos el error original.
    }
    throw error;
  }
};

describe('E2E - Formulario de login (The Internet)', () => {
  test(
    'login con credenciales válidas debería mostrar éxito y navegar al área segura',
    withEvidence('login-credenciales-validas', async () => {
      await formPage.open();
      await formPage.loginAs(config.credentials.username, config.credentials.password);

      expect(await formPage.getFeedbackMessage()).toContain(FEEDBACK_MESSAGES.secureArea);
      expect(await formPage.isFeedbackSuccessful()).toBe(true);
      expect(await formPage.isOnSecureArea()).toBe(true);
    })
  );

  test(
    'login con usuario inexistente debería mostrar mensaje de error',
    withEvidence('login-usuario-inexistente', async () => {
      await formPage.open();
      await formPage.loginAs('usuario_que_no_existe', config.credentials.password);

      expect(await formPage.getFeedbackMessage()).toContain(FEEDBACK_MESSAGES.invalidUsername);
      expect(await formPage.isFeedbackError()).toBe(true);
      expect(await formPage.isOnSecureArea()).toBe(false);
    })
  );

  test(
    'envío con campos vacíos (frontera) debería rechazarlo con validación de error',
    withEvidence('login-campos-vacios', async () => {
      await formPage.open();
      await formPage.submitEmptyCredentials();

      expect(await formPage.getFeedbackMessage()).toContain(FEEDBACK_MESSAGES.invalidUsername);
      expect(await formPage.isFeedbackError()).toBe(true);
      expect(await formPage.isOnSecureArea()).toBe(false);
    })
  );

  test(
    'usuario en MAYÚSCULAS (frontera case-sensitive) debería rechazarse',
    withEvidence('login-usuario-mayusculas', async () => {
      await formPage.open();
      await formPage.loginAs(config.credentials.username.toUpperCase(), config.credentials.password);

      expect(await formPage.getFeedbackMessage()).toContain(FEEDBACK_MESSAGES.invalidUsername);
      expect(await formPage.isFeedbackError()).toBe(true);
    })
  );

  test(
    'contraseña incorrecta (frontera) debería mostrar error de contraseña inválida',
    withEvidence('login-password-incorrecta', async () => {
      await formPage.open();
      await formPage.loginAs(config.credentials.username, 'clave_incorrecta_del_taller');

      expect(await formPage.getFeedbackMessage()).toContain(FEEDBACK_MESSAGES.invalidPassword);
      expect(await formPage.isFeedbackError()).toBe(true);
      expect(await formPage.isOnSecureArea()).toBe(false);
    })
  );
});
