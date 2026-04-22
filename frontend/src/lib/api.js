const DEFAULT_BACKEND_URL = "http://localhost:8000";

const backendBaseUrl = (
  process.env.REACT_APP_BACKEND_URL ||
  DEFAULT_BACKEND_URL
).replace(/\/+$/, "");

export const API = `${backendBaseUrl}/api`;
