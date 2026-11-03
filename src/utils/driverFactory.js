/**
 * driverFactory.js
 * SRP: única responsabilidad de construir (y verificar) la instancia de WebDriver.
 * DIP: los tests piden un driver sin conocer si el navegador corre en un
 * servidor Selenium remoto (Docker) o local en el host.
 */
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');
const config = require('./config');

/**
 * Espera activa (polling) a que el servidor Selenium acepte conexiones.
 * Nota: esto NO es una espera de UI prohibida por §5.2; es una espera de
 * infraestructura para evitar la carrera entre el arranque del contenedor
 * `chrome` y la ejecución de los tests.
 */
async function waitForSeleniumServer(serverUrl, { attempts = 30, intervalMs = 1000 } = {}) {
  const statusUrl = `${serverUrl.replace(/\/+$/, '')}/status`;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { data } = await axios.get(statusUrl, { timeout: 2000 });
      if (data?.value?.ready) return true;
    } catch {
      // El servidor aún no responde: se reintenta en el siguiente ciclo.
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Selenium no está listo en ${statusUrl} tras ${attempts} intentos`);
}

/**
 * Crea el WebDriver de Chrome.
 * - Con SELENIUM_REMOTE_URL (compose): usa el servicio `chrome` remoto.
 * - Sin él: Chrome local con opciones headless desde config.headless.
 * @returns {Promise<import('selenium-webdriver').WebDriver>}
 */
async function createDriver() {
  const builder = new Builder().forBrowser('chrome');

  if (config.web.seleniumRemoteUrl) {
    await waitForSeleniumServer(config.web.seleniumRemoteUrl);
    builder.usingServer(config.web.seleniumRemoteUrl);
  } else {
    const options = new chrome.Options();
    if (config.headless) options.addArguments('--headless=new');
    options.addArguments('--window-size=1400,900', '--no-sandbox', '--disable-gpu');
    builder.setChromeOptions(options);
  }

  return builder.build();
}

module.exports = { createDriver };
