/**
 * screenshotHelper.js
 * SRP: exclusivamente captura y gestión de evidencias visuales.
 * No contiene selectores ni lógica de negocio (Clean Code / DRY).
 */
const fs = require('fs/promises');
const path = require('path');
const config = require('./config');

/** Crea el directorio de evidencias si no existe (idempotente). */
async function ensureScreenshotsDir() {
  await fs.mkdir(config.screenshotsDir, { recursive: true });
  return config.screenshotsDir;
}

/**
 * Construye una ruta única y segura por escenario:
 *   <screenshotsDir>/<escenario>_<ISO-timestamp>.png
 */
function buildScreenshotPath(scenarioName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeName = String(scenarioName)
    .toLowerCase()
    .normalize('NFD')                     // Separa las tildes de la letra base
    .replace(/[\u0300-\u036f]/g, '')      // Elimina las tildes (á -> a)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return path.join(config.screenshotsDir, `${safeName}_${timestamp}.png`);
}

/**
 * Toma una captura del navegador y la guarda en disco.
 * @param {{takeScreenshot: () => Promise<string>}} driver - WebDriver activo
 * @param {string} scenarioName - Nombre legible del escenario
 * @returns {Promise<string>} Ruta absoluta del archivo generado
 */
async function captureScreenshot(driver, scenarioName) {
  await ensureScreenshotsDir();
  const filePath = buildScreenshotPath(scenarioName);
  const base64Image = await driver.takeScreenshot();
  await fs.writeFile(filePath, base64Image, 'base64');
  return filePath;
}

module.exports = { ensureScreenshotsDir, buildScreenshotPath, captureScreenshot };
