const DEFAULT_BACKEND_URL = "http://localhost:8000";

// En local usa localhost; en Vercel se reemplaza con REACT_APP_BACKEND_URL.
const backendBaseUrl = (
  process.env.REACT_APP_BACKEND_URL ||
  DEFAULT_BACKEND_URL
).replace(/\/+$/, "");

// Todas las llamadas de frontend se construyen desde esta base para no repetir URLs.
export const API = `${backendBaseUrl}/api`;
