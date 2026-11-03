/**
 * BasePage.js
 * - LSP: cualquier página o componente hijo sustituye a esta base sin
 *   alterar su contrato (mismos métodos, mismo comportamiento).
 * - SRP: solo expone primitivas genéricas de espera e interacción;
 *   ninguna lógica de vistas concretas ni selectores de negocio.
 * - §5.2: esperas EXPLÍCITAS con until.* — prohibido setTimeout/pausas fijas.
 */
const { until } = require('selenium-webdriver');
const config = require('../utils/config');

class BasePage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    this.driver = driver;
    this.loadTimeoutMs = config.web.loadTimeoutMs;
  }

  /** Navega a una ruta relativa de WEB_BASE_URL y espera a que quede asentada. */
  async open(path = '') {
    const targetUrl = `${config.web.baseUrl}${path}`;
    await this.driver.get(targetUrl);
    // Defensa: si una navegación previa aún estaba en curso y compitió con
    // esta, reintentamos hasta aterrizar en la ruta solicitada.
    if ((await this.driver.getCurrentUrl()) !== targetUrl) {
      await this.driver.get(targetUrl);
    }
    await this.waitForDocumentToSettle();
    return this;
  }

  /** Espera explícita a que el documento esté completo y sin cargas en curso. */
  async waitForDocumentToSettle() {
    await this.driver.wait(
      async () => (await this.driver.executeScript('return document.readyState')) === 'complete',
      this.loadTimeoutMs
    );
    return this;
  }

  /** Espera explícita a que el elemento exista en el DOM y lo devuelve. */
  async waitForLocated(locator) {
    try {
      await this.driver.wait(until.elementLocated(locator), this.loadTimeoutMs);
    } catch (error) {
      // Diagnóstico: dónde estaba el navegador cuando el elemento no apareció.
      const currentUrl = await this.driver.getCurrentUrl().catch(() => '(desconocida)');
      const title = await this.driver.getTitle().catch(() => '(desconocida)');
      throw new Error(
        `Elemento ${locator} no apareció en ${this.loadTimeoutMs}ms. ` +
        `URL actual: ${currentUrl} | Título: ${title}`
      );
    }
    return this.driver.findElement(locator);
  }

  /** Espera explícita a que el elemento exista Y sea visible, y lo devuelve. */
  async waitForVisible(locator) {
    const element = await this.waitForLocated(locator);
    await this.driver.wait(until.elementIsVisible(element), this.loadTimeoutMs);
    return element;
  }

  /** Limpia y escribe texto en un campo (devuelve this → encadenable). */
  async typeInto(locator, text) {
    const element = await this.waitForVisible(locator);
    await element.clear();
    await element.sendKeys(text);
    return this;
  }

  /**
   * Espera a que el elemento sea visible, hace clic y —si el clic dispara
   * navegación— espera a que el nuevo documento quede completamente cargado.
   * Sin esto, el siguiente comando competiría con la navegación en curso
   * (clics perdidos, URLs equivocadas). Devuelve this (encadenable).
   */
  async clickOn(locator) {
    const element = await this.waitForVisible(locator);
    await element.click();
    try {
      await this.driver.wait(until.stalenessOf(element), this.loadTimeoutMs);
      await this.waitForDocumentToSettle();
    } catch {
      // El clic no disparó navegación (p. ej. validación en cliente): continuamos.
    }
    return this;
  }

  /** Devuelve el texto visible de un elemento, sin espacios sobrantes. */
  async getTextOf(locator) {
    const element = await this.waitForVisible(locator);
    return (await element.getText()).trim();
  }

  /** Devuelve la URL actual del navegador (para aserciones de navegación). */
  async getCurrentUrl() {
    return this.driver.getCurrentUrl();
  }
}

module.exports = BasePage;
