/**
 * FormPage.js — Vista completa de la pantalla de login.
 * - SRP: orquesta la vista; delega la interacción del formulario en el
 *   componente LoginForm (ISP) y las primitivas en BasePage (LSP).
 * - Los tests dependen de esta interfaz de alto nivel (DIP), no de selectores.
 */
const BasePage = require('./BasePage');
const LoginForm = require('./LoginForm');

const ROUTES = Object.freeze({
  login: '/login',
  secureArea: '/secure',
});

class FormPage extends BasePage {
  /** @param {import('selenium-webdriver').WebDriver} driver */
  constructor(driver) {
    super(driver);
    this.loginForm = new LoginForm(driver);
  }

  /** Abre la pantalla de login. */
  async open() {
    return super.open(ROUTES.login);
  }

  /** Escenario: enviar el formulario con las credenciales indicadas. */
  async loginAs(username, password) {
    await this.loginForm.fillAndSubmit(username, password);
    return this;
  }

  /** Escenario: enviar el formulario con los campos vacíos (frontera). */
  async submitEmptyCredentials() {
    await this.loginForm.fillAndSubmit('', '');
    return this;
  }

  /** Mensaje de retroalimentación mostrado tras el envío. */
  async getFeedbackMessage() {
    return this.loginForm.getFeedbackMessage();
  }

  async isFeedbackSuccessful() {
    return this.loginForm.isFeedbackSuccessful();
  }

  async isFeedbackError() {
    return this.loginForm.isFeedbackError();
  }

  /** true si el navegador quedó en el área segura tras un login válido. */
  async isOnSecureArea() {
    const currentUrl = await this.getCurrentUrl();
    return currentUrl.endsWith(ROUTES.secureArea);
  }
}

module.exports = FormPage;
