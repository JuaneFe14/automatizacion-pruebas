/**
 * config.js
 * SRP: única responsabilidad de leer y validar la configuración desde
 * process.env. Ningún test ni página debe leer process.env directamente
 * ni incrustar URLs/timeouts (Clean Code: sin valores mágicos).
 *
 * Las variables son inyectadas por docker-compose.yml (ver .env.example).
 */
const path = require('path');

/** Valores por defecto: solo se usan si la variable no está inyectada. */
const DEFAULTS = Object.freeze({
  API_BASE_URL: 'https://dummyjson.com',
  API_TIMEOUT_MS: 10000,
  WEB_BASE_URL: 'https://the-internet.herokuapp.com',
  WEB_LOAD_TIMEOUT_MS: 10000,
  VALID_USERNAME: 'tomsmith',
  VALID_PASSWORD: 'SuperSecretPassword!',
  HEADLESS: 'true',
  SCREENSHOTS_DIR: './evidence/screenshots',
});

function readString(rawValue, fallback) {
  return rawValue !== undefined && rawValue !== '' ? rawValue : fallback;
}

function readPositiveNumber(rawValue, fallback) {
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readBoolean(rawValue, fallback) {
  if (rawValue === undefined || rawValue === '') return fallback;
  return String(rawValue).toLowerCase() === 'true';
}

function removeTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

const config = Object.freeze({
  api: Object.freeze({
    baseUrl: removeTrailingSlash(readString(process.env.API_BASE_URL, DEFAULTS.API_BASE_URL)),
    timeoutMs: readPositiveNumber(process.env.API_TIMEOUT_MS, DEFAULTS.API_TIMEOUT_MS),
  }),
  web: Object.freeze({
    baseUrl: removeTrailingSlash(readString(process.env.WEB_BASE_URL, DEFAULTS.WEB_BASE_URL)),
    loadTimeoutMs: readPositiveNumber(process.env.WEB_LOAD_TIMEOUT_MS, DEFAULTS.WEB_LOAD_TIMEOUT_MS),
    // Vacío => Chrome local; con compose se inyecta http://chrome:4444/wd/hub
    seleniumRemoteUrl: removeTrailingSlash(readString(process.env.SELENIUM_REMOTE_URL, '')),
  }),
  credentials: Object.freeze({
    username: readString(process.env.VALID_USERNAME, DEFAULTS.VALID_USERNAME),
    password: readString(process.env.VALID_PASSWORD, DEFAULTS.VALID_PASSWORD),
  }),
  headless: readBoolean(process.env.HEADLESS, readBoolean(DEFAULTS.HEADLESS, true)),
  screenshotsDir: path.resolve(
    readString(process.env.SCREENSHOTS_DIR, DEFAULTS.SCREENSHOTS_DIR)
  ),
});

module.exports = config;
