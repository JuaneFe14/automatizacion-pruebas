/**
 * LoginForm.js — Componente reutilizable del formulario de acceso.
 * - ISP: componente pequeño y enfocado (solo el formulario), evitando
 *   clases monolíticas de POM.
 * - DRY: concentra TODOS los selectores del formulario en un único lugar;
 *   los tests nunca usan By.* directamente.
 * - LSP: extiende BasePage y cumple su contrato (waitFor*, typeInto...).
 */
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

/** Selectores centralizados (DRY) — verificados contra el HTML real. */
const LOCATORS = Object.freeze({
  username: By.id('username'),
  password: By.id('password'),
  submitButton: By.css('button[type="submit"]'),
  flashMessage: By.id('flash'),
});

class LoginForm extends BasePage {
  async typeUsername(username) {
    return this.typeInto(LOCATORS.username, username);
  }

  async typePassword(password) {
    return this.typeInto(LOCATORS.password, password);
  }

  async submit() {
    return this.clickOn(LOCATORS.submitButton);
  }

  /** Interacción completa del usuario: llenar ambos campos y enviar. */
  async fillAndSubmit(username, password) {
    await this.typeUsername(username);
    await this.typePassword(password);
    await this.submit();
    return this;
  }

  /** Mensaje de éxito/error mostrado tras el envío (espera explícita). */
  async getFeedbackMessage() {
    return this.getTextOf(LOCATORS.flashMessage);
  }

  /** true si el flash tiene la clase CSS 'success' (área segura). */
  async isFeedbackSuccessful() {
    const element = await this.waitForVisible(LOCATORS.flashMessage);
    const cssClasses = await element.getAttribute('class');
    return cssClasses.split(/\s+/).includes('success');
  }

  /** true si el flash tiene la clase CSS 'error' (validación fallida). */
  async isFeedbackError() {
    const element = await this.waitForVisible(LOCATORS.flashMessage);
    const cssClasses = await element.getAttribute('class');
    return cssClasses.split(/\s+/).includes('error');
  }
}

module.exports = LoginForm;
